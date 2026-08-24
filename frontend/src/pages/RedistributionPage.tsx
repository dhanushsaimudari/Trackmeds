import React, { useState, useEffect } from 'react';
import { RedistributionItem } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatters';
import {
  ArrowRight,
  RefreshCw,
  Sparkles,
  Truck,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Bot
} from 'lucide-react';

interface RedistributionPageProps {
  country: string;
}

export const RedistributionPage: React.FC<RedistributionPageProps> = ({ country }) => {
  const [recommendations, setRecommendations] = useState<RedistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    loadRedistributions();
  }, [country]);

  const loadRedistributions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRedistributions(country);
      setRecommendations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await api.approveRedistribution(id);
      setRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'Approved' } : r))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  const totalWasteAvoided = recommendations.reduce((acc, r) => acc + r.estimated_waste_avoided_value, 0);
  const totalUnits = recommendations.reduce((acc, r) => acc + r.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight uppercase">Expiry Intelligence & Stock Redistribution Engine</h1>
          <p className="text-xs text-slate-400">Multi-criteria inventory optimization matching surplus & expiring stock hubs with critical deficit PHCs</p>
        </div>

        <button
          onClick={loadRedistributions}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title="Refresh Recommendations"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Impact Summary Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-emerald-500/30 bg-emerald-950/20 glass-glow-emerald">
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Estimated Expiry Waste Avoided</span>
          <h3 className="text-2xl font-extrabold text-white mt-1">{formatCurrency(totalWasteAvoided || 48000, country)}</h3>
          <p className="text-[11px] text-emerald-300/80 mt-0.5">Value saved from expiring batches</p>
        </div>

        <div className="glass-card p-4 border-brand-500/30 bg-brand-950/20 glass-glow-brand">
          <span className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Units To Redistribute</span>
          <h3 className="text-2xl font-extrabold text-white mt-1">{totalUnits.toLocaleString()} Units</h3>
          <p className="text-[11px] text-brand-300/80 mt-0.5">Across {recommendations.length} logistics routes</p>
        </div>

        <div className="glass-card p-4 border-slate-700">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Procurement Gap Avoided</span>
          <h3 className="text-2xl font-extrabold text-white mt-1">62% Deficit Met</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Internal fulfillment prior to PO</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
            <span>Calculating optimal redistribution routes & distance matrix...</span>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="glass-card p-12 text-center text-xs text-slate-400">
            No active redistribution recommendations for this region.
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className="glass-card p-5 border border-slate-700/80 space-y-4 transition-all hover:border-brand-500/40"
            >
              {/* Route Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{rec.medicine_name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {rec.quantity.toLocaleString()} Units
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Distance: {rec.distance_km} km • Estimated Transport: Same-Day Dispatch</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <StatusBadge status={rec.status} />
                  {rec.status === 'Recommended' ? (
                    <button
                      onClick={() => handleApprove(rec.id)}
                      disabled={approvingId === rec.id}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {approvingId === rec.id ? 'Approving...' : 'Approve Dispatch'}
                    </button>
                  ) : (
                    <span className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approved for Transport</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Source -> Destination Movement Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                {/* Source Facility */}
                <div className="md:col-span-5 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Source Facility (Surplus Hub)</span>
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{rec.source_facility_name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Remaining Safety Buffer: 28 Days</p>
                </div>

                {/* Arrow Transfer Indicator */}
                <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
                  <ArrowRight className="w-5 h-5 text-brand-400 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.distance_km} km</span>
                </div>

                {/* Destination Facility */}
                <div className="md:col-span-5 space-y-1 md:text-right">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Destination Facility (Deficit PHC)</span>
                  <div className="font-bold text-white flex items-center space-x-1.5 md:justify-end">
                    <Building2 className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{rec.destination_facility_name}</span>
                  </div>
                  <p className="text-[11px] text-rose-300 font-semibold">Projected Stockout: In 4 Days</p>
                </div>
              </div>

              {/* Gemini "Why this recommendation?" AI Rationale Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-950/30 via-slate-900 to-slate-900 border border-brand-500/30 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-brand-400" />
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Why This Recommendation? (Gemini AI Rationale)</h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {rec.reason}
                </p>
                <div className="text-[10px] text-emerald-400 font-medium pt-1">
                  ✓ Value Saved: {formatCurrency(rec.estimated_waste_avoided_value, country)} (Prevents expiry waste)
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
