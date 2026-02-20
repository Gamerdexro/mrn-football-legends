import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useGameStore } from './store/useGameStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { MainMenu } from './components/menu/MainMenu';
import { ProgressionHub } from './components/progression/ProgressionHub.tsx';
import { CampaignsHub } from './components/campaigns/CampaignsHub';
import { MatchCenter } from './components/matches/MatchCenter';
import { IntroScene } from './scenes/IntroScene';
import { AudioManager } from './services/audioManager';
import { useDeviceDetection } from './hooks/useDeviceDetection';

const GameScene = lazy(() => import('./game/GameScene'));

function App() {
  const { isAuthenticated } = useAuthStore();
  const { isPlaying, settings, updateSettings } = useGameStore();
  const [showIntro, setShowIntro] = useState(true);
  const { isMobile, isTablet, isLowMemory } = useDeviceDetection();

  useEffect(() => {
    AudioManager.setSettings({
      masterVolume: settings.masterVolume,
      soundEnabled: settings.soundEnabled,
      musicEnabled: settings.musicEnabled,
      commentaryEnabled: settings.commentaryEnabled,
      commentaryCrowdBalance: settings.commentaryCrowdBalance
    });
  }, [
    settings.masterVolume,
    settings.soundEnabled,
    settings.musicEnabled,
    settings.commentaryEnabled,
    settings.commentaryCrowdBalance
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const key = 'mrn_device_profile_applied';
    try {
      if (localStorage.getItem(key)) return;
      let graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH' = settings.graphicsQuality;
      let fpsLimit: 30 | 60 = settings.fpsLimit;
      if (isMobile || isTablet) {
        if (isLowMemory) {
          graphicsQuality = 'LOW';
          fpsLimit = 30;
        } else {
          graphicsQuality = graphicsQuality === 'HIGH' ? 'MEDIUM' : graphicsQuality;
          fpsLimit = 60;
        }
      }
      updateSettings({ graphicsQuality, fpsLimit });
      localStorage.setItem(key, '1');
    } catch {
    }
  }, [isMobile, isTablet, isLowMemory, settings.graphicsQuality, settings.fpsLimit, updateSettings]);

  if (!isAuthenticated) return <LoginScreen />;

  if (showIntro) {
    return <IntroScene onComplete={() => setShowIntro(false)} />;
  }

  if (isPlaying) {
    return (
      <BrowserRouter>
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center bg-black text-white text-lg">Loading Match...</div>}>
          <GameScene />
        </Suspense>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/career" element={<MainMenu />} />
        <Route path="/carrer" element={<MainMenu />} />
        <Route path="/kickoff" element={<MainMenu />} />
        <Route path="/admin-abuse" element={<MainMenu />} />
        <Route path="/market" element={<MainMenu />} />
        <Route path="/rivals" element={<MainMenu />} />
        <Route path="/forge" element={<MainMenu />} />
        <Route path="/vault" element={<MainMenu />} />
        <Route path="/missions" element={<MainMenu />} />
        <Route path="/exchanges" element={<MainMenu />} />
        <Route path="/my-club" element={<MainMenu />} />
        <Route path="/settings" element={<MainMenu />} />
        <Route path="/squad" element={<MainMenu />} />
        <Route path="/shop" element={<MainMenu />} />
        <Route path="/friends" element={<MainMenu />} />
        <Route path="/my-club" element={<MainMenu />} />
        <Route path="/rivals" element={<MainMenu />} />
        <Route path="/campaigns" element={<CampaignsHub />} />
        <Route path="/forge" element={<MainMenu />} />
        <Route path="/vault" element={<MainMenu />} />
        <Route path="/missions" element={<MainMenu />} />
        <Route path="/exchanges" element={<MainMenu />} />
        <Route path="/profile" element={<MainMenu />} />
        <Route path="/alliances" element={<MainMenu />} />
        <Route path="/control-room" element={<MainMenu />} />
        <Route path="/season-reset" element={<MainMenu />} />
        <Route path="/progression" element={<ProgressionHub />} />
        <Route path="/match-center" element={<MatchCenter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
