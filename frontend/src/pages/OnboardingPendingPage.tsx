import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrackMedsLogo } from '../components/common/TrackMedsLogo';
import { Clock, ShieldAlert, CheckCircle2, LogOut, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const OnboardingPendingPage: React.FC = () => {
  const { currentUser, logout, approveSelf } = useAuth();
  const [isApproving, setIsApproving] = useState(false);

  const handleInstantDemoApprove = async () => {
    if (!currentUser) return;
    setIsApproving(true);
    try {
      await approveSelf();
    } catch (e) {
      console.error('Instant approval error:', e);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#001F5B] to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex justify-center mb-4">
          <TrackMedsLogo variant="full" />
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/80 sm:px-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Privileged Account Awaiting Approval</h2>
            <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
              Your registration request for <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.email}) has been recorded and is currently in <span className="text-amber-400 font-bold">Pending Review</span>.
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Requested Role:</span>
              <span className="font-bold text-amber-400">{currentUser?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Jurisdiction / State:</span>
              <span className="font-bold text-white">{currentUser?.state || 'Maharashtra'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">District:</span>
              <span className="font-bold text-white">{currentUser?.district || 'Pune'}</span>
            </div>
            {currentUser?.facility_id && (
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Facility:</span>
                <span className="font-bold text-white">{currentUser.facility_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Authorization Status:</span>
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                Pending Director Verification
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleInstantDemoApprove}
              disabled={isApproving}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isApproving ? 'Approving...' : 'Approve Instantly (Hackathon Demo)'}</span>
            </button>

            <button
              onClick={logout}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
