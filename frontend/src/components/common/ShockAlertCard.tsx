import React from 'react';
import { Flame, ShieldAlert, ArrowRight } from 'lucide-react';

interface ShockAlertCardProps {
  shockDetails: {
    title: string;
    region: string;
    country: string;
    severity: string;
    affected_facilities_count: number;
    projected_duration: string;
    observed_cause: string;
    recommended_action: string;
  };
  onNavigateToRedistribution: () => void;
}

export const ShockAlertCard: React.FC<ShockAlertCardProps> = ({
  shockDetails,
  onNavigateToRedistribution
}) => {
  return (
    <div className="glass-card p-5 border-rose-500/40 bg-gradient-to-r from-rose-950/70 via-slate-900/90 to-amber-950/50 glass-glow-rose relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] tracking-wider uppercase flex items-center space-x-1 animate-pulse">
              <Flame className="w-3 h-3" />
              <span>HEALTH SUPPLY SHOCK DETECTED</span>
            </span>
            <span className="text-xs text-rose-300 font-medium">Region: {shockDetails.region}, {shockDetails.country}</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{shockDetails.title}</h2>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            <strong className="text-white">Cause:</strong> {shockDetails.observed_cause} • <strong className="text-white">Impact:</strong> {shockDetails.affected_facilities_count} facilities at imminent stockout risk over next {shockDetails.projected_duration}.
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-rose-800/40 text-xs text-amber-200">
            <strong className="text-amber-400">AI Recommended Action:</strong> {shockDetails.recommended_action}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={onNavigateToRedistribution}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2 transition-all active:scale-95"
          >
            <span>Execute Recommended Redistribution</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
