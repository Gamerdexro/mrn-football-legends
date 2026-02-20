import React from 'react';

export const FORMATIONS = [
    {
        id: '4-3-3',
        name: '4-3-3 Attack',
        description: 'Balanced attack with wingers.',
        requiredLevel: 1,
        positions: [
            { top: '85%', left: '50%' }, // GK
            { top: '65%', left: '20%' }, // LB
            { top: '65%', left: '40%' }, // CB
            { top: '65%', left: '60%' }, // CB
            { top: '65%', left: '80%' }, // RB
            { top: '45%', left: '30%' }, // CM
            { top: '45%', left: '50%' }, // CM
            { top: '45%', left: '70%' }, // CM
            { top: '20%', left: '20%' }, // LW
            { top: '20%', left: '50%' }, // ST
            { top: '20%', left: '80%' }, // RW
        ]
    },
    {
        id: '4-4-2',
        name: '4-4-2 Classic',
        description: 'Solid midfield structure.',
        requiredLevel: 2,
        positions: [
            { top: '85%', left: '50%' }, // GK
            { top: '65%', left: '20%' }, // LB
            { top: '65%', left: '40%' }, // CB
            { top: '65%', left: '60%' }, // CB
            { top: '65%', left: '80%' }, // RB
            { top: '45%', left: '20%' }, // LM
            { top: '45%', left: '40%' }, // CM
            { top: '45%', left: '60%' }, // CM
            { top: '45%', left: '80%' }, // RM
            { top: '20%', left: '35%' }, // ST
            { top: '20%', left: '65%' }, // ST
        ]
    },
    {
        id: '4-2-3-1',
        name: '4-2-3-1 Compact',
        description: 'Defensive stability with a CAM.',
        requiredLevel: 5,
        positions: [
            { top: '85%', left: '50%' }, // GK
            { top: '65%', left: '20%' }, // LB
            { top: '65%', left: '40%' }, // CB
            { top: '65%', left: '60%' }, // CB
            { top: '65%', left: '80%' }, // RB
            { top: '50%', left: '35%' }, // CDM
            { top: '50%', left: '65%' }, // CDM
            { top: '35%', left: '20%' }, // LAM
            { top: '35%', left: '50%' }, // CAM
            { top: '35%', left: '80%' }, // RAM
            { top: '15%', left: '50%' }, // ST
        ]
    },
    {
        id: '3-5-2',
        name: '3-5-2 Control',
        description: 'Overload the midfield.',
        requiredLevel: 9,
        positions: [
            { top: '85%', left: '50%' }, // GK
            { top: '70%', left: '30%' }, // CB
            { top: '70%', left: '50%' }, // CB
            { top: '70%', left: '70%' }, // CB
            { top: '45%', left: '15%' }, // LWB
            { top: '50%', left: '35%' }, // CDM
            { top: '50%', left: '65%' }, // CDM
            { top: '45%', left: '85%' }, // RWB
            { top: '35%', left: '50%' }, // CAM
            { top: '15%', left: '35%' }, // ST
            { top: '15%', left: '65%' }, // ST
        ]
    },
    {
        id: '5-3-2',
        name: '5-3-2 Fortress',
        description: 'Park the bus and counter.',
        requiredLevel: 12,
        positions: [
            { top: '85%', left: '50%' }, // GK
            { top: '70%', left: '15%' }, // LWB
            { top: '70%', left: '32%' }, // CB
            { top: '70%', left: '50%' }, // CB
            { top: '70%', left: '68%' }, // CB
            { top: '70%', left: '85%' }, // RWB
            { top: '45%', left: '30%' }, // CM
            { top: '45%', left: '50%' }, // CM
            { top: '45%', left: '70%' }, // CM
            { top: '20%', left: '35%' }, // ST
            { top: '20%', left: '65%' }, // ST
        ]
    }
];

interface FormationSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    currentFormationId: string;
    userLevel: number;
}

export const FormationSelector: React.FC<FormationSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentFormationId,
    userLevel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with Blur */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Panel Container - Fixed Height/Width based on screen but internally scrollable */}
            <div className="relative z-10 w-full h-full md:w-[600px] md:h-[80%] bg-gradient-to-b from-slate-900 via-slate-950 to-black md:rounded-2xl border border-emerald-500/30 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                
                {/* Fixed Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-bold">Tactics</div>
                        <h2 className="text-xl font-black italic text-white mt-1">Select Formation</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <span className="text-white text-lg">×</span>
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {FORMATIONS.map((formation, index) => {
                        const isSelected = formation.id === currentFormationId;
                        const isLocked = userLevel < formation.requiredLevel;

                        return (
                            <button
                                key={formation.id}
                                disabled={isLocked}
                                onClick={() => onSelect(formation.id)}
                                className={`
                                    w-full relative group overflow-hidden rounded-xl border-2 transition-all duration-300
                                    ${isSelected 
                                        ? 'border-emerald-500 bg-emerald-950/30' 
                                        : isLocked
                                            ? 'border-white/5 bg-black/40 opacity-60 cursor-not-allowed'
                                            : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                    }
                                `}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-stretch h-32">
                                    {/* Mini Pitch Visual */}
                                    <div className={`w-1/3 relative border-r border-white/10 ${isLocked ? 'grayscale opacity-50' : 'bg-emerald-900/40'}`}>
                                        <div className="absolute inset-0 opacity-30">
                                            {/* Pitch lines */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[15%] border-b border-white/30"></div>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[15%] border-t border-white/30"></div>
                                            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20"></div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-white/20"></div>
                                        </div>
                                        
                                        {/* Player Dots */}
                                        {formation.positions.map((pos, idx) => (
                                            <div
                                                key={idx}
                                                className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm
                                                    ${isSelected ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-white/70'}
                                                `}
                                                style={{ top: pos.top, left: pos.left }}
                                            ></div>
                                        ))}
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1 p-4 flex flex-col justify-center items-start text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-lg font-black ${isSelected ? 'text-emerald-400' : isLocked ? 'text-gray-500' : 'text-white'}`}>
                                                {formation.name}
                                            </span>
                                            {isSelected && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                                                    Active
                                                </span>
                                            )}
                                            {isLocked && (
                                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-[9px] font-bold uppercase tracking-wider text-red-300">
                                                    Lvl {formation.requiredLevel}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium">
                                            {formation.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Bottom Fade Mask (Visual only) */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};
