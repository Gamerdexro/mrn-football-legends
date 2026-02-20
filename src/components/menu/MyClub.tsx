import { SquadManagement } from '../squad/SquadManagement';

export const MyClub = () => {
    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400">My Club</div>
                    <h2 className="text-2xl md:text-3xl font-black italic text-white mt-1">Squad HQ</h2>
                    <p className="text-xs md:text-sm text-gray-300 mt-1">
                        Full XI, substitutes, live OVR and future formation lab.
                    </p>
                </div>
            </div>
            <div className="flex-1 min-h-0 rounded-2xl bg-black/40 border border-emerald-500/40 overflow-hidden">
                <SquadManagement />
            </div>
        </div>
    );
}

