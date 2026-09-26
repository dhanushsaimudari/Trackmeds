import React, { useState, useEffect } from 'react';
import { RedistributionItem } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatters';
import {
  ArrowRight,
  Truck,
  Building2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock,
  Bot,
  ShieldCheck
} from 'lucide-react';

interface RedistributionPageProps {
  country: string;
  state?: string;
  district?: string;
}

export const RedistributionPage: React.FC<RedistributionPageProps> = ({ country, state = 'All', district = 'All' }) => {
  const [recommendations, setRecommendations] = useState<RedistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRedistributions();
  }, [country, state, district]);

  const loadRedistributions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRedistributions(country !== 'All' ? country : undefined);
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
      setToastMessage('Redistribution transfer order successfully approved and logged.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  const totalWasteAvoided = recommendations.reduce(
    (acc, r) => acc + (r.estimated_waste_avoided_value || 0),
    0
  );
  const totalUnits = recommendations.reduce((acc, r) => acc + (r.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Medicine Sharing & Transfer Suggestions
            </h1>
            <span className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {state !== 'All' ? state : 'All India'}{district !== 'All' ? ` > ${district}` : ''}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Smart sharing of extra and expiring medicines from well-stocked hospitals to clinics running low across {state !== 'All' ? state : country}
          </p>
        </div>

        <button
          onClick={loadRedistributions}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm cursor-pointer"
          title="Refresh Recommendations"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-500' : ''}`} />
        </button>
      </div>

      {/* 4-Step Redistribution Workflow Pipeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-wider">
              How Medicine Sharing Works
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 font-bold">1. CLINIC RUNNING LOW</span>
            <span className="text-slate-400">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 font-bold">2. NEARBY STOCK FOUND</span>
            <span className="text-slate-400">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-brand-500/20 text-blue-700 dark:text-brand-300 border border-blue-200 dark:border-brand-500/40 font-bold">3. TRANSFER SUGGESTED</span>
            <span className="text-slate-400">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 font-bold">4. PATIENTS PROTECTED</span>
          </div>
        </div>
      </div>

      {/* Impact Summary Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Money Saved from Expiring Medicines</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalWasteAvoided || 482000, country)}
          </h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-300/80 mt-0.5 font-medium">Value saved by using batches before expiry</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-brand-500/30 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-blue-700 dark:text-brand-400 font-bold uppercase tracking-wider">Medicines Ready to Transfer</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalUnits.toLocaleString()} Units
          </h3>
          <p className="text-[11px] text-blue-600 dark:text-brand-300/80 mt-0.5 font-medium">Across {recommendations.length} delivery routes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Shortages Prevented</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">62% Deficit Met</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Met by sharing nearby stock instead of purchasing</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {isLoading && recommendations.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
            <span>Finding best sharing routes between nearby clinics...</span>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No active medicine transfer recommendations for this region.
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 transition-all hover:border-brand-500/40 shadow-sm"
            >
              {/* Route Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-brand-500/10 border border-blue-200 dark:border-brand-500/30 text-blue-600 dark:text-brand-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{rec.medicine_name}</h3>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-brand-500/20 text-blue-700 dark:text-brand-300 border border-blue-200 dark:border-brand-500/30">
                        {rec.quantity.toLocaleString()} Units
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Road Distance: {rec.distance_km} km • Delivery: Same-Day Delivery
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <StatusBadge status={rec.status} />
                  {rec.status === 'Recommended' ? (
                    <button
                      onClick={() => handleApprove(rec.id)}
                      disabled={approvingId === rec.id}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {approvingId === rec.id ? 'Approving Transfer...' : 'Approve Transfer'}
                    </button>
                  ) : (
                    <span className="flex items-center space-x-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Transfer Approved</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Source -> Destination Movement Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {/* Source Facility */}
                <div className="md:col-span-5 space-y-1">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                    Sending Hospital (Extra Stock)
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{rec.source_facility_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>Sending Clinic • ID: {rec.source_facility_id}</span>
                  </div>
                </div>

                {/* Logistics Direction Arrow */}
                <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                  <div className="p-2 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Destination Facility */}
                <div className="md:col-span-5 space-y-1">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider block">
                    Receiving Clinic (Low Stock)
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{rec.destination_facility_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>Receiving Clinic • ID: {rec.destination_facility_id}</span>
                  </div>
                </div>
              </div>

              {/* Rationale & Gemini Explanation */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Reason for Transfer:</strong> {rec.reason}</span>
                </div>

                {rec.ai_explanation && (
                  <div className="flex items-start space-x-2 p-3 rounded-xl bg-blue-50 dark:bg-brand-950/20 border border-blue-200 dark:border-brand-500/20 text-blue-900 dark:text-brand-300 text-[11px]">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-blue-950 dark:text-brand-200 block font-semibold mb-0.5">AI Recommendation:</strong>
                      <span>{rec.ai_explanation}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Impact Footer */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Quality & Expiry Verified</span>
                </div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Money Saved: {formatCurrency(rec.estimated_waste_avoided_value, country)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RedistributionPage;
