import React, { useEffect, useRef } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Text } from '@react-three/drei';
import { useControlStore } from '../controls/useControlStore';
import { getKitForPlayer } from '../../data/jerseys';
import rawPlayers from '../../data/players.json';
import { useMatchStore } from '../../store/useMatchStore';
import { activeMatchMonitor } from '../../services/rank/PerformanceMonitor';

type PlayerStats = {
    speed?: number;
    dribbling?: number;
    ball_control?: number;
    physical?: number;
    stamina?: number;
};

type PlayerMeta = {
    id: string;
    name: string;
    rarity: string;
    stats?: PlayerStats;
    skills?: string[];
};

type FaceConfig = {
    skinColor: string;
    hairColor: string;
    hasHair: boolean;
};

type SkillId =
    | 'BODY_FEINT'
    | 'STEP_OVER'
    | 'BALL_ROLL'
    | 'DRAG_BACK'
    | 'HEEL_FLICK'
    | 'ROULETTE'
    | 'FAKE_SHOT'
    | 'ELASTICO'
    | 'REVERSE_ELASTICO'
    | 'NUTMEG_PUSH'
    | 'SCOOP_TURN'
    | 'MCGEADY_SPIN'
    | 'DRAG_STEPOVER'
    | 'FAKE_PASS'
    | 'STOP_AND_GO';

const players = rawPlayers as PlayerMeta[];

const playerMap: Record<string, PlayerMeta> = {};

for (const p of players) {
    playerMap[p.id] = p;
}

const SPEED_MIN_STAT = 50;
const SPEED_MAX_STAT = 140;
const WALK_MIN = 4.5;
const WALK_MAX = 6;
const SPRINT_MIN = 9;
const SPRINT_MAX = 12;
const SHOT_ANIM_DURATION = 0.8;

const getSpeedScale = (stat: number) => {
    const clamped = Math.min(Math.max(stat, SPEED_MIN_STAT), SPEED_MAX_STAT);
    return (clamped - SPEED_MIN_STAT) / (SPEED_MAX_STAT - SPEED_MIN_STAT);
};

const facePresets: FaceConfig[] = [
    { skinColor: '#f5d3b3', hairColor: '#3e2723', hasHair: true },
    { skinColor: '#f0c29b', hairColor: '#4e342e', hasHair: true },
    { skinColor: '#e0b89c', hairColor: '#6d4c41', hasHair: true },
    { skinColor: '#d9a677', hairColor: '#212121', hasHair: true },
    { skinColor: '#c48e6a', hairColor: '#5d4037', hasHair: false },
    { skinColor: '#b07b55', hairColor: '#4e342e', hasHair: true },
    { skinColor: '#a86b4c', hairColor: '#263238', hasHair: true },
    { skinColor: '#9b5e3b', hairColor: '#000000', hasHair: true },
    { skinColor: '#8d5a3b', hairColor: '#000000', hasHair: false },
    { skinColor: '#7a4b32', hairColor: '#1b1b1b', hasHair: true },
    { skinColor: '#f7e0ce', hairColor: '#795548', hasHair: false },
    { skinColor: '#f2c4b5', hairColor: '#8d6e63', hasHair: true },
    { skinColor: '#e1ad92', hairColor: '#3e2723', hasHair: false },
    { skinColor: '#cf956a', hairColor: '#546e7a', hasHair: true },
    { skinColor: '#b9764a', hairColor: '#37474f', hasHair: false },
    { skinColor: '#a86b4c', hairColor: '#212121', hasHair: false },
    { skinColor: '#8b5a3c', hairColor: '#9e9e9e', hasHair: true },
    { skinColor: '#f3d1b0', hairColor: '#ffeb3b', hasHair: true },
    { skinColor: '#deb48c', hairColor: '#607d8b', hasHair: true },
    { skinColor: '#c58c5b', hairColor: '#455a64', hasHair: false }
];

const getFaceForPlayer = (playerId: string): FaceConfig => {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
        hash = (hash * 31 + playerId.charCodeAt(i)) | 0;
    }
    const index = Math.abs(hash) % facePresets.length;
    return facePresets[index];
};

interface PlayerProps {
    playerId: string;
    onPositionChange?: (position: [number, number, number]) => void;
}

