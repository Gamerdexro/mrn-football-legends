import React from 'react';
import { useControlStore } from '../controls/useControlStore';

export const EnhancedTouchControls: React.FC = () => {
    const { input, updateInput } = useControlStore();

    const forward = input.moveY > 0;
    const backward = input.moveY < 0;
    const left = input.moveX < 0;
    const right = input.moveX > 0;
    const sprint = input.sprint;
    const shoot = input.actionB;
    const pass = input.actionA;

    const setForward = (v: boolean) => updateInput({ moveY: v ? 1 : 0 });
    const setBackward = (v: boolean) => updateInput({ moveY: v ? -1 : 0 });
    const setLeft = (v: boolean) => updateInput({ moveX: v ? -1 : 0 });
    const setRight = (v: boolean) => updateInput({ moveX: v ? 1 : 0 });
    const setSprint = (v: boolean) => updateInput({ sprint: v });
    const setShoot = (v: boolean) => updateInput({ actionB: v });
    const setPass = (v: boolean) => updateInput({ actionA: v });

    const buttonStyle = (active: boolean) => ({
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: active ? '#ff6b35' : '#333',
        color: '#fff',
        border: '2px solid #555',
        fontSize: '20px',
        fontWeight: 'bold' as const,
        cursor: 'pointer',
        transition: 'all 0.1s ease',
        boxShadow: active ? '0 0 20px #ff6b35' : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const
    });

    const TouchButton: React.FC<{
        active: boolean;
        onTouchStart: () => void;
        onTouchEnd: () => void;
        children: React.ReactNode;
    }> = ({ active, onTouchStart, onTouchEnd, children }) => (
        <button
            style={buttonStyle(active)}
            onMouseDown={onTouchStart}
            onMouseUp={onTouchEnd}
            onMouseLeave={onTouchEnd}
            onTouchStart={(e) => {
                e.preventDefault();
                onTouchStart();
            }}
            onTouchEnd={(e) => {
                e.preventDefault();
                onTouchEnd();
            }}
        >
            {children}
        </button>
    );

    return (
        <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            zIndex: 1000
        }}>
            <div />
            <TouchButton 
                active={forward} 
                onTouchStart={() => setForward(true)}
                onTouchEnd={() => setForward(false)}
            >
                ▲
            </TouchButton>
            <div />
            
            <TouchButton 
                active={left} 
                onTouchStart={() => setLeft(true)}
                onTouchEnd={() => setLeft(false)}
            >
                ◀
            </TouchButton>
            <TouchButton 
                active={backward} 
                onTouchStart={() => setBackward(true)}
                onTouchEnd={() => setBackward(false)}
            >
                ▼
            </TouchButton>
            <TouchButton 
                active={right} 
                onTouchStart={() => setRight(true)}
                onTouchEnd={() => setRight(false)}
            >
                ▶
            </TouchButton>

            <TouchButton 
                active={sprint} 
                onTouchStart={() => setSprint(true)}
                onTouchEnd={() => setSprint(false)}
            >
                ⚡
            </TouchButton>
            <TouchButton 
                active={shoot} 
                onTouchStart={() => setShoot(true)}
                onTouchEnd={() => setShoot(false)}
            >
                ⚽
            </TouchButton>
            <TouchButton 
                active={pass} 
                onTouchStart={() => setPass(true)}
                onTouchEnd={() => setPass(false)}
            >
                🎯
            </TouchButton>
        </div>
    );
};
