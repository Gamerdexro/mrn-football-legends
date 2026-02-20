import { useEffect } from 'react';
import { useControlStore } from './useControlStore';
import { useMatchStore } from '../../store/useMatchStore';

let shotKeyDownAt: number | null = null;
let passKeyDownAt: number | null = null;

export const useKeyboardControls = () => {
    const updateInput = useControlStore(state => state.updateInput);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const matchState = useMatchStore.getState();
            const celebration = matchState.activeCelebration;
            if (celebration && celebration.active) {
                if (e.code === 'KeyZ') {
                    matchState.inputCelebrationStep('A');
                } else if (e.code === 'KeyX') {
                    matchState.inputCelebrationStep('B');
                } else if (e.code === 'KeyC') {
                    matchState.inputCelebrationStep('C');
                }
            }
            switch(e.code) {
                // Movement: Arrows + WASD
                case 'ArrowUp':
                case 'KeyW':
                    updateInput({ moveY: 1 });
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    updateInput({ moveY: -1 });
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    updateInput({ moveX: -1 });
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    updateInput({ moveX: 1 });
                    break;

                // Sprint: Shift
                case 'ShiftLeft':
                case 'ShiftRight':
                    updateInput({ sprint: true });
                    break;

                case 'Space':
                    if (shotKeyDownAt === null) {
                        shotKeyDownAt = performance.now();
                    }
                    updateInput({ actionB: true });
                    break;

                case 'KeyX':
                    if (passKeyDownAt === null) {
                        passKeyDownAt = performance.now();
                    }
                    updateInput({ actionA: true });
                    break;

                // Through: C
                case 'KeyC':
                    updateInput({ actionD: true });
                    break;

                // Skill: Z
                case 'KeyZ':
                    updateInput({ tightDribble: true });
                    break;

                // Lob: V
                case 'KeyV':
                    updateInput({ actionC: true });
                    break;

                // Switch: Tab or Q
                case 'Tab':
                case 'KeyQ':
                    e.preventDefault();
                    updateInput({ switchPlayer: true });
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch(e.code) {
                case 'ArrowUp':
                case 'KeyW':
                case 'ArrowDown':
                case 'KeyS':
                    updateInput({ moveY: 0 });
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                case 'ArrowRight':
                case 'KeyD':
                    updateInput({ moveX: 0 });
                    break;

                case 'ShiftLeft':
                case 'ShiftRight':
                    updateInput({ sprint: false });
                    break;

                case 'Space': {
                    const now = performance.now();
                    let power = 0.6;
                    if (shotKeyDownAt !== null) {
                        const duration = Math.max(80, Math.min(1400, now - shotKeyDownAt));
                        const t = (duration - 80) / (1400 - 80);
                        power = 0.3 + t * 0.7;
                    }
                    shotKeyDownAt = null;
                    updateInput({ actionB: false, shotPower: power });
                    break;
                }
                case 'KeyX': {
                    const now = performance.now();
                    let power = 0.5;
                    if (passKeyDownAt !== null) {
                        const duration = Math.max(60, Math.min(1200, now - passKeyDownAt));
                        const t = (duration - 60) / (1200 - 60);
                        power = 0.25 + t * 0.6;
                    }
                    passKeyDownAt = null;
                    updateInput({ actionA: false, passPower: power });
                    break;
                }
                case 'KeyC':
                    updateInput({ actionD: false });
                    break;
                case 'KeyZ':
                    updateInput({ tightDribble: false });
                    break;
                case 'KeyV':
                    updateInput({ actionC: false });
                    break;
                case 'Tab':
                case 'KeyQ':
                    updateInput({ switchPlayer: false });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [updateInput]);
};

export const useGamepadControls = () => {
    const updateInput = useControlStore(state => state.updateInput);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
            return;
        }

        const hasGamepadSupport = typeof (navigator as any).getGamepads === 'function';
        if (!hasGamepadSupport) {
            return;
        }

        let frameId: number | undefined;

        const deadZone = 0.25;
        const normalizeAxis = (value: number) => {
            if (Math.abs(value) < deadZone) return 0;
            if (value > 1) return 1;
            if (value < -1) return -1;
            return value;
        };

        const loop = () => {
            const gamepads = (navigator as any).getGamepads() as (Gamepad | null)[];
            const pad = gamepads && gamepads.length > 0 ? gamepads[0] : null;

            if (pad) {
                const axes = pad.axes || [];
                const buttons = pad.buttons || [];

                const leftX = normalizeAxis(axes[0] || 0);
                const leftY = normalizeAxis(axes[1] || 0);

                const moveX = leftX;
                const moveY = -leftY;

                const rightX = normalizeAxis(axes[2] || 0);
                const rightY = normalizeAxis(axes[3] || 0);

                const btn = (index: number) => !!buttons[index] && buttons[index]!.pressed;

                const actionA = btn(0);
                const actionB = btn(1);
                const skill = btn(2);
                const switchPlayer = btn(3);
                const sprint = btn(4) || btn(5);
                const tackle = btn(6) || btn(7);

                updateInput({
                    moveX,
                    moveY,
                    cameraX: rightX,
                    cameraY: rightY,
                    sprint,
                    actionA,
                    actionB,
                    actionD: skill,
                    switchPlayer,
                    tackle
                });
            } else {
                updateInput({
                    moveX: 0,
                    moveY: 0,
                    cameraX: 0,
                    cameraY: 0,
                    sprint: false,
                    actionA: false,
                    actionB: false,
                    actionD: false,
                    switchPlayer: false,
                    tackle: false
                });
            }

            frameId = window.requestAnimationFrame(loop);
        };

        frameId = window.requestAnimationFrame(loop);

        return () => {
            if (frameId !== undefined) {
                window.cancelAnimationFrame(frameId);
            }
        };
    }, [updateInput]);
};
