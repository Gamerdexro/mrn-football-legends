import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import players from '../../data/players.json';
import { AudioManager } from '../../services/audioManager';

const SquadManagement = lazy(() =>
    import('../squad/SquadManagement').then(m => ({ default: m.SquadManagement }))
);
const Market = lazy(() =>
    import('../market/Market').then(m => ({ default: m.Market }))
);
const EventModePanel = lazy(() =>
    import('../events/EventModePanel').then(m => ({ default: m.EventModePanel }))
);
const PremiumShop = lazy(() =>
    import('../shop/PremiumShop').then(m => ({ default: m.PremiumShop }))
);
const TrainingHub = lazy(() =>
    import('../training/TrainingHub').then(m => ({ default: m.TrainingHub }))
);
const AchievementsPanel = lazy(() =>
    import('../achievements/AchievementsPanel').then(m => ({ default: m.AchievementsPanel }))
);
const ReplayViewer = lazy(() =>
    import('../replay/ReplayViewer').then(m => ({ default: m.ReplayViewer }))
);
const SettingsModal = lazy(() =>
    import('../settings/SettingsModal').then(m => ({ default: m.SettingsModal }))
);
const AdminPanelLazy = lazy(() =>
    import('../admin/AdminPanel').then(m => ({ default: m.AdminPanel }))
);
const CreatorSettingsLazy = lazy(() =>
    import('../settings/Settings').then(m => ({ default: m.Settings }))
);
// Placeholder for Career/Events if not fully implemented, or reuse generic panels
// We will use generic panels for Career/Events/Tournament for now if specific components don't exist
// But we can create simple placeholders inside MainMenu or separate files if needed.
// For now, I'll create a generic placeholder inside MainMenu for missing hubs.

// --- ICONS (Material Icons) ---
const ICONS = {
    HOME: 'home',
    PLAY: 'sports_soccer',
    SQUAD: 'groups',
    EVENTS: 'event_available',
    STORE: 'storefront',
    MARKET: 'compare_arrows',
    COINS: 'monetization_on',
    GEMS: 'diamond',
    SETTINGS: 'settings',
    PROFILE: 'person',
    LOCK: 'lock',
    ARROW_RIGHT: 'chevron_right',
    CAREER: 'emoji_events',
    TRAINING: 'fitness_center',
    ACHIEVEMENTS: 'military_tech',
    REPLAY: 'movie',
    BACK: 'arrow_back',
    ADMIN: 'admin_panel_settings'
};

// --- TYPES ---
type PanelType = 'NONE' | 'PLAY_MODE' | 'SQUAD_HUB' | 'CAREER_HUB' | 'EVENTS_HUB' | 'MARKET_HUB' | 'STORE_HUB' | 'TRAINING_HUB' | 'ACHIEVEMENTS_HUB' | 'REPLAY_HUB' | 'SETTINGS' | 'PROFILE' | 'ADMIN_PANEL';

