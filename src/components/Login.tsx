import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, ChevronRight, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { API_BASE, GOOGLE_CLIENT_ID } from '../config';
import type { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hostel, setHostel] = useState('Hostel A');
  
  // Custom manual sign in state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const isSimulatorMode = GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' || !GOOGLE_CLIENT_ID;

  const handleRealGoogleLogin = async (idToken: string) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed');
      } else {
        // Now save the selected hostel
        const profileRes = await fetch(`${API_BASE}/auth/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, hostel }),
        });
        const updatedUser = await profileRes.json();
        
        localStorage.setItem('shippy_user', JSON.stringify(updatedUser));
        onLoginSuccess(updatedUser);
      }
    } catch (err) {
      setErrorMessage('Unable to connect to Shippy server. Is the backend running?');
    }
  };

  const handleOAuthSelection = async (email: string, name: string, avatar?: string) => {
    setErrorMessage(null);

    // Frontend validation (matching backend)
    if (!email.toLowerCase().endsWith('@snu.edu.in')) {
      setErrorMessage('Access Denied: Shippy is currently exclusive to Shiv Nadar University students (must use your @snu.edu.in email).');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatar }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed');
      } else {
        // Now save the selected hostel
        const profileRes = await fetch(`${API_BASE}/auth/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, hostel }),
        });
        const updatedUser = await profileRes.json();
        
        localStorage.setItem('shippy_user', JSON.stringify(updatedUser));
        onLoginSuccess(updatedUser);
      }
    } catch (err) {
      setErrorMessage('Unable to connect to Shippy server. Is the backend running?');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    handleOAuthSelection(customEmail, customName);
  };

  return (
    <div className="min-h-screen bg-shippy-bg relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden noise-bg">
      {/* Top Banner decoration - hidden on desktop card */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#f3ede3] to-transparent pointer-events-none md:hidden" />

      {/* Decorative Orbs */}
      <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-shippy-orange/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-shippy-green/5 blur-3xl pointer-events-none" />

      {/* Responsive Card Container */}
      <div className="w-full max-w-md md:max-w-5xl bg-white md:border md:border-shippy-border/80 rounded-[32px] md:shadow-2xl overflow-hidden flex flex-col md:flex-row md:h-[650px] z-10">
        
        {/* Left Side: App Pitch Illustration (visible on laptop/desktop only) */}
        <div className="hidden md:flex md:w-1/2 bg-shippy-charcoal text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-shippy-orange/20 to-transparent opacity-85 pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-shippy-orange/10 blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 z-10">
            <div className="w-8.5 h-8.5 rounded-xl bg-shippy-orange flex items-center justify-center text-white font-extrabold text-lg shadow-sm">S</div>
            <span className="font-extrabold text-xl tracking-tight text-white">SHIPPY</span>
          </div>

          <div className="space-y-6 z-10 my-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-shippy-orange text-xs font-bold">
              <Sparkles className="w-3 h-3" />
              <span>CAMPUS CO-DELIVERY</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Don't order alone. <br />
              <span className="text-shippy-orange relative">
                Shippy it.
                <span className="absolute bottom-1 left-0 w-full h-1.5 bg-shippy-orange/25 -z-10 rounded-full" />
              </span>
            </h1>
            <p className="text-sm text-white/70 font-semibold leading-relaxed max-w-sm">
              Connect with nearby SNU students ordering from Blinkit. Instantly share carts, split delivery/packaging fees proportionally, and lock free shipping collectively.
            </p>

            <div className="space-y-3 pt-6 border-t border-white/10 text-xs font-bold text-white/80">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-shippy-orange/20 flex items-center justify-center text-shippy-orange text-[10px]">✓</div>
                <span>Lock free delivery thresholds collectively</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-shippy-orange/20 flex items-center justify-center text-shippy-orange text-[10px]">✓</div>
                <span>Proportionate automated fee splits</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-shippy-orange/20 flex items-center justify-center text-shippy-orange text-[10px]">✓</div>
                <span>Hostel-verified student network</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider z-10">
            Secure Student Portal • SNU Only
          </p>
        </div>

        {/* Right Side: Form Content (Acts as normal mobile content on small screens) */}
        <div className="flex-1 p-6 md:p-12 flex flex-col justify-between bg-white relative">
          
          {/* Top Bar for Mobile Login (Hidden on Desktop) */}
          <div className="w-full flex justify-between items-center z-10 pt-2 md:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-shippy-orange flex items-center justify-center text-white font-bold text-lg shadow-sm">S</div>
              <span className="font-bold text-xl tracking-tight text-shippy-charcoal">SHIPPY</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-shippy-border/80 px-2.5 py-1 rounded-full text-xs font-semibold text-shippy-brown shadow-xs">
              <Shield className="w-3.5 h-3.5 text-shippy-green" fill="currentColor" fillOpacity={0.1} />
              <span>SNU Only</span>
            </div>
          </div>

          {/* Desktop specific top badge */}
          <div className="hidden md:flex justify-end items-center">
            <div className="flex items-center gap-1 bg-shippy-bg border border-shippy-border/60 px-3 py-1 rounded-full text-[11px] font-extrabold text-shippy-brown">
              <Shield className="w-3.5 h-3.5 text-shippy-green" fill="currentColor" fillOpacity={0.1} />
              <span>Shiv Nadar University Portal</span>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center py-8 md:py-0 z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center md:text-left"
            >
              {/* Mobile hero title (Hidden on Desktop) */}
              <div className="md:hidden">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8E0] text-shippy-orange text-xs font-bold mb-4">
                  <Sparkles className="w-3 h-3" />
                  <span>CAMPUS CO-DELIVERY</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-shippy-charcoal leading-[1.1] mb-3">
                  Don't order alone. <br />
                  <span className="text-shippy-orange relative font-extrabold">
                    Shippy it.
                    <span className="absolute bottom-1 left-0 w-full h-1.5 bg-[#F9DFD2] -z-10 rounded-full" />
                  </span>
                </h1>
                <p className="text-sm text-shippy-brown font-medium leading-relaxed mb-6 max-w-xs mx-auto">
                  Share carts, split fees proportionally, and lock free delivery.
                </p>
              </div>

              {/* Desktop hero title (Hidden on Mobile) */}
              <div className="hidden md:block mb-6">
                <h2 className="text-2xl font-extrabold text-shippy-charcoal leading-tight">Welcome to Shippy</h2>
                <p className="text-xs text-shippy-brown font-semibold mt-1">Select your drop destination and authenticate to enter.</p>
              </div>

              {/* Form Box */}
              <div className="bg-white md:bg-transparent border border-shippy-border/90 md:border-none rounded-3xl p-6 md:p-0 shadow-md md:shadow-none">
                {isSimulatorMode && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[10px] font-bold text-amber-800 text-center leading-normal">
                    ⚠️ Sandbox Mode active. Paste your Google Client ID in config.ts to enable real Sign-In.
                  </div>
                )}

                <label className="block text-xs font-extrabold uppercase tracking-wider text-shippy-brown/60 mb-2 text-left">Select Hostel / Drop Point</label>
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  className="w-full bg-shippy-bg border border-shippy-border rounded-xl px-4 py-3 font-semibold text-sm text-shippy-charcoal focus:outline-none focus:ring-2 focus:ring-shippy-orange/20 mb-6"
                >
                  <option value="Hostel A">Hostel A</option>
                  <option value="Hostel B">Hostel B</option>
                  <option value="Hostel C">Hostel C</option>
                  <option value="Library">Library</option>
                  <option value="Main Gate">Main Gate</option>
                </select>

                {isSimulatorMode ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowGoogleModal(true)}
                    className="w-full bg-shippy-charcoal hover:bg-shippy-brown text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-3 text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.882-6.437-6.437s2.882-6.437 6.437-6.437c1.583 0 3.02.574 4.137 1.517l3.08-3.08C19.18 2.193 15.932 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.897 0 10.748-4.249 10.748-10.286a10.9 10.9 0 0 0-.214-2.185H12.24Z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </motion.button>
                ) : (
                  <div className="flex justify-center w-full">
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        if (credentialResponse.credential) {
                          await handleRealGoogleLogin(credentialResponse.credential);
                        }
                      }}
                      onError={() => {
                        setErrorMessage('Google Sign-In failed. Please try again.');
                      }}
                      useOneTap
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Footer tagline */}
          <div className="w-full text-center py-2 z-10 border-t border-shippy-border/40 md:border-none pt-4 md:pt-0">
            <p className="text-[10px] text-shippy-brown font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-shippy-brown/60" />
              <span>One campus. One cart. Less delivery fees.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Simulated Google Account Chooser Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-shippy-border shadow-2xl p-6 relative"
            >
              {/* Google Brand Header */}
              <div className="flex flex-col items-center mb-6">
                <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <h2 className="text-xl font-bold text-shippy-charcoal">Sign in with Google</h2>
                <p className="text-xs text-shippy-brown font-medium mt-1">to continue to <strong className="text-shippy-orange">Shippy</strong></p>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 mb-4 leading-relaxed">
                  {errorMessage}
                </div>
              )}

              {!showCustomInput ? (
                <div className="space-y-3">
                  {/* Account 1 - Success case */}
                  <button
                    onClick={() => handleOAuthSelection('shree.gattani@snu.edu.in', 'Shree Gattani')}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-shippy-bg border border-shippy-border/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-shippy-orange/10 flex items-center justify-center text-shippy-orange font-bold">
                        SG
                      </div>
                      <div>
                        <div className="text-sm font-bold text-shippy-charcoal">Shree Gattani</div>
                        <div className="text-xs text-shippy-brown font-medium">shree.gattani@snu.edu.in</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-shippy-brown/40" />
                  </button>

                  {/* Account 2 - Blocked case */}
                  <button
                    onClick={() => handleOAuthSelection('riya.sen@gmail.com', 'Riya Sen')}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-shippy-bg border border-shippy-border/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-shippy-brown/10 flex items-center justify-center text-shippy-brown font-bold">
                        RS
                      </div>
                      <div>
                        <div className="text-sm font-bold text-shippy-charcoal">Riya Sen (Personal)</div>
                        <div className="text-xs text-shippy-brown font-medium">riya.sen@gmail.com</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-shippy-brown/40" />
                  </button>

                  <div className="border-t border-shippy-border my-2 pt-2" />

                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full text-center text-xs font-bold text-shippy-orange py-2 hover:underline"
                  >
                    Use another SNU email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCustomSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-shippy-charcoal mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shree Gattani"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-shippy-bg border border-shippy-border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-shippy-orange/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-shippy-charcoal mb-1">SNU Google Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. shree.gattani@snu.edu.in"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full bg-shippy-bg border border-shippy-border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-shippy-orange/20"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="flex-1 bg-shippy-bg hover:bg-shippy-cream text-shippy-charcoal font-bold py-2 rounded-xl text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-shippy-orange hover:bg-shippy-orange/90 text-white font-bold py-2 rounded-xl text-xs"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-4 right-4 text-shippy-brown/50 hover:text-shippy-charcoal font-bold text-sm"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
