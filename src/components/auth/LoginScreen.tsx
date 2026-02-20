import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

// --- Auth Modal Component (Original Login Logic) ---
interface AuthModalProps {
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [logoError, setLogoError] = useState(false);
    
    const { login, signup, resetPassword, isLoading } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (isLogin) {
            if (!email || !password) {
                setError('Please fill in all fields');
                return;
            }
        } else {
            if (!email || !username || !password) {
                setError('Please fill in all fields');
                return;
            }
        }

        const trimmedEmail = email.trim();
        const trimmedUsername = username.trim();

        try {
            if (isLogin) {
                await login(trimmedEmail, password);
            } else {
                await signup(trimmedEmail, password, trimmedUsername);
            }
        } catch (err: any) {
            const raw = err?.message || 'Authentication failed';
            if (!isLogin && raw.toLowerCase().includes('username already taken')) {
                setError('This username is used by someone. Change the username to continue.');
            } else {
                setError(raw);
            }
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');
        const trimmed = resetEmail.trim();
        if (!trimmed) {
            setResetError('Enter your email to reset password');
            return;
        }
        try {
            if (resetPassword) {
                await resetPassword(trimmed);
                setResetMessage('Password reset link has been sent to your email');
            } else {
                setResetError('Password reset is not available');
            }
        } catch (err: any) {
            setResetError(err.message || 'Failed to send reset link');
        }
    };

