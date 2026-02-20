import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';

export const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuthStore();
  const { settings, updateSettings } = useGameStore();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 border border-white/20 flex items-center justify-center text-white font-bold text-sm">
              {user?.displayName ? user.displayName[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'U')}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">
                {user?.username || 'Guest'}
              </span>
              <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-widest">
                Level {user?.level || 1}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
              Settings
            </h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-red-500 text-slate-300 hover:text-white transition-colors"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Graphics */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Graphics</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Quality</span>
                <select 
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                  value={settings.graphicsQuality}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH';
                    updateSettings({ graphicsQuality: value });
                  }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">FPS Limit</span>
                <select 
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                  value={settings.fpsLimit}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) as 30 | 60;
                    updateSettings({ fpsLimit: value });
                  }}
                >
                  <option value={30}>30 FPS</option>
                  <option value={60}>60 FPS</option>
                </select>
              </div>
            </div>
          </section>

          {/* Audio */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Audio</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Master Volume</span>
                <input 
                  type="range" 
                  className="w-24 accent-yellow-500" 
                  min={0}
                  max={100}
                  value={Math.round(settings.masterVolume * 100)}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(100, Number(e.target.value)));
                    updateSettings({ masterVolume: value / 100 });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Commentary</span>
                <button
                  type="button"
                  onClick={() => updateSettings({ commentaryEnabled: !settings.commentaryEnabled })}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                    settings.commentaryEnabled ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
                      settings.commentaryEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Commentary Language</span>
                <select
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                  value={settings.commentaryLanguage}
                  onChange={(e) =>
                    updateSettings({
                      commentaryLanguage: e.target.value as any
                    })
                  }
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="pt">Português</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="ar">العربية</option>
                  <option value="hi">हिन्दी</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Commentary Intensity</span>
                <select
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                  value={settings.commentaryIntensity}
                  onChange={(e) =>
                    updateSettings({
                      commentaryIntensity: e.target.value.toUpperCase() as any
                    })
                  }
                >
                  <option value="CALM">Calm</option>
                  <option value="BALANCED">Balanced</option>
                  <option value="ENERGETIC">Energetic</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Commentary Frequency</span>
                <select
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                  value={settings.commentaryFrequency}
                  onChange={(e) =>
                    updateSettings({
                      commentaryFrequency: e.target.value.toUpperCase() as any
                    })
                  }
                >
                  <option value="KEY">Key Moments</option>
                  <option value="ALL">All Events</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Explain Big Moments</span>
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({
                      commentaryExplainBigMoments: !settings.commentaryExplainBigMoments
                    })
                  }
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                    settings.commentaryExplainBigMoments ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
                      settings.commentaryExplainBigMoments ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Crowd vs Commentary</span>
                <input
                  type="range"
                  className="w-24 accent-yellow-500"
                  min={0}
                  max={100}
                  value={Math.round(settings.commentaryCrowdBalance * 100)}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(100, Number(e.target.value)));
                    updateSettings({ commentaryCrowdBalance: value / 100 });
                  }}
                />
              </div>
            </div>
          </section>

          {/* Gameplay */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Gameplay</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Virtual Stick</span>
                <button
                  type="button"
                  onClick={() => updateSettings({ virtualStickEnabled: !settings.virtualStickEnabled })}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                    settings.virtualStickEnabled ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
                      settings.virtualStickEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Auto-Switching</span>
                <button
                  type="button"
                  onClick={() => updateSettings({ autoSwitchingEnabled: !settings.autoSwitchingEnabled })}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                    settings.autoSwitchingEnabled ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
                      settings.autoSwitchingEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Account */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Account</h4>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => useAuthStore.getState().logout()}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 text-xs"
              >
                <span className="material-icons text-sm">logout</span>
                Logout
              </button>
            </div>
          </section>
          
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-[10px] text-slate-600">Version 1.0.0 | MRN Football Legends</p>
          </div>
        </div>
      </div>
    </div>
  );
};
