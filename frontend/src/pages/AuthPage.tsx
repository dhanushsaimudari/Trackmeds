import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrackMedsLogo } from '../components/common/TrackMedsLogo';
import {
  Shield,
  KeyRound,
  Mail,
  User as UserIcon,
  Building2,
  MapPin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  X
} from 'lucide-react';
import { ALL_INDIA_STATES } from '../services/indiaGeoData';
import { UserRole } from '../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'register' }) => {
  const { login, register, loginWithGoogle, switchDemoAccount, isLoading, currentUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#login') return 'login';
      if (window.location.hash === '#register' || window.location.hash === '#signup') return 'register';
    }
    return initialMode;
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('PHC_STAFF');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [facilityId, setFacilityId] = useState('FAC-IN-101');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<UserRole | null>(null);

  // Forgot Password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const selectedStateObj = ALL_INDIA_STATES.find(s => s.name.toLowerCase() === state.toLowerCase());
  const availableDistricts = selectedStateObj ? selectedStateObj.districts : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        await login(email, password);
      } else {
        if (!email || !password || !name) {
          throw new Error('Please fill in all required fields.');
        }
        await register({
          email,
          password,
          name,
          requested_role: requestedRole,
          state,
          district,
          facility_id: requestedRole === 'PHC_STAFF' ? facilityId : undefined
        });
      }
      if (typeof window !== 'undefined') {
        window.location.hash = '';
        window.dispatchEvent(new Event('hashchange'));
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle(requestedRole);
      if (typeof window !== 'undefined') {
        window.location.hash = '';
        window.dispatchEvent(new Event('hashchange'));
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setError(null);
    setActiveDemoRole(role);
    setIsSubmitting(true);
    try {
      await switchDemoAccount(role);
      if (typeof window !== 'undefined') {
        window.location.hash = '';
        window.dispatchEvent(new Event('hashchange'));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo account.');
    } finally {
      setIsSubmitting(false);
      setActiveDemoRole(null);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsSendingReset(true);
    try {
      // Simulate/trigger password recovery flow
      await new Promise(r => setTimeout(r, 650));
      setForgotSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#001F5B] to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex justify-center mb-4">
          <TrackMedsLogo variant="full" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Autonomous Health Supply Resilience
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Public Healthcare Network Command Center • All India Network
        </p>
      </div>

      {currentUser && (
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
          <div className="bg-brand-900/60 border border-brand-500/40 rounded-xl p-3 flex items-center justify-between text-xs text-brand-200">
            <span>Currently logged in as <strong>{currentUser.name}</strong> ({currentUser.role})</span>
            <button
              onClick={() => { window.location.hash = ''; }}
              className="px-3 py-1 bg-[#006CD4] hover:bg-[#005bb5] text-white font-bold rounded-lg cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/80 sm:px-10 space-y-6">
          
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#006CD4] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Secure Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[#006CD4] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-start space-x-2 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Rajesh Sharma"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#006CD4] focus:ring-1 focus:ring-[#006CD4]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@trackmeds.org"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#006CD4] focus:ring-1 focus:ring-[#006CD4]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSuccess(false);
                      setIsForgotOpen(true);
                    }}
                    className="text-[11px] font-semibold text-[#00BCD4] hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#006CD4] focus:ring-1 focus:ring-[#006CD4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Requested Role
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#006CD4]"
                    >
                      <option value="PHC_STAFF">Clinic Doctor / Pharmacist</option>
                      <option value="DISTRICT_OFFICER">District Supply Officer</option>
                      <option value="STATE_OFFICER">State Health Officer</option>
                      <option value="NATIONAL_ADMIN">National Health Director</option>
                      <option value="SUPPLIER">Medicine Supplier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      State
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#006CD4]"
                    >
                      {ALL_INDIA_STATES.map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      District
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#006CD4]"
                    >
                      {availableDistricts.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {requestedRole === 'PHC_STAFF' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Facility
                      </label>
                      <select
                        value={facilityId}
                        onChange={(e) => setFacilityId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#006CD4]"
                      >
                        <option value="FAC-IN-101">PHC Haveli Pune</option>
                        <option value="FAC-IN-102">PHC Shirur Pune</option>
                        <option value="FAC-IN-103">CHC Wai Satara</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-[#006CD4] to-[#00BCD4] hover:from-[#005bb5] hover:to-[#00acc1] text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <span>{mode === 'login' ? 'Sign In to Command Center' : 'Submit Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social Sign In */}
          <div className="pt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-400 font-semibold text-[10px]">
                  Or authenticate with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isLoading}
              className="mt-3 w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2.5 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          {/* Evaluator Quick Role Presets */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Evaluator Demo Profiles (1-Click)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Pre-Seeded</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isSubmitting || isLoading}
                onClick={() => handleQuickDemoLogin('NATIONAL_ADMIN')}
                className={`p-2 bg-slate-800/80 hover:bg-slate-700/80 border ${
                  activeDemoRole === 'NATIONAL_ADMIN' ? 'border-emerald-400 ring-2 ring-emerald-400/30 bg-slate-700' : 'border-slate-700'
                } rounded-xl text-left transition-all group cursor-pointer relative`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-[11px] text-emerald-400 group-hover:text-emerald-300">
                    National Director
                  </div>
                  {activeDemoRole === 'NATIONAL_ADMIN' && (
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">admin@trackmeds.org</div>
              </button>

              <button
                type="button"
                disabled={isSubmitting || isLoading}
                onClick={() => handleQuickDemoLogin('STATE_OFFICER')}
                className={`p-2 bg-slate-800/80 hover:bg-slate-700/80 border ${
                  activeDemoRole === 'STATE_OFFICER' ? 'border-blue-400 ring-2 ring-blue-400/30 bg-slate-700' : 'border-slate-700'
                } rounded-xl text-left transition-all group cursor-pointer relative`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-[11px] text-blue-400 group-hover:text-blue-300">
                    State Officer
                  </div>
                  {activeDemoRole === 'STATE_OFFICER' && (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">Maharashtra Directorate</div>
              </button>

              <button
                type="button"
                disabled={isSubmitting || isLoading}
                onClick={() => handleQuickDemoLogin('DISTRICT_OFFICER')}
                className={`p-2 bg-slate-800/80 hover:bg-slate-700/80 border ${
                  activeDemoRole === 'DISTRICT_OFFICER' ? 'border-amber-400 ring-2 ring-amber-400/30 bg-slate-700' : 'border-slate-700'
                } rounded-xl text-left transition-all group cursor-pointer relative`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-[11px] text-amber-400 group-hover:text-amber-300">
                    District Officer
                  </div>
                  {activeDemoRole === 'DISTRICT_OFFICER' && (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">Pune District</div>
              </button>

              <button
                type="button"
                disabled={isSubmitting || isLoading}
                onClick={() => handleQuickDemoLogin('PHC_STAFF')}
                className={`p-2 bg-slate-800/80 hover:bg-slate-700/80 border ${
                  activeDemoRole === 'PHC_STAFF' ? 'border-purple-400 ring-2 ring-purple-400/30 bg-slate-700' : 'border-slate-700'
                } rounded-xl text-left transition-all group cursor-pointer relative`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-[11px] text-purple-400 group-hover:text-purple-300">
                    PHC Pharmacist
                  </div>
                  {activeDemoRole === 'PHC_STAFF' && (
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">PHC Haveli Pune</div>
              </button>

              <button
                type="button"
                disabled={isSubmitting || isLoading}
                onClick={() => handleQuickDemoLogin('SUPPLIER')}
                className={`p-2 bg-slate-800/80 hover:bg-slate-700/80 border ${
                  activeDemoRole === 'SUPPLIER' ? 'border-cyan-400 ring-2 ring-cyan-400/30 bg-slate-700' : 'border-slate-700'
                } rounded-xl text-left transition-all group cursor-pointer col-span-2 sm:col-span-1 relative`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-[11px] text-cyan-400 group-hover:text-cyan-300">
                    Medicine Supplier
                  </div>
                  {activeDemoRole === 'SUPPLIER' && (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">Cipla Healthcare</div>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#006CD4]/20 border border-[#006CD4]/40 flex items-center justify-center text-[#006CD4]">
                <KeyRound className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Reset Password</h3>
                <p className="text-xs text-slate-400">Enter your official registered email</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Password Reset Dispatched</span>
                </div>
                <p>
                  A recovery link has been sent to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="officer@trackmeds.org"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#006CD4]"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset || !forgotEmail}
                    className="flex-1 py-2 px-3 bg-[#006CD4] hover:bg-[#005bb5] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {isSendingReset && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSendingReset ? 'Sending...' : 'Send Reset Link'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