    const renderFormFields = () => {
        return (
            <>
                <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="you@example.com"
                    />
                </div>
                {!isLogin && (
                    <div>
                        <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="Unique name for this account"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="••••••••"
                    />
                </div>
            </>
        );
    };

    return (
        <div className="relative z-50 w-full max-w-md p-8 bg-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl animate-fade-in mx-4">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
                <span className="material-icons">close</span>
            </button>
            
            <div className="text-center mb-6 flex flex-col items-center">
                <div className="w-28 h-28 mb-3 rounded-lg overflow-hidden bg-black/40 border-2 border-amber-500/80 shadow-lg shadow-amber-500/50 flex items-center justify-center relative">
                    {!logoError ? (
                        <img
                            src="/logo.svg"
                            alt="MRN Football Legends"
                            className="w-full h-full object-contain"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <span className="text-xl font-extrabold tracking-[0.25em] text-emerald-400">MRN</span>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-white">
                    {isLogin ? 'Welcome Back' : 'Join the League'}
                </h2>
            </div>

            <div className="flex mb-6 bg-gray-900/50 p-1 rounded-lg">
                <button 
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isLogin ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Login
                </button>
                <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!isLogin ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Create Account
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {renderFormFields()}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                    {isLoading ? 'Processing...' : (isLogin ? 'ENTER GAME' : 'CREATE LEGEND')}
                </button>
            </form>

            {isLogin && (
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsResetOpen(true);
                            setResetEmail(email);
                            setResetError('');
                            setResetMessage('');
                        }}
                        className="text-xs text-emerald-300 hover:text-emerald-100 transition-colors underline underline-offset-4"
                    >
                        Forgot password?
                    </button>
                </div>
            )}
            
            {!isLogin && (
                <p className="text-xs text-gray-500 mt-4 text-center">
                    By creating an account, you agree to Fair Play rules. No automation allowed.
                </p>
            )}

            {isResetOpen && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm rounded-2xl">
                    <div className="w-full p-6">
                        <h2 className="text-xl font-semibold text-white text-center mb-2">Reset Password</h2>
                        <p className="text-xs text-gray-400 text-center mb-4">Enter your email to receive a reset link.</p>

                        {resetError && <div className="mb-3 p-2 text-red-200 text-xs text-center bg-red-500/20 rounded">{resetError}</div>}
                        {resetMessage && <div className="mb-3 p-2 text-emerald-200 text-xs text-center bg-emerald-500/20 rounded">{resetMessage}</div>}

                        <form onSubmit={handleResetSubmit} className="space-y-3">
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                                placeholder="you@example.com"
                            />
                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-bold">
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                        <button onClick={() => setIsResetOpen(false)} className="mt-4 w-full text-xs text-gray-400 hover:text-white">Back</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Landing Page Component ---

export const LoginScreen: React.FC = () => {
    const [showAuth, setShowAuth] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Detect scroll for navbar
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-emerald-500/30">
            
            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-gray-900/90 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/logo.svg" alt="MRN Football Legends" className="w-10 h-10 object-contain" />
                        <span className="font-black italic text-lg tracking-wider hidden sm:block">MRN <span className="text-emerald-400">LEGENDS</span></span>
                    </div>
                    <button 
                        onClick={() => setShowAuth(true)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-full text-sm transition-transform hover:scale-105"
                    >
                        PLAY NOW
                    </button>
                </div>
            </nav>

            <header className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('/img/menu_hero_ultra.jpg')] bg-cover bg-center opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-gray-950/80" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
                    <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-6 animate-pulse">
                        New Season Available
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 leading-tight drop-shadow-2xl">
                        BUILD YOUR CLUB.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">DOMINATE THE LEAGUE.</span>
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                        Experience the next generation of football management. Collect legends, build your dream squad, and compete in real-time matches.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => setShowAuth(true)}
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-lg py-4 px-10 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transform transition-all hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <span className="material-icons">sports_soccer</span>
                            PLAY FOR FREE
                        </button>
                        <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white font-bold text-lg py-4 px-10 rounded-xl transition-all flex items-center justify-center gap-2">
                            <span className="material-icons">play_circle</span>
                            WATCH TRAILER
                        </button>
                    </div>
                    
                    {/* App Store Badges (Mock) */}
                    <div className="mt-12 flex items-center justify-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
                         <div className="h-10 w-32 bg-white/10 rounded border border-white/20 flex items-center justify-center text-[10px] text-gray-400">
                            App Store
                         </div>
                         <div className="h-10 w-32 bg-white/10 rounded border border-white/20 flex items-center justify-center text-[10px] text-gray-400">
                            Google Play
                         </div>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-24 px-6 bg-gray-950 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black italic mb-4">GAME FEATURES</h2>
                        <div className="h-1 w-20 bg-emerald-500 mx-auto rounded-full"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: 'groups', title: 'Build Your Squad', desc: 'Collect over 5,000 real players and create your ultimate team strategy.' },
                            { icon: 'emoji_events', title: 'Compete & Win', desc: 'Climb the global leaderboards in ranked matches and weekly tournaments.' },
                            { icon: 'candlestick_chart', title: 'Live Market', desc: 'Buy, sell, and trade players in a dynamic real-time transfer market.' }
                        ].map((feature, i) => (
                            <div key={i} className="bg-gray-900/50 p-8 rounded-2xl border border-white/5 hover:border-emerald-500/50 transition-all hover:-translate-y-2 group">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                                    <span className="material-icons text-3xl text-emerald-400">{feature.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gameplay Preview (Carousel Placeholder) */}
            <section className="py-24 px-6 bg-gray-900 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <h2 className="text-3xl md:text-4xl font-black italic mb-6">NEXT-GEN MOBILE GAMEPLAY</h2>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Experience console-quality graphics right in your browser. Fluid animations, realistic physics, and immersive stadiums await.
                            </p>
                            <ul className="space-y-4">
                                {['Realistic Physics Engine', 'Dynamic Lighting & Weather', 'Customizable Tactics'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-300">
                                        <span className="material-icons text-emerald-500 text-sm">check_circle</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex-1 relative">
                            {/* Mockup Frame */}
                            <div className="relative z-10 bg-gray-950 border-8 border-gray-800 rounded-[2rem] shadow-2xl overflow-hidden aspect-video transform rotate-2 hover:rotate-0 transition-transform duration-500 group">
                                <img 
                                    src="/img/gameplay_preview.jpg" 
                                    alt="Gameplay Preview" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                                        <span className="material-icons text-3xl text-white">play_arrow</span>
                                    </div>
                                </div>
                                {/* Scanlines effect */}
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 pointer-events-none"></div>
                            </div>
                            <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl -z-10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="font-black italic text-2xl tracking-wider mb-2">MRN <span className="text-emerald-400">LEGENDS</span></div>
                        <p className="text-gray-500 text-sm">© 2026 GTB_STUDIO. All rights reserved.</p>
                    </div>
                    <div className="flex gap-6">
                        {['Privacy Policy', 'Terms of Service', 'Support'].map((link) => (
                            <a key={link} href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{link}</a>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        {/* Social Icons (Text for now) */}
                        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">
                            <span className="material-icons text-sm">share</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Auth Overlay */}
            {showAuth && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <AuthModal onClose={() => setShowAuth(false)} />
                </div>
            )}
        </div>
    );
};
