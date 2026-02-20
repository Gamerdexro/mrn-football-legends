export const RivalsHub = () => {
    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400">Rivals</div>
                    <h2 className="text-2xl md:text-3xl font-black italic text-white mt-1">Fake-Online Competitive Modes</h2>
                    <p className="text-xs md:text-sm text-gray-300 mt-1">
                        Head-to-Head and Clash Attack with AI that behaves like human opponents.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gray-900/70 border border-emerald-500/50 p-4 flex flex-col justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">Head-to-Head</div>
                        <div className="mt-1 text-lg md:text-xl font-black text-white">Live Rivals Match</div>
                        <p className="mt-2 text-xs text-gray-300">
                            Simulated connection, opponent preview, emojis and AI personalities. Uses your current squad.
                        </p>
                    </div>
                    <button className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-emerald-400 transition-colors">
                        Searching for opponent…
                    </button>
                </div>
                <div className="rounded-2xl bg-gray-900/70 border border-blue-500/50 p-4 flex flex-col justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.25em] text-blue-300">Clash Attack</div>
                        <div className="mt-1 text-lg md:text-xl font-black text-white">VS Attack Style</div>
                        <p className="mt-2 text-xs text-gray-300">
                            High-pressure attacking turns where both sides get chances under the same rules.
                        </p>
                    </div>
                    <button className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-blue-400 transition-colors">
                        Prepare clash
                    </button>
                </div>
            </div>
        </div>
    );
}

