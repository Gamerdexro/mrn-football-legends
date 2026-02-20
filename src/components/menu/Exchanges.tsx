
export const Exchanges = () => {
    const exchangeOptions = [
        { 
            id: 'daily_bronze', 
            title: 'Bronze Exchange', 
            req: '3x 60+ OVR Players', 
            reward: '1x 70+ Silver Player',
            color: 'amber' 
        },
        { 
            id: 'weekly_silver', 
            title: 'Silver Upgrade', 
            req: '5x 70+ OVR Players', 
            reward: '1x 80+ Gold Player',
            color: 'gray' 
        },
        { 
            id: 'monthly_gold', 
            title: 'Gold Premium', 
            req: '11x 80+ OVR Players', 
            reward: '1x 85+ Elite Player',
            color: 'yellow' 
        }
    ];

    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400">Exchanges</div>
                    <h2 className="text-2xl md:text-3xl font-black italic text-white mt-1">Player Trade</h2>
                    <p className="text-xs md:text-sm text-gray-300 mt-1">
                        Swap your unwanted players for higher rated ones.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exchangeOptions.map(opt => (
                    <div key={opt.id} className={`rounded-2xl bg-gray-900/70 border border-${opt.color}-500/40 p-4 flex flex-col justify-between hover:bg-gray-800 transition-colors cursor-pointer`}>
                        <div>
                            <div className={`text-[10px] uppercase tracking-[0.25em] text-${opt.color}-400 font-bold`}>{opt.title}</div>
                            <div className="mt-3 space-y-2">
                                <div className="text-xs text-gray-400">
                                    <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Requirement</span>
                                    {opt.req}
                                </div>
                                <div className="text-xs text-emerald-300">
                                    <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Reward</span>
                                    {opt.reward}
                                </div>
                            </div>
                        </div>
                        <button className={`mt-4 w-full py-2 rounded-lg bg-${opt.color}-600/20 border border-${opt.color}-500/50 text-${opt.color}-200 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-${opt.color}-600/40 transition-colors`}>
                            View Exchange
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