export const Player = ({ playerId, onPositionChange }: PlayerProps) => {
    const { input } = useControlStore();
    const { camera } = useThree();
    const forward = new Vector3();
    const right = new Vector3();
    const moveDir = new Vector3();
    const up = new Vector3(0, 1, 0);
    const desiredVelocity = new Vector3();
    const kit = getKitForPlayer(playerId);
    const meta = playerMap[playerId];
    const face = getFaceForPlayer(playerId);
    const displayName = meta ? meta.name.toUpperCase() : 'PLAYER';
    const displayNumber = kit.number.toString().padStart(2, '0');
    const currentVelocity = useRef(new Vector3(0, 0, 0));
    const positionRef = useRef(new Vector3(0, 1, 5));
    const phaseRef = useRef(0);
    const leftLegRef = useRef<any>(null);
    const rightLegRef = useRef<any>(null);
    const leftShinRef = useRef<any>(null);
    const rightShinRef = useRef<any>(null);
    const leftArmRef = useRef<any>(null);
    const rightArmRef = useRef<any>(null);
    const leftForearmRef = useRef<any>(null);
    const rightForearmRef = useRef<any>(null);
    const headRef = useRef<any>(null);
    const hasBallRef = useRef(false);
    const lastMovementActionAtRef = useRef(0);

    const [stamina, setStamina] = React.useState(1);
    const staminaRef = useRef(1);
    const balanceRef = useRef(1);
    const facingRef = useRef(new Vector3(0, 0, -1));
    const shootHeldRef = useRef(false);
    const activeSkillRef = useRef<SkillId | null>(null);
    const skillTimerRef = useRef(0);
    const skillHeldRef = useRef(false);
    const shotAnimTimerRef = useRef(0);

    const { ballPosition, triggerShot, defenderPosition, homeMomentum, ballState, activeCelebration, setBallOwnership } = useMatchStore((state) => ({
        ballPosition: state.ballPosition,
        triggerShot: state.triggerShot,
        defenderPosition: state.defenderPosition,
        homeMomentum: state.homeMomentum,
        ballState: state.ballState,
        activeCelebration: state.activeCelebration,
        setBallOwnership: state.setBallOwnership
    }));

    const stats = (meta?.stats ?? {}) as PlayerStats;
    const baseSpeedStat = (stats.speed ?? 60) as number;
    const dribblingStat = (stats.dribbling ?? baseSpeedStat) as number;
    const ballControlStat = (stats.ball_control ?? dribblingStat) as number;
    const staminaStat = (stats.stamina ?? 60) as number;
    const speedScale = getSpeedScale(baseSpeedStat);
    const accelScale = getSpeedScale((baseSpeedStat + staminaStat) * 0.5);
    const agilityScale = getSpeedScale((dribblingStat + ballControlStat) * 0.5);
    const walkBase = WALK_MIN + (WALK_MAX - WALK_MIN) * speedScale;
    const sprintBase = SPRINT_MIN + (SPRINT_MAX - SPRINT_MIN) * speedScale;
    const shootingStat = (stats as any).shooting ?? baseSpeedStat;
    const passingStat = (stats as any).passing ?? baseSpeedStat;

    const [ref, api] = useSphere(() => ({
        mass: 70,
        position: [0, 1, 5],
        args: [0.5],
        linearDamping: 0.9,
        fixedRotation: true,
        material: { friction: 0.0, restitution: 0.0 }
    }));

    useEffect(() => {
        const unsubscribe = api.position.subscribe((v) => {
            positionRef.current.set(v[0], v[1], v[2]);
            if (onPositionChange) {
                onPositionChange([v[0], v[1], v[2]]);
            }
        });
        return unsubscribe;
    }, [api.position, onPositionChange]);

    const passHeldRef = useRef(false);

    useFrame((_, delta) => {
        const tight = input.tightDribble;
        const momentumBoost = 0.9 + homeMomentum * 0.2;
        const walkSpeed = walkBase * (tight ? 0.55 : 1) * momentumBoost;
        const sprintSpeed = sprintBase * (tight ? 0.8 : 1) * momentumBoost;
        const pressing = input.tackle;
        const sprinting = input.sprint || pressing;
        let balance = balanceRef.current;
        const baseAccel = sprinting ? 16 : 10;
        const sprintPenalty = sprinting ? 0.35 : 0;
        const accel = baseAccel * (0.7 + 0.6 * accelScale) * (1 - sprintPenalty) * (0.5 + 0.5 * balance);
        const decel = 18 * (0.7 + 0.6 * agilityScale);

        forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        if (forward.lengthSq() === 0) return;
        forward.normalize();

        right.copy(forward).cross(up).normalize();

        moveDir.set(0, 0, 0);
        moveDir.addScaledVector(forward, input.moveY);
        moveDir.addScaledVector(right, input.moveX);

        const moving = moveDir.lengthSq() > 0;

        const prevFacing = facingRef.current.clone();
        if (moving) {
            const dir = moveDir.clone().normalize();
            facingRef.current.copy(dir);
        }

        const facingNow = facingRef.current.clone();
        const dot = Math.max(-1, Math.min(1, prevFacing.dot(facingNow)));
        const deltaTheta = Math.acos(dot);

        let nextStamina = staminaRef.current;
        if (input.sprint && moving) {
            nextStamina -= 0.4 * delta;
        } else {
            nextStamina += 0.3 * delta;
        }
        if (nextStamina < 0) nextStamina = 0;
        if (nextStamina > 1) nextStamina = 1;
        if (nextStamina !== staminaRef.current) {
            staminaRef.current = nextStamina;
            setStamina(nextStamina);
        }

        const staminaFactor = 0.6 + 0.4 * staminaRef.current;
        const maxSpeed = (sprinting ? sprintSpeed : walkSpeed) * staminaFactor;

        if (sprinting && moving) {
            balance -= 0.6 * delta;
        }

        const turnLoss = deltaTheta * (1 - balance);
        balance -= turnLoss * 0.5;

        const v = currentVelocity.current;
        const speed = Math.sqrt(v.x * v.x + v.z * v.z);

        if (!sprinting && speed < walkSpeed * 0.6) {
            balance += 0.4 * delta;
        }

        if (balance < 0) balance = 0;
        if (balance > 1) balance = 1;
        balanceRef.current = balance;

        if (moving) {
            desiredVelocity.copy(moveDir).normalize().multiplyScalar(maxSpeed);
        } else {
            desiredVelocity.set(0, 0, 0);
        }

        const toGoal = new Vector3(57.5, positionRef.current.y, 0).sub(positionRef.current);
        const distToGoal = toGoal.length();
        const goalDir = distToGoal > 0 ? toGoal.clone().multiplyScalar(1 / distToGoal) : new Vector3(1, 0, 0);

        const toDesiredX = desiredVelocity.x - v.x;
        const toDesiredZ = desiredVelocity.z - v.z;
        const distanceSq = toDesiredX * toDesiredX + toDesiredZ * toDesiredZ;

        if (distanceSq > 0) {
            const distance = Math.sqrt(distanceSq);
            const movingSameDirection = v.x * toDesiredX + v.z * toDesiredZ > 0;
            const rate = movingSameDirection ? accel : decel;
            const maxDelta = rate * delta;
            const scale = distance > maxDelta ? maxDelta / distance : 1;
            v.x += toDesiredX * scale;
            v.z += toDesiredZ * scale;
        }

        if (skillTimerRef.current > 0) {
            skillTimerRef.current -= delta;
            if (skillTimerRef.current <= 0) {
                skillTimerRef.current = 0;
                activeSkillRef.current = null;
            }
        }

        const ballPos = new Vector3(ballPosition[0], ballPosition[1], ballPosition[2]);
        const toBall = ballPos.clone().sub(positionRef.current);
        const dBall = toBall.length();
        const hasBall = dBall < 2;
        const prevHasBall = hasBallRef.current;
        if (hasBall && !prevHasBall) {
            setBallOwnership('HOME', playerId);
        }
        hasBallRef.current = hasBall;

        const defenderPos = new Vector3(defenderPosition[0], defenderPosition[1], defenderPosition[2]);
        const toDefender = defenderPos.clone().sub(positionRef.current);
        const dDef = toDefender.length();
        let pressure = 0;
        if (dDef < 18) {
            const blockDir = toDefender.lengthSq() > 0 ? toDefender.clone().normalize() : goalDir.clone();
            const alignBlock = Math.max(0, goalDir.dot(blockDir));
            const distanceFactor = Math.max(0, 1 - dDef / 18);
            pressure = Math.max(0, Math.min(1, distanceFactor * (0.4 + 0.6 * alignBlock)));
        }

        if (prevHasBall && !hasBall) {
            activeMatchMonitor.recordAction({
                type: 'POSSESSION',
                success: false,
                context: {
                    underPressure: pressure > 0.55,
                    difficulty: pressure,
                    location: {
                        x: Math.max(0, Math.min(1, (positionRef.current.x + 57.5) / 115)),
                        y: Math.max(0, Math.min(1, (positionRef.current.z + 37.5) / 75))
                    }
                }
            });
        } else if (!prevHasBall && hasBall) {
            activeMatchMonitor.recordAction({
                type: 'POSSESSION',
                success: true,
                context: {
                    underPressure: pressure > 0.55,
                    difficulty: pressure,
                    location: {
                        x: Math.max(0, Math.min(1, (positionRef.current.x + 57.5) / 115)),
                        y: Math.max(0, Math.min(1, (positionRef.current.z + 37.5) / 75))
                    }
                }
            });
        }

        if (moving) {
            const now = Date.now();
            if (now - lastMovementActionAtRef.current > 2000) {
                activeMatchMonitor.recordAction({
                    type: 'MOVEMENT',
                    success: true,
                    context: {
                        underPressure: pressure > 0.55,
                        difficulty: pressure,
                        location: {
                            x: Math.max(0, Math.min(1, (positionRef.current.x + 57.5) / 115)),
                            y: Math.max(0, Math.min(1, (positionRef.current.z + 37.5) / 75))
                        }
                    }
                });
                lastMovementActionAtRef.current = now;
            }
        }

        const controlQuality = Math.max(
            0,
            Math.min(
                1,
                0.25 + 0.35 * balanceRef.current + 0.25 * staminaRef.current - 0.2 * sprintPenalty - 0.15 * pressure
            )
        );

        const skillPressed = input.tightDribble || input.skillMove !== 'NONE';
        const passingPressed = input.actionA;
        const throughBallPressed = input.actionD;

        if (throughBallPressed && !passHeldRef.current && hasBall) {
             const passDirBase = facingNow.lengthSq() > 0 ? facingNow.clone().normalize() : goalDir.clone();
             const passSkill = Math.max(0, Math.min(1, (passingStat - 40) / 60));
             // Through ball: bias towards goal/forward
             const throughBias = goalDir.clone().multiplyScalar(0.5).add(passDirBase).normalize();
             
             const passAccuracy = Math.max(
                0,
                Math.min(1, passSkill * controlQuality * (1 - 0.4 * pressure))
            );
             
             const groundDir = throughBias.clone().setY(0).normalize();
             const passPower = 14 + 10 * passAccuracy; // Stronger than normal pass
             const forcePass = new Vector3(groundDir.x * passPower, 1 + 2 * controlQuality, groundDir.z * passPower);
             
             triggerShot([forcePass.x, forcePass.y, forcePass.z]);
             activeMatchMonitor.recordAction({
                type: 'PASS',
                subtype: 'THROUGH',
                success: passAccuracy >= 0.35,
                context: {
                    underPressure: pressure > 0.55,
                    difficulty: pressure,
                    location: {
                        x: Math.max(0, Math.min(1, (positionRef.current.x + 57.5) / 115)),
                        y: Math.max(0, Math.min(1, (positionRef.current.z + 37.5) / 75))
                    }
                }
            });
            passHeldRef.current = true;
        } else if (passingPressed && !passHeldRef.current && hasBall) {
            const passDirBase = facingNow.lengthSq() > 0 ? facingNow.clone().normalize() : goalDir.clone();
            const passSkill = Math.max(0, Math.min(1, (passingStat - 40) / 60));
            const passAccuracy = Math.max(
                0,
                Math.min(1, passSkill * controlQuality * (1 - 0.4 * pressure))
            );
            const interceptionZone = 0.4 + 0.6 * pressure;
            const passError = (1 - passAccuracy) * interceptionZone;
            const lateralPass = new Vector3().copy(passDirBase).cross(new Vector3(0, 1, 0));
            if (lateralPass.lengthSq() < 1e-3) {
                lateralPass.set(0, 0, 1);
            }
            lateralPass.normalize();
            const upPass = new Vector3(0, 1, 0);
            const r1 = Math.random() * 2 - 1;
            const r2 = Math.random() * 2 - 1;
            const passOffset = lateralPass.multiplyScalar(r1 * passError).add(upPass.multiplyScalar(r2 * passError * 0.5));
            const groundDir = passDirBase.clone().add(passOffset).setY(0);
            if (groundDir.lengthSq() > 1e-4) {
                groundDir.normalize();
            } else {
                groundDir.copy(passDirBase).setY(0).normalize();
            }
            const passPower = 10 + 10 * passAccuracy;
            const forcePass = new Vector3(groundDir.x * passPower, 1 + 2 * controlQuality, groundDir.z * passPower);
            triggerShot([forcePass.x, forcePass.y, forcePass.z]);
            activeMatchMonitor.recordAction({
                type: 'PASS',
                subtype:
                    passDirBase.dot(goalDir) < 0
                        ? 'BACKWARD'
                        : pressure > 0.7 && passAccuracy < 0.45
                            ? 'PANIC'
                            : undefined,
                success: passAccuracy >= 0.35,
                context: {
                    underPressure: pressure > 0.55,
                    difficulty: pressure,
                    location: {
                        x: Math.max(0, Math.min(1, (positionRef.current.x + 57.5) / 115)),
                        y: Math.max(0, Math.min(1, (positionRef.current.z + 37.5) / 75))
                    }
                }
            });
            passHeldRef.current = true;
        } else if (!passingPressed) {
            passHeldRef.current = false;
        }

        if (skillPressed && !skillHeldRef.current && hasBall) {
            let selected: SkillId | null = null;
            if (sprinting && speed > walkSpeed * 0.8) {
                selected = 'STOP_AND_GO';
            } else if (!sprinting && speed < walkSpeed * 0.5 && Math.abs(input.moveX) > 0.4) {
                selected = 'BODY_FEINT';
            } else if (!sprinting && speed < walkSpeed * 0.6 && input.moveY < -0.3) {
                selected = 'DRAG_BACK';
            } else if (!sprinting && speed < sprintSpeed * 0.7 && Math.abs(input.moveX) > 0.2) {
                selected = 'BALL_ROLL';
            }
            if (selected) {
                activeSkillRef.current = selected;
                skillTimerRef.current = selected === 'STOP_AND_GO' ? 0.8 : 0.5;
                activeMatchMonitor.recordAction({
                    type: 'SKILL',
                    subtype: selected,
                    success: controlQuality > 0.35,
                    context: {
                        underPressure: pressure > 0.55,
                        difficulty: pressure,
                        location: {
                            x: Math.max(0, Math.min(1, (positionRef.current.x + 57.5) / 115)),
                            y: Math.max(0, Math.min(1, (positionRef.current.z + 37.5) / 75))
                        }
                    }
                });
            }
            skillHeldRef.current = true;
        } else if (!skillPressed) {
            skillHeldRef.current = false;
        }

        if (activeSkillRef.current === 'BODY_FEINT') {
            const dir = right.clone().multiplyScalar(input.moveX >= 0 ? 1 : -1).normalize();
            v.x += dir.x * walkSpeed * 0.4;
            v.z += dir.z * walkSpeed * 0.4;
        } else if (activeSkillRef.current === 'DRAG_BACK') {
            const backDir = moveDir.lengthSq() > 0 ? moveDir.clone().normalize().multiplyScalar(-1) : forward
                .clone()
                .normalize()
                .multiplyScalar(-1);
            v.x += backDir.x * walkSpeed * 0.7;
            v.z += backDir.z * walkSpeed * 0.7;
        } else if (activeSkillRef.current === 'BALL_ROLL') {
            const lateral = right.clone().multiplyScalar(input.moveX >= 0 ? 1 : -1).normalize();
            v.x += lateral.x * walkSpeed * 0.5;
            v.z += lateral.z * walkSpeed * 0.5;
        } else if (activeSkillRef.current === 'STOP_AND_GO') {
            if (skillTimerRef.current > 0.4) {
                v.x *= 0.4;
                v.z *= 0.4;
            } else {
                const dir = facingNow.lengthSq() > 0 ? facingNow.clone().normalize() : forward.clone().normalize();
                v.x += dir.x * sprintSpeed * 0.8;
                v.z += dir.z * sprintSpeed * 0.8;
            }
        }

        const shootingPressed = input.actionB;

        if (shootingPressed && !shootHeldRef.current && hasBall) {
            const facingDir = facingNow.lengthSq() > 0 ? facingNow.clone().normalize() : goalDir.clone();
            const align = Math.max(0, facingDir.dot(goalDir));
            const finishingNorm = Math.max(0, Math.min(1, (shootingStat - 40) / 60));
            const timingFactor = speed < walkSpeed * 0.6 ? 1 : speed < sprintSpeed * 0.6 ? 0.8 : 0.6;
            const footFactor = 1;
            const rawAcc = finishingNorm * balance * align * (1 - pressure) * timingFactor * footFactor;
            const accuracy = Math.max(0, Math.min(1, rawAcc));
            const dispersion = 0.35;
            const error = (1 - accuracy) * dispersion;

            const lateral = new Vector3().copy(goalDir).cross(new Vector3(0, 1, 0));
            if (lateral.lengthSq() < 1e-3) {
                lateral.set(0, 0, 1);
            }
            lateral.normalize();
            const upDir = new Vector3(0, 1, 0);

            const rand1 = Math.random() * 2 - 1;
            const rand2 = Math.random() * 2 - 1;
            const offset = lateral.multiplyScalar(rand1 * error).add(upDir.multiplyScalar(rand2 * error));
            const shotDir = goalDir.clone().add(offset).normalize();

            const basePower = 18 + 10 * accuracy;
            const force = shotDir.multiplyScalar(basePower);

            triggerShot([force.x, force.y, force.z]);
            const distFactor = Math.max(0, Math.min(1, 1 - distToGoal / 60));
            const xG = Math.max(0, Math.min(0.8, 0.05 + 0.55 * distFactor + 0.25 * align - 0.2 * pressure));
            activeMatchMonitor.recordAction({
                type: 'SHOT',
                success: false,
                context: {
                    underPressure: pressure > 0.55,
                    xG,
                    difficulty: pressure,
                    location: {
                        x: Math.max(0, Math.min(1, (positionRef.current.x + 57.5) / 115)),
                        y: Math.max(0, Math.min(1, (positionRef.current.z + 37.5) / 75))
                    }
                }
            });

            balanceRef.current = Math.max(0, balanceRef.current - 0.25);
            shootHeldRef.current = true;
            shotAnimTimerRef.current = SHOT_ANIM_DURATION;
        } else if (!shootingPressed) {
            shootHeldRef.current = false;
        }

        const isGoalSequence = ballState === 'GOAL' || (activeCelebration && activeCelebration.active);
        const animDelta = isGoalSequence ? delta * 0.6 : delta;

        if (moving || speed > 0.1) {
            const cycleSpeed = 4 + 2 * (speed > 0 ? speed / sprintSpeed : 0);
            phaseRef.current += animDelta * cycleSpeed;
        } else {
            phaseRef.current += animDelta * 2;
        }

        if (shotAnimTimerRef.current > 0) {
            shotAnimTimerRef.current -= animDelta;
            if (shotAnimTimerRef.current < 0) {
                shotAnimTimerRef.current = 0;
            }
        }

        const phase = phaseRef.current;
        const legSwingBase = moving ? (sprinting ? 0.9 : 0.6) : 0;
        const armSwing = moving ? 0.35 : 0.12;
        const shotActive = shotAnimTimerRef.current > 0;
        const shotT = shotActive
            ? Math.max(0, Math.min(1, 1 - shotAnimTimerRef.current / SHOT_ANIM_DURATION))
            : 0;

        if (!shotActive && !input.actionD) {
            const leftPhase = phase;
            const rightPhase = phase + Math.PI;
            if (leftLegRef.current) {
                leftLegRef.current.rotation.x = Math.sin(leftPhase) * legSwingBase;
            }
            if (rightLegRef.current) {
                rightLegRef.current.rotation.x = Math.sin(rightPhase) * legSwingBase;
            }
            const kneeSwing = moving ? 0.7 : 0.3;
            if (leftShinRef.current) {
                const bend = Math.max(0, -Math.sin(leftPhase)) * kneeSwing;
                leftShinRef.current.rotation.x = bend;
            }
            if (rightShinRef.current) {
                const bend = Math.max(0, -Math.sin(rightPhase)) * kneeSwing;
                rightShinRef.current.rotation.x = bend;
            }
            if (leftArmRef.current) {
                leftArmRef.current.rotation.x = Math.sin(rightPhase) * armSwing;
            }
            if (rightArmRef.current) {
                rightArmRef.current.rotation.x = Math.sin(leftPhase) * armSwing;
            }
            if (leftForearmRef.current) {
                const upper = leftArmRef.current ? leftArmRef.current.rotation.x : 0;
                leftForearmRef.current.rotation.x = upper * 0.6;
            }
            if (rightForearmRef.current) {
                const upper = rightArmRef.current ? rightArmRef.current.rotation.x : 0;
                rightForearmRef.current.rotation.x = upper * 0.6;
            }
        }

        if (shotActive) {
            const blend = shotT;
            const windUp = blend < 0.4 ? blend / 0.4 : 1;
            const strikePhase = blend > 0.3 ? Math.min(1, (blend - 0.3) / 0.4) : 0;
            const followThrough = blend > 0.7 ? Math.min(1, (blend - 0.7) / 0.3) : 0;

            const rightLegAngle = -0.7 * windUp + 1.4 * strikePhase - 0.4 * followThrough;
            const rightKneeAngle = Math.max(0, 0.9 * strikePhase - 0.2 * followThrough);

            if (rightLegRef.current) {
                rightLegRef.current.rotation.x = rightLegAngle;
            }
            if (rightShinRef.current) {
                rightShinRef.current.rotation.x = rightKneeAngle;
            }
            if (leftLegRef.current) {
                leftLegRef.current.rotation.x = -0.25;
            }
            if (leftShinRef.current) {
                leftShinRef.current.rotation.x = 0.6;
            }
            if (rightArmRef.current) {
                rightArmRef.current.rotation.x = -0.7;
            }
            if (leftArmRef.current) {
                leftArmRef.current.rotation.x = 0.5;
            }
            if (rightForearmRef.current) {
                rightForearmRef.current.rotation.x = -0.3;
            }
            if (leftForearmRef.current) {
                leftForearmRef.current.rotation.x = 0.25;
            }
        } else if (input.actionD) {
            if (leftArmRef.current) {
                leftArmRef.current.rotation.x = -0.8;
            }
            if (rightArmRef.current) {
                rightArmRef.current.rotation.x = 0.8;
            }
            if (leftForearmRef.current) {
                leftForearmRef.current.rotation.x = -0.2;
            }
            if (rightForearmRef.current) {
                rightForearmRef.current.rotation.x = 0.2;
            }
        }

        if (headRef.current) {
            const sideways = moveDir.x;
            headRef.current.rotation.y = sideways * 0.4;
        }
        api.velocity.set(v.x, 0, v.z);
    });

    return (
        <group ref={ref as React.RefObject<any>} castShadow receiveShadow>
            <mesh position={[0, 1.45, 0]}>
                <cylinderGeometry args={[0.38, 0.34, 1.25, 18]} />
                <meshStandardMaterial color={kit.primaryColor} />
            </mesh>
            <mesh position={[0, 0.95, 0]}>
                <cylinderGeometry args={[0.3, 0.32, 0.38, 16]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <group ref={leftLegRef} position={[-0.18, 0.7, 0]}>
                <mesh position={[0, -0.3, 0]}>
                    <cylinderGeometry args={[0.13, 0.14, 0.6, 14]} />
                    <meshStandardMaterial color={kit.primaryColor} />
                </mesh>
                <group ref={leftShinRef} position={[0, -0.6, 0]}>
                    <mesh position={[0, -0.32, 0]}>
                        <cylinderGeometry args={[0.12, 0.12, 0.64, 14]} />
                        <meshStandardMaterial color={kit.primaryColor} />
                    </mesh>
                </group>
            </group>
            <group ref={rightLegRef} position={[0.18, 0.7, 0]}>
                <mesh position={[0, -0.3, 0]}>
                    <cylinderGeometry args={[0.13, 0.14, 0.6, 14]} />
                    <meshStandardMaterial color={kit.primaryColor} />
                </mesh>
                <group ref={rightShinRef} position={[0, -0.6, 0]}>
                    <mesh position={[0, -0.32, 0]}>
                        <cylinderGeometry args={[0.12, 0.12, 0.64, 14]} />
                        <meshStandardMaterial color={kit.primaryColor} />
                    </mesh>
                </group>
            </group>
            <group ref={leftArmRef} position={[-0.55, 1.6, 0]}>
                <mesh position={[0, -0.22, 0]}>
                    <cylinderGeometry args={[0.11, 0.12, 0.46, 14]} />
                    <meshStandardMaterial color={kit.primaryColor} />
                </mesh>
                <group ref={leftForearmRef} position={[0, -0.46, 0]}>
                    <mesh position={[0, -0.22, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 0.46, 14]} />
                        <meshStandardMaterial color={face.skinColor} />
                    </mesh>
                </group>
            </group>
            <group ref={rightArmRef} position={[0.55, 1.6, 0]}>
                <mesh position={[0, -0.22, 0]}>
                    <cylinderGeometry args={[0.11, 0.12, 0.46, 14]} />
                    <meshStandardMaterial color={kit.primaryColor} />
                </mesh>
                <group ref={rightForearmRef} position={[0, -0.46, 0]}>
                    <mesh position={[0, -0.22, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 0.46, 14]} />
                        <meshStandardMaterial color={face.skinColor} />
                    </mesh>
                </group>
            </group>
            <group ref={headRef} position={[0, 2.1, 0]}>
                <mesh>
                    <sphereGeometry args={[0.28, 20, 20]} />
                    <meshStandardMaterial color={face.skinColor} />
                </mesh>
                {face.hasHair && (
                    <mesh position={[0, 0.25, 0]}>
                        <boxGeometry args={[0.6, 0.28, 0.6]} />
                        <meshStandardMaterial color={face.hairColor} />
                    </mesh>
                )}
                <mesh position={[-0.09, 0.05, 0.24]}>
                    <circleGeometry args={[0.04, 12]} />
                    <meshStandardMaterial color="#111111" />
                </mesh>
                <mesh position={[0.09, 0.05, 0.24]}>
                    <circleGeometry args={[0.04, 12]} />
                    <meshStandardMaterial color="#111111" />
                </mesh>
                <mesh position={[0, -0.08, 0.24]}>
                    <boxGeometry args={[0.16, 0.03, 0.02]} />
                    <meshStandardMaterial color="#b85c4c" />
                </mesh>
            </group>
            <mesh position={[0, 1.35, -0.23]}>
                <boxGeometry args={[0.4, 0.25, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <Text
                position={[0, 1.4, -0.27]}
                rotation={[0, Math.PI, 0]}
                fontSize={0.16}
                color="black"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#ffffff"
            >
                MRN
            </Text>
            <Text
                position={[0, 1.75, -0.27]}
                rotation={[0, Math.PI, 0]}
                fontSize={0.17}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {displayName}
            </Text>
            <Text
                position={[0, 1.5, -0.27]}
                rotation={[0, Math.PI, 0]}
                fontSize={0.22}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#000000"
            >
                {displayNumber}
            </Text>
            <mesh position={[0, 2.45, -0.27]}>
                <boxGeometry args={[0.9, 0.05, 0.02]} />
                <meshStandardMaterial color="#000000" />
            </mesh>
            <mesh position={[0, 2.45, -0.26]} scale={[stamina, 1, 1]}>
                <boxGeometry args={[0.8, 0.03, 0.01]} />
                <meshStandardMaterial color={stamina > 0.3 ? '#22c55e' : '#f97316'} />
            </mesh>
        </group>
    );
};
