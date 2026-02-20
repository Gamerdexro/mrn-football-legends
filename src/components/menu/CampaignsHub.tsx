export const CampaignsHub = () => {
    const campaigns = [
        { id: 'daily', title: 'Daily Challenges', description: 'Short missions that refresh every day.', endsIn: 'Ends in 6h' },
        { id: 'weekly', title: 'Weekly Campaign', description: 'Tougher objectives with bigger rewards.', endsIn: 'Ends in 3d' },
        { id: 'season', title: 'Season Journey', description: 'Long-term path across the whole season.', endsIn: 'Ends in 21d' }
    ];

    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400">Campaigns</div>
                    <h2 className="text-2xl md:text-3xl font-black italic text-white mt-1">Events Mode</h2>
                    <p className="text-xs md:text-sm text-gray-300 mt-1">
                        Daily, weekly and seasonal programs with unique maps and rewards.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {campaigns.map(c => (
                    <div key={c.id} className="rounded-2xl bg-gray-900/70 border border-emerald-500/40 p-4 flex flex-col justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">{c.title}</div>
                            <p className="mt-2 text-xs text-gray-200">{c.description}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-200">
                            <span>{c.endsIn}</span>
                            <span className="px-3 py-1 rounded-full bg-emerald-600 text-black font-semibold tracking-[0.18em] uppercase">
                                View Map
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

