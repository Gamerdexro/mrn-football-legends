import React from 'react';
import { useControlStore } from '../controls/useControlStore';

export const SkillsButton: React.FC = () => {
    const { context, setContext } = useControlStore();

    const toggleContext = () => {
        setContext(context === 'ATTACKING' ? 'DEFENDING' : 'ATTACKING');
    };

    return (
        <button
            onClick={toggleContext}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '12px 24px',
                background: context === 'ATTACKING' ? '#ff6b35' : '#4ecdc4',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 1000,
                transition: 'background 0.2s ease'
            }}
        >
            {context === 'ATTACKING' ? '⚔️ ATTACK' : '🛡️ DEFEND'}
        </button>
    );
};