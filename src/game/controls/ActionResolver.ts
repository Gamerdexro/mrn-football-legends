import { ControlContext } from './useControlStore';

// This function maps raw inputs to context-specific actions
// It should be called in the Game Loop (Update)
export const resolveAction = (context: ControlContext, input: any) => {
    if (context === 'ATTACKING') {
        return {
            moveVector: { x: input.moveX, y: input.moveY },
            isSprinting: input.sprint,
            isPassing: input.actionA,
            isShooting: input.actionB,
            isThroughBall: input.actionC,
            isSkill: input.actionD
        };
    }

    if (context === 'DEFENDING') {
        return {
            moveVector: { x: input.moveX, y: input.moveY },
            isSprinting: input.sprint,
            isPressing: input.actionA,
            isTackling: input.actionB,
            isSliding: input.actionC,
            isSwitchPlayer: input.actionD
        };
    }

    // Set Pieces
    if (context === 'FREE_KICK') {
        return {
            aimVector: { x: input.moveX, y: input.moveY },
            power: input.actionB ? 'charging' : 'release',
            curve: input.actionC
        };
    }

    return null;
};