export const MainMenu: React.FC = () => {
    const { user, resetPassword } = useAuthStore();
    const { startGame } = useGameStore();
    const { isMobile, isTablet } = useDeviceDetection();
    const navigate = useNavigate();

    // --- STATE ---
    const [activePanel, setActivePanel] = useState<PanelType>('NONE');
    const [playSubMode, setPlaySubMode] = useState<string | null>(null);
    const [adminView, setAdminView] = useState<'NONE' | 'OWNER' | 'CREATOR'>('NONE');

    // --- OVR CALCULATION ---
    const teamOvr = useMemo(() => {
        if (!user || !user.squad || user.squad.length === 0) return 0;
        const squadPlayers = user.squad.slice(0, 11).map(id => players.find(p => p.id === id)).filter(Boolean);
        if (squadPlayers.length === 0) return 0;
        const total = squadPlayers.reduce((sum, p) => sum + (p?.ovr || 0), 0);
        return Math.round(total / squadPlayers.length);
    }, [user?.squad]);

    // --- ANIMATED NUMBERS ---
    const [displayCoins, setDisplayCoins] = useState(0);
    const [displayGems, setDisplayGems] = useState(0);
    const [isShortScreen, setIsShortScreen] = useState(false);
    const isTouchPrimary = isMobile || isTablet;
    const isBaseMenu = activePanel === 'NONE';

    useEffect(() => {
        if (!isBaseMenu) return;
        AudioManager.loadAndPlay('music', '/audio/menu_theme.mp3');
    }, [isBaseMenu]);

    useEffect(() => {
        if (!user) return;
        let startTimestamp: number;
        const duration = 1000;
        const startCoins = displayCoins;
        const startGems = displayGems;
        const targetCoins = user.coins || 0;
        const targetGems = user.diamonds || user.gems || 0;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setDisplayCoins(Math.floor(startCoins + (targetCoins - startCoins) * progress));
            setDisplayGems(Math.floor(startGems + (targetGems - startGems) * progress));
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }, [user?.coins, user?.diamonds, user?.gems, displayCoins, displayGems]);

    useEffect(() => {
        const update = () => {
            if (typeof window === 'undefined') return;
            setIsShortScreen(window.innerHeight < 700);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // --- HANDLERS ---
    const handlePlayClick = () => setActivePanel('PLAY_MODE');
    const closePanel = () => {
        setActivePanel('NONE');
        setPlaySubMode(null);
        setAdminView('NONE');
    };

    // --- RENDER HELPERS ---
    
    const renderTopBar = () => {
        const isOwnerUser = user?.username === 'ThariqNoR';
        const isCreatorUser = user?.username === 'SREEHARI';
        const canSeeAdmin = isOwnerUser || isCreatorUser || user?.role === 'Owner';
        return (
            <div className="absolute top-0 right-0 z-30 p-4 flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                    {canSeeAdmin && (
                        <button
                            onClick={() => setActivePanel('ADMIN_PANEL')}
                            className={`rounded-full flex items-center justify-center border border-emerald-400/70 bg-black/60 shadow-[0_0_14px_rgba(52,211,153,0.5)] transition-colors ${
                                isTouchPrimary ? 'w-11 h-11' : 'w-9 h-9 hover:bg-black/80'
                            }`}
                        >
                            <span className="material-icons text-emerald-400 text-base">{ICONS.ADMIN}</span>
                        </button>
                    )}
                    <button
                        onClick={() => setActivePanel('SETTINGS')}
                        className={`rounded-full flex items-center justify-center border border-white/10 bg-black/40 transition-colors ${
                            isTouchPrimary ? 'w-11 h-11' : 'w-9 h-9 hover:bg-black/60'
                        }`}
                    >
                        <span className={`material-icons text-gray-200 ${isMobile ? 'text-xl' : 'text-base'}`}>{ICONS.SETTINGS}</span>
                    </button>
                    <div
                        onClick={() => setActivePanel('PROFILE')}
                        className={`flex items-center gap-3 bg-black/40 px-2 pr-4 py-1 rounded-full border border-white/10 cursor-pointer transition-colors ${
                            isTouchPrimary ? '' : 'hover:bg-black/60'
                        }`}
                    >
                        <div className={`${isMobile ? 'w-11 h-11' : 'w-9 h-9'} rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 border-2 border-white/20 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-lg`}>
                            {user?.displayName ? user.displayName[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'U')}
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-semibold text-white leading-tight">
                                {user?.username || 'Guest'}
                            </span>
                            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                                Level {user?.level || 1}
                            </span>
                            <div className="w-24 h-1 bg-gray-700 rounded-full mt-0.5 overflow-hidden">
                                <div className="h-full bg-yellow-500 w-[70%]" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                        <span className="material-icons text-yellow-400 text-base">{ICONS.COINS}</span>
                        <span className="text-white font-bold font-mono text-sm">{displayCoins.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                        <span className="material-icons text-blue-400 text-base">{ICONS.GEMS}</span>
                        <span className="text-white font-bold font-mono text-sm">{displayGems.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderCenterCore = () => (
        <div className="absolute inset-0 z-10">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-12 flex flex-col gap-3">
                {[
                    { id: 'PLAY_MENU', icon: ICONS.PLAY, label: 'Play', action: () => setActivePanel('PLAY_MODE') },
                    { id: 'MARKET_HUB', icon: ICONS.MARKET, label: 'Transfer Market', action: () => setActivePanel('MARKET_HUB') },
                    { id: 'STORE_PACKS', icon: ICONS.STORE, label: 'Packs', action: () => setActivePanel('STORE_HUB') },
                    { id: 'STORE_HUB', icon: ICONS.STORE, label: 'Store', action: () => setActivePanel('STORE_HUB') },
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={item.action}
                        className={`
                            w-[220px] md:w-[260px]
                            ${isMobile ? 'h-[64px]' : 'h-[56px]'}
                            bg-slate-900/85 border border-white/10 rounded-xl flex items-center gap-3 px-4
                            transition-colors transition-transform active:scale-95
                            ${isTouchPrimary ? '' : 'hover:bg-slate-800/95'}
                        `}
                    >
                        <span className="material-icons text-slate-100 text-2xl">{item.icon}</span>
                        <span className="text-white font-bold uppercase text-xs tracking-widest">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-16">
                <button
                    onClick={handlePlayClick}
                    className={`
                        group relative flex items-center justify-center overflow-hidden
                        ${isMobile ? 'w-[70vw] max-w-[420px] h-[80px]' : 'w-[420px] h-[96px]'}
                        bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400
                        rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.4)]
                        active:scale-95 transition-transform duration-150
                        ${isTouchPrimary ? '' : 'hover:scale-105 hover:shadow-[0_0_40px_rgba(234,179,8,0.7)]'}
                    `}
                >
                    <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-white/30 skew-x-[20deg] group-active:animate-shine" />
                    <div className="relative z-10 flex items-center gap-4 px-4">
                        <div className="p-2 bg-black/20 rounded-full border border-white/20">
                            <span className="material-icons text-white text-3xl">{ICONS.PLAY}</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-md">PLAY</span>
                            <span className="text-[10px] text-yellow-900 font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Kick Off</span>
                        </div>
                    </div>
                </button>
            </div>

            {!isShortScreen && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-12 flex flex-col gap-3 items-end">
                    <div className="w-[220px] md:w-[260px] h-[56px] bg-slate-900/85 border border-white/10 rounded-xl flex items-center justify-between px-4 transition-transform active:scale-95">
                        <div className="flex items-center gap-2">
                            <span className="material-icons text-emerald-400 text-2xl">{ICONS.SQUAD}</span>
                            <span className="text-white font-bold uppercase text-xs tracking-widest">My Squad</span>
                        </div>
                        <div className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                            {teamOvr} OVR
                        </div>
                    </div>
                    <button
                        onClick={() => setActivePanel('CAREER_HUB')}
                        className={`
                            w-[220px] md:w-[260px] h-[56px] bg-slate-900/80 border border-white/10 rounded-xl flex items-center gap-3 px-4
                            transition-colors transition-transform active:scale-95
                            ${isTouchPrimary ? '' : 'hover:bg-slate-800/95'}
                        `}
                    >
                        <span className="material-icons text-blue-400 text-2xl">{ICONS.CAREER}</span>
                        <span className="text-white font-bold uppercase text-xs tracking-widest">Career</span>
                    </button>
                    <div className="flex gap-2 mt-1">
                        {[
                            { id: 'TRAINING_HUB', icon: ICONS.TRAINING, label: 'Training' },
                            { id: 'ACHIEVEMENTS_HUB', icon: ICONS.ACHIEVEMENTS, label: 'Goals' },
                            { id: 'REPLAY_HUB', icon: ICONS.REPLAY, label: 'Replay' },
                            { id: 'EVENTS_HUB', icon: ICONS.EVENTS, label: 'Events' }
                        ].map(item => {
                            const isEvents = item.id === 'EVENTS_HUB';
                            return (
                            <button
                                key={item.id}
                                onClick={() => setActivePanel(item.id as PanelType)}
                                className={`
                                    flex flex-col items-center justify-center w-14 h-14 bg-black/50 rounded-full border border-white/10
                                    transition-colors transition-transform active:scale-95
                                    ${isTouchPrimary ? '' : 'hover:bg-black/70'}
                                    ${isEvents ? 'ring-2 ring-emerald-400/70 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : ''}
                                `}
                            >
                                <span className={`material-icons text-xl ${isEvents ? 'text-emerald-400' : 'text-slate-200'}`}>{item.icon}</span>
                                <span className="text-[9px] text-slate-400 uppercase font-bold mt-1">{item.label}</span>
                            </button>
                        );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    const renderBackground = () => (
        <div
            className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: "url('/img/menu_bg.jpg')" }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/80" />
        </div>
    );

    // BOTTOM NAV (Dock)
    const renderBottomNav = () => {
        const navItems = [
            { id: 'HOME', icon: ICONS.HOME, label: 'Home', action: () => setActivePanel('NONE') },
            { id: 'PLAY', icon: ICONS.PLAY, label: 'Play', action: () => setActivePanel('PLAY_MODE') },
            { id: 'SQUAD', icon: ICONS.SQUAD, label: 'Squad', action: () => setActivePanel('SQUAD_HUB') },
            { id: 'EVENTS', icon: ICONS.EVENTS, label: 'Events', action: () => setActivePanel('EVENTS_HUB') },
            { id: 'STORE', icon: ICONS.STORE, label: 'Store', action: () => setActivePanel('STORE_HUB') },
        ];

        return (
            <div className={`absolute bottom-0 left-0 right-0 z-30 bg-black/70 backdrop-blur-lg border-t border-white/10 ${isMobile ? 'h-[9%]' : 'h-[72px] px-16'}`}>
                <div className="flex justify-around items-center h-full max-w-4xl mx-auto">
                    {navItems.map(item => {
                        const isEvents = item.id === 'EVENTS';
                        const isActive =
                            activePanel === (item.id === 'HOME' ? 'NONE' : ((item.id + '_HUB') as any));
                        return (
                        <button 
                            key={item.id}
                            onClick={item.action}
                            className={`
                                flex flex-col items-center justify-center gap-1 w-full h-full
                                transition-all duration-150 active:scale-95
                                ${
                                    isActive
                                        ? 'text-yellow-400'
                                        : isTouchPrimary
                                        ? 'text-gray-400'
                                        : 'text-gray-400 hover:text-white'
                                }
                                ${isEvents ? 'relative' : ''}
                            `}
                        >
                            <span
                                className={`material-icons ${isMobile ? 'text-2xl' : 'text-3xl'} transition-transform ${
                                    isActive ? 'scale-110' : ''
                                }`}
                            >
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wide relative">
                                {item.label}
                                {isEvents && (
                                    <span className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                )}
                            </span>
                        </button>
                    );
                    })}
                </div>
            </div>
        );
    };

    // PLAY MODE PANEL (Big Cards)
    const renderPlayPanel = () => {
        if (activePanel !== 'PLAY_MODE') return null;
        
        const modes = [
            { 
                id: 'kickoff', 
                title: 'KICK OFF', 
                desc: 'Friendly • AI • Practice', 
                img: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                action: () => setPlaySubMode('KICK_OFF')
            },
            { 
                id: 'career', 
                title: 'CAREER', 
                desc: 'League • Cup • Season', 
                img: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                action: () => setActivePanel('CAREER_HUB') 
            },
            { 
                id: 'event', 
                title: 'EVENT MATCH', 
                desc: 'Daily • Weekly • Limited', 
                img: 'linear-gradient(135deg, #3f2c22 0%, #7c2d12 100%)',
                action: () => setActivePanel('EVENTS_HUB')
            },
            { 
                id: 'tourney', 
                title: 'TOURNAMENT', 
                desc: 'Knockout • Group Stage', 
                img: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                locked: true,
                unlockLevel: 10
            },
        ];

        return (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md animate-fade-in flex flex-col justify-end md:justify-center items-center">
                <div className="absolute inset-0" onClick={closePanel} />
                <div className={`
                    relative bg-slate-900 border-t md:border border-white/10 
                    w-full md:w-[800px] md:rounded-2xl overflow-hidden shadow-2xl
                    flex flex-col
                    ${isMobile ? 'h-[75%] rounded-t-3xl' : 'h-[600px]'}
                `}>
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <div className="flex items-center gap-4">
                            {playSubMode && (
                                <button onClick={() => setPlaySubMode(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                                    <span className="material-icons text-white text-sm">arrow_back</span>
                                </button>
                            )}
                            <div>
                                <h2 className="text-2xl font-black italic text-white uppercase">{playSubMode ? playSubMode.replace('_', ' ') : 'Select Mode'}</h2>
                                <p className="text-sm text-gray-400">Choose your path to glory</p>
                            </div>
                        </div>
                        <button onClick={closePanel} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                            <span className="material-icons text-white">close</span>
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {playSubMode === 'KICK_OFF' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { title: 'Friendly Match', desc: 'Balanced AI • Quick Play', action: () => { startGame(); navigate('/play'); } },
                                    { title: 'AI Match', desc: 'Difficulty Scaling • Earn XP', action: () => { startGame(); navigate('/play'); } },
                                    { title: 'Practice', desc: 'No Rewards • Training', action: () => { startGame(); navigate('/play'); } },
                                    { title: 'Local Offline', desc: '2 Player • Same Device', action: () => { startGame(); navigate('/play'); } }
                                ].map((sub, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={sub.action}
                                        className="bg-slate-800/50 p-6 rounded-xl border border-white/5 hover:bg-slate-700/50 transition-colors text-left group"
                                    >
                                        <h3 className="text-xl font-bold text-white group-hover:text-yellow-400">{sub.title}</h3>
                                        <p className="text-sm text-slate-400">{sub.desc}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {modes.map(mode => (
                                    <button 
                                        key={mode.id}
                                        onClick={mode.locked ? undefined : mode.action}
                                        className={`
                                            relative h-[120px] md:h-[180px] rounded-xl overflow-hidden group text-left p-6
                                            transition-all duration-300
                                            ${mode.locked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-xl cursor-pointer'}
                                        `}
                                        style={{ background: mode.img }}
                                    >
                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                            <div>
                                                <h3 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter">{mode.title}</h3>
                                                <p className="text-xs md:text-sm text-white/70 font-medium uppercase tracking-widest mt-1">{mode.desc}</p>
                                            </div>
                                            <div className="flex justify-end">
                                                {mode.locked ? (
                                                    <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full border border-white/10">
                                                        <span className="material-icons text-gray-400 text-sm">lock</span>
                                                        <span className="text-xs font-bold text-gray-400">Level {mode.unlockLevel}</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="material-icons text-white">arrow_forward</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderActivePanel = () => {
        if (activePanel === 'NONE' || activePanel === 'PLAY_MODE' || activePanel === 'SETTINGS') return null;

        if (activePanel === 'EVENTS_HUB') {
            return (
                <Suspense fallback={<div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center text-white text-sm">Loading Events...</div>}>
                    <EventModePanel onClose={closePanel} />
                </Suspense>
            );
        }

        if (activePanel === 'ADMIN_PANEL') {
            const isThariq = user?.username === 'ThariqNoR';
            const isSreehari = user?.username === 'SREEHARI';
            const isOwnerRole = user?.role === 'Owner';
            const isOwnerAccount = isThariq || isSreehari || isOwnerRole;
            const canSeeOwnerPanel = isOwnerAccount;
            const canSeeCreatorPanel = isOwnerAccount;
            return (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md animate-fade-in flex flex-col items-center justify-center overflow-y-auto py-8">
                    <div className="absolute inset-0" onClick={closePanel} />
                    <div className="relative w-full max-w-4xl mx-auto bg-slate-950/95 border border-emerald-500/40 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.6)] max-h-[90vh] overflow-y-auto pointer-events-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/40 bg-gradient-to-r from-emerald-600/20 via-black to-emerald-600/20">
                            <div>
                                <div className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-300/90">
                                    Legends Control Room
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                    Owner & Creator Panel
                                </h2>
                            </div>
                            <button
                                onClick={closePanel}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 border border-white/10 hover:bg-black/80 transition-colors"
                            >
                                <span className="material-icons text-white text-sm">close</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            {canSeeOwnerPanel && (
                                <div
                                    className="relative rounded-2xl border border-emerald-500/60 bg-gradient-to-br from-emerald-900/60 via-black to-emerald-950/80 p-5 shadow-[0_0_30px_rgba(16,185,129,0.35)] cursor-pointer hover:border-emerald-400 transition-colors"
                                    onClick={() => setAdminView(adminView === 'OWNER' ? 'NONE' : 'OWNER')}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300/90">
                                                Owner Panel
                                            </div>
                                            <div className="text-xl font-black text-white">
                                                Owner Controls
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                                            <span className="material-icons text-emerald-300 text-xl">{ICONS.ADMIN}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-emerald-100/90 leading-relaxed mb-4">
                                        Controls live economy valves, premium packs, and high-risk systems. Designed to keep MRN Football Legends safe, fair, and skill-first.
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-emerald-200/80 font-mono uppercase tracking-widest">
                                            Access: Owners Only
                                        </div>
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-[0.25em]"
                                        >
                                            {adminView === 'OWNER' ? 'Hide Owner Controls' : 'Open Owner Controls'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {canSeeCreatorPanel && (
                                <div
                                    className="relative rounded-2xl border border-sky-500/60 bg-gradient-to-br from-sky-900/60 via-black to-sky-950/80 p-5 shadow-[0_0_30px_rgba(56,189,248,0.35)] cursor-pointer hover:border-sky-400 transition-colors"
                                    onClick={() => setAdminView(adminView === 'CREATOR' ? 'NONE' : 'CREATOR')}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-[0.25em] text-sky-300/90">
                                                Creator Panel
                                            </div>
                                            <div className="text-xl font-black text-white">
                                                Creator Controls
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center">
                                            <span className="material-icons text-sky-300 text-xl">brush</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-sky-100/90 leading-relaxed mb-4">
                                        Controls visual identity, match feel, camera tuning, and UX flows so that every screen matches the MRN vision.
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-sky-200/80 font-mono uppercase tracking-widest">
                                            Access: Owners Only
                                        </div>
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-black text-[10px] font-black uppercase tracking-[0.25em]"
                                        >
                                            {adminView === 'CREATOR' ? 'Hide Creator Controls' : 'Open Creator Controls'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {adminView === 'OWNER' && (
                                <div className="md:col-span-2 rounded-2xl border border-emerald-500/60 bg-black/80 overflow-hidden">
                                    <Suspense fallback={<div className="w-full h-64 flex items-center justify-center text-sm text-emerald-300">Loading Owner Controls...</div>}>
                                        <AdminPanelLazy />
                                    </Suspense>
                                </div>
                            )}
                            {adminView === 'CREATOR' && (
                                <div className="md:col-span-2 rounded-2xl border border-sky-500/60 bg-black/80 overflow-hidden">
                                    <Suspense fallback={<div className="w-full h-64 flex items-center justify-center text-sm text-sky-300">Loading Creator Controls...</div>}>
                                        <CreatorSettingsLazy />
                                    </Suspense>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        const renderContent = () => {
            switch (activePanel) {
                case 'SQUAD_HUB':
                    return (
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white text-sm">Loading Squad...</div>}>
                            <SquadManagement onNavigate={(p) => setActivePanel(p as PanelType)} />
                        </Suspense>
                    );
                case 'TRAINING_HUB':
                    return (
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white text-sm">Loading Training...</div>}>
                            <TrainingHub />
                        </Suspense>
                    );
                case 'ACHIEVEMENTS_HUB':
                    return (
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white text-sm">Loading Goals...</div>}>
                            <AchievementsPanel />
                        </Suspense>
                    );
                case 'REPLAY_HUB':
                    return (
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white text-sm">Loading Replays...</div>}>
                            <ReplayViewer />
                        </Suspense>
                    );
                case 'PROFILE':
                    return (
                        <div className="w-full h-full flex items-center justify-center px-4">
                            <div className="w-full max-w-md bg-slate-950/95 border border-white/10 rounded-3xl shadow-2xl p-6 animate-scaleIn">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                                            Account
                                        </div>
                                        <div className="text-xl md:text-2xl font-black text-white">
                                            {user?.username || 'Player'}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 border-2 border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                        {user?.displayName ? user.displayName[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'U')}
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Email</span>
                                        <span className="text-white font-medium">{user?.email || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Username</span>
                                        <span className="text-white font-medium">{user?.username || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Level</span>
                                        <span className="text-white font-medium">Level {user?.level || 1}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">User ID</span>
                                        <span className="text-xs font-mono text-slate-200">{user?.uid || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Password</span>
                                        <span className="text-white font-medium tracking-[0.3em]">********</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                                        Secure Account
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!user?.email || !resetPassword) {
                                                window.alert('No email linked to this account.');
                                                return;
                                            }
                                            try {
                                                await resetPassword(user.email);
                                                window.alert(`Password reset link sent to ${user.email}`);
                                            } catch {
                                                window.alert('Failed to send reset link. Try again later.');
                                            }
                                        }}
                                        className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                case 'CAREER_HUB': return <div className="p-10 text-white text-center">Career Mode Coming Soon</div>;
                default: return <div className="p-10 text-white">Panel Content</div>;
            }
        };

        if (activePanel === 'MARKET_HUB') {
            return (
                <div className="absolute inset-0 z-40 pointer-events-none">
                    <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={closePanel} />
                    <div className="absolute inset-y-0 right-0 w-full md:w-[70%] bg-slate-900 border-l border-white/10 shadow-2xl animate-slideInRight pointer-events-auto flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                            <button
                                onClick={closePanel}
                                className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10 hover:bg-black/70 text-white text-sm font-bold uppercase transition-colors"
                            >
                                <span className="material-icons">{ICONS.BACK}</span>
                                <span>Back</span>
                            </button>
                            <span className="text-xs text-slate-300 uppercase tracking-widest">Transfer Market</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <Market />
                        </div>
                    </div>
                </div>
            );
        }

        if (activePanel === 'STORE_HUB') {
            return (
                <div className="absolute inset-0 z-40 pointer-events-none">
                    <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={closePanel} />
                    <div className="absolute left-0 right-0 bottom-0 h-[75%] md:h-[70%] bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-2xl animate-slideInUp pointer-events-auto flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                            <span className="text-xs text-slate-300 uppercase tracking-widest">Packs & Store</span>
                            <button
                                onClick={closePanel}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 border border-white/10 hover:bg-black/70 transition-colors"
                            >
                                <span className="material-icons text-white text-sm">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <PremiumShop />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="absolute inset-0 z-40 bg-black/60 animate-fadeIn">
                <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <button
                        onClick={closePanel}
                        className="pointer-events-auto flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10 hover:bg-black/70 text-white transition-colors"
                    >
                        <span className="material-icons">{ICONS.BACK}</span>
                        <span className="text-sm font-bold uppercase">Back</span>
                    </button>
                </div>
                <div className="w-full h-full pt-16 pb-20 overflow-hidden">
                    {renderContent()}
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans select-none">
            {renderBackground()}

            {renderTopBar()}
            {isBaseMenu && renderCenterCore()}
            {isBaseMenu && renderBottomNav()}
            
            {renderPlayPanel()}
            {renderActivePanel()}
            {activePanel === 'SETTINGS' && (
                <Suspense fallback={<div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center text-white text-sm">Loading Settings...</div>}>
                    <SettingsModal onClose={closePanel} />
                </Suspense>
            )}

            <style>{`
                @keyframes shine {
                    100% { left: 125%; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slideInUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.96); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-shine {
                    animation: shine 1s;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideInRight {
                    animation: slideInRight 0.25s ease-out;
                }
                .animate-slideInUp {
                    animation: slideInUp 0.3s ease-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};
