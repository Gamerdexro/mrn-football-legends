import { Vector3 } from 'three';

export type ContactSurface = 'INSIDE_FOOT' | 'OUTSIDE_FOOT' | 'LACES' | 'HEADER';

export interface BallMechanismState {
  positionVector: Vector3;
  velocityVector: Vector3;
  spinVector: Vector3;
  contactSurface: ContactSurface;
  lastTouchPlayer: string | null;
  airTime: number;
}

export interface ShotComputationInput {
  inputPower: number;
  playerShotPowerStat: number;
  balanceFactor: number;
  staminaRatio: number;
  forwardDirection: Vector3;
  shootingAngleRadians: number;
  distanceFromGoal: number;
  spinStat: number;
  inputSwipeAngle: number;
  contactOffset: number;
  isSprinting: boolean;
  underPressure: boolean;
  bodyTurnSharpness: number;
  contactSurface: ContactSurface;
}

export interface PassComputationInput {
  inputPower: number;
  passingStat: number;
  balanceFactor: number;
  passDistance: number;
  receiverMovementSpeed: number;
  interceptionLaneDensity: number;
  passerDirection: Vector3;
  receiverFuturePosition: Vector3;
}

export interface DribbleInput {
  baseRadius: number;
  dribbleStat: number;
  currentSpeed: number;
  controlStat: number;
  ballSpeed: number;
}

export interface BallShotResult {
  forceVector: Vector3;
  spinVector: Vector3;
  shotPower: number;
  effectiveAccuracy: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const safeNormalize = (v: Vector3): Vector3 => {
  if (v.lengthSq() < 1e-6) {
    return new Vector3(1, 0, 0);
  }
  return v.clone().normalize();
};

export class AdvancedBallMechanism {
  private readonly magnusCoefficientHigh = 0.24;
  private readonly magnusCoefficientLow = 0.12;
  private readonly airDragBase = 0.028;
  private readonly surfaceFriction = 0.42;
  private readonly restitutionCoefficient = 0.72;

  computeShot(input: ShotComputationInput): BallShotResult {
    const staminaFactor = input.staminaRatio < 0.3 ? 1 - (0.3 - input.staminaRatio) * 0.6667 : 1;
    const balancePenalty =
      (input.isSprinting ? 0.16 : 0) +
      (input.underPressure ? 0.14 : 0) +
      Math.min(0.18, input.bodyTurnSharpness * 0.2);
    const effectiveBalance = clamp01(input.balanceFactor - balancePenalty);
    const shotPower = input.inputPower * input.playerShotPowerStat * effectiveBalance * staminaFactor;
    const angleFactor = Math.max(0.05, Math.cos(input.shootingAngleRadians));
    const distancePenalty = Math.max(0, (input.distanceFromGoal - 18) / 60);
    const effectiveAccuracy = clamp01(0.92 * angleFactor - distancePenalty * 0.55);

    const spinVector = new Vector3(
      Math.cos(input.inputSwipeAngle) * input.spinStat * input.contactOffset,
      0,
      Math.sin(input.inputSwipeAngle) * input.spinStat * input.contactOffset
    ).multiplyScalar(0.11);

    const direction = safeNormalize(input.forwardDirection);
    const curveDirection = new Vector3(-direction.z, 0, direction.x);
    const curveModifier = curveDirection.multiplyScalar(spinVector.length() * 0.06);
    const forceVector = direction.multiplyScalar(shotPower * 0.028).add(curveModifier);

    if (input.contactSurface === 'INSIDE_FOOT') {
      forceVector.y += 0.35;
    } else if (input.contactSurface === 'OUTSIDE_FOOT') {
      forceVector.y += 0.18;
    } else if (input.contactSurface === 'LACES') {
      forceVector.y += 0.1;
    } else {
      forceVector.y += 0.45;
    }

    return { forceVector, spinVector, shotPower, effectiveAccuracy };
  }

  computePass(input: PassComputationInput): {
    passForce: number;
    passVector: Vector3;
    accuracy: number;
    throughTargetPosition: Vector3;
  } {
    const passForce = input.inputPower * input.passingStat * input.balanceFactor;
    const lanePenalty = clamp01(input.interceptionLaneDensity);
    const distancePenalty = clamp01(input.passDistance / 55);
    const speedPenalty = clamp01(input.receiverMovementSpeed / 12) * 0.35;
    const accuracy = clamp01(1 - lanePenalty * 0.5 - distancePenalty * 0.35 - speedPenalty);
    const predictionTime = 0.18 + clamp01(passForce / 100) * 0.55;
    const leadDistance = input.receiverMovementSpeed * predictionTime;
    const forward = safeNormalize(input.passerDirection);
    const throughTargetPosition = input.receiverFuturePosition.clone().add(forward.multiplyScalar(leadDistance));
    const passVector = safeNormalize(throughTargetPosition.clone().sub(input.receiverFuturePosition))
      .multiplyScalar(passForce * 0.018);

    return { passForce, passVector, accuracy, throughTargetPosition };
  }

  computeDribbleControl(input: DribbleInput): {
    tetherRadius: number;
    badFirstTouch: boolean;
  } {
    const base = input.baseRadius - input.dribbleStat * 0.01;
    const speedExpansion = Math.max(0, input.currentSpeed - 5) * 0.03;
    const tetherRadius = Math.max(0.28, base + speedExpansion);
    const ratio = input.controlStat > 0 ? input.ballSpeed / input.controlStat : 1;
    const threshold = 0.16 + (100 - input.dribbleStat) * 0.0025;
    const badFirstTouch = ratio > threshold;
    return { tetherRadius, badFirstTouch };
  }

  applyMagnusAndDrag(
    velocity: Vector3,
    spinVector: Vector3,
    dt: number,
    quality: 'LOW' | 'HIGH'
  ): Vector3 {
    const next = velocity.clone();
    const magnus = spinVector
      .clone()
      .cross(next)
      .multiplyScalar((quality === 'HIGH' ? this.magnusCoefficientHigh : this.magnusCoefficientLow) * dt);
    next.add(magnus);

    const speedSq = Math.max(0, next.lengthSq());
    const drag = this.airDragBase * speedSq * dt;
    if (next.lengthSq() > 1e-5) {
      next.add(next.clone().normalize().multiplyScalar(-drag));
    }

    return next;
  }

  applyGroundFriction(velocity: Vector3, dt: number): Vector3 {
    const next = velocity.clone();
    const horizontal = new Vector3(next.x, 0, next.z);
    if (horizontal.lengthSq() > 1e-6) {
      const frictionDelta = this.surfaceFriction * dt;
      const reduced = Math.max(0, horizontal.length() - frictionDelta);
      const dir = horizontal.normalize();
      next.x = dir.x * reduced;
      next.z = dir.z * reduced;
    }
    return next;
  }

  resolvePostCollision(velocity: Vector3, collisionNormal: Vector3): Vector3 {
    const normal = safeNormalize(collisionNormal);
    const reflected = velocity.clone().sub(normal.multiplyScalar(2 * velocity.dot(normal)));
    return reflected.multiplyScalar(this.restitutionCoefficient);
  }

  dampenOnNetCollision(velocity: Vector3): Vector3 {
    return velocity.clone().multiplyScalar(0.42);
  }
}
