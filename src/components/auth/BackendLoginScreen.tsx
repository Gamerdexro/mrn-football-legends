/**
 * Backend-Integrated Login Component
 * Uses MRN Football Legends backend API for authentication
 * 
 * To use this instead of Firebase:
 * 1. Import this component in your MainMenu or auth flow
 * 2. Use it before or instead of Firebase LoginScreen
 */

import React, { useState, useEffect } from 'react';
import { loginWithBackend, registerWithBackend, checkBackendHealth } from '../../services/backendApiService';

interface BackendLoginProps {
  onLoginSuccess: (user: any) => void;
  onClose?: () => void;
}

export const BackendLoginScreen: React.FC<BackendLoginProps> = ({ onLoginSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState<boolean | null>(null);

  // Check if backend is available on mount
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkBackendHealth();
      setBackendHealth(isHealthy);
      if (!isHealthy) {
        setError('⚠️ Backend server is not available. Make sure backend is running or deployed.');
      }
    };
    checkHealth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (isLogin) {
        if (!username || !password) {
          throw new Error('Please enter username and password');
        }
        // Login
        const result = await loginWithBackend(username, password);
        console.log('✅ Login successful:', result.user);
        onLoginSuccess(result.user);
      } else {
        // Register
        if (!username || !email || !password) {
          throw new Error('Please fill in all fields');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const result = await registerWithBackend(username, email, password);
        console.log('✅ Registration successful:', result.user);
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      const message = err.message || 'Authentication failed';
      setError(message);
      console.error('❌ Auth error:', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Backend Status Indicator */}
        <div className="mb-4 p-3 rounded-lg text-sm">
          {backendHealth === null && <span className="text-yellow-500">🔄 Checking backend...</span>}
          {backendHealth === true && <span className="text-green-500">✅ Backend connected</span>}
          {backendHealth === false && <span className="text-red-500">❌ Backend offline</span>}
        </div>

        {/* Login/Register Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            {isLogin ? 'Login' : 'Register'}
          </h1>
          <p className="text-gray-400 text-center mb-6 text-sm">
            {isLogin ? 'Enter your credentials' : 'Create a new account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                disabled={loading}
              />
            </div>

            {/* Email - Only for Register */}
            {!isLogin && (
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  disabled={loading}
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                disabled={loading}
              />
              {!isLogin && (
                <p className="text-gray-500 text-xs mt-1">Min. 6 characters</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || backendHealth === false}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setUsername('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>

          {/* Backend URL Info */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-xs text-center">
              Backend: {import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}
            </p>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-400 hover:text-gray-300 transition-colors text-sm"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};

export default BackendLoginScreen;
