import { create } from 'zustand';
import { useMatchStore } from '../../store/useMatchStore';

export type ControlContext = 'ATTACKING' | 'DEFENDING' | 'GK_CONTROL' | 'FREE_KICK' | 'PENALTY' | 'CORNER' | 'THROW_IN';

export interface GameInput {
    moveX: number;
    moveY: number;
    cameraX: number;
    cameraY: number;
    sprint: boolean;
    actionA: boolean;
    actionB: boolean;
    actionC: boolean;
    actionD: boolean;
    tightDribble: boolean;
    tackle: boolean;
    switchPlayer: boolean;
    skillMove: 'NONE' | 'LANE_CHANGE' | 'HEEL_TO_HEEL' | 'DRAG_BACK';
    passPower: number;
    shotPower: number;
    swipeAngle: number;
}

interface ControlState {
    context: ControlContext;
    input: GameInput;
    setContext: (ctx: ControlContext) => void;
    updateInput: (input: Partial<GameInput>) => void;
}

export const useControlStore = create<ControlState>((set) => ({
    context: 'ATTACKING',
    input: {
        moveX: 0,
        moveY: 0,
        cameraX: 0,
        cameraY: 0,
        sprint: false,
        actionA: false,
        actionB: false,
        actionC: false,
        actionD: false,
        tightDribble: false,
        tackle: false,
        switchPlayer: false,
        skillMove: 'NONE',
        passPower: 0,
        shotPower: 0,
        swipeAngle: 0
    },
    setContext: (ctx) => set({ context: ctx }),
    updateInput: (newInput) => {
        const now = Date.now();
        useMatchStore.setState({
            lastInputAt: now,
            afkSeconds: 0
        });
        set((state) => {
            const next = { ...state.input, ...newInput };
            if (typeof newInput.tackle === 'boolean') {
                next.actionC = newInput.tackle;
            }
            if (typeof newInput.switchPlayer === 'boolean') {
                next.actionD = newInput.switchPlayer;
            }
            return { input: next };
        });
    }
}));
