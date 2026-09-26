import React, { useState, useEffect } from 'react';
import { ForecastItem } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { RefreshCw, Sparkles, Building2, Pill } from 'lucide-react';

interface ForecastsPageProps {
  country: string;
  state?: string;
  district?: string;
}

export const ForecastsPage: React.FC<ForecastsPageProps> = ({ country, state = 'All', district = 'All' }) => {
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [riskFilter, setRiskFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadForecasts();
  }, [country, state, district, riskFilter]);

  const loadForecasts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getForecasts(country, riskFilter, state, district);
      setForecasts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    setIsRefreshing(true);
    try {
      await api.runForecastingPipeline();
      await loadForecasts();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Medicine Shortage Early Warnings
            </h1>
            <span className="bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {state !== 'All' ? state : 'All India'}{district !== 'All' ? ` > ${district}` : ''}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Smart forecast showing clinics at risk of running out of medicines in the next 7 days
          </p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={isRefreshing}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Updating Predictions...' : 'Update Predictions'}</span>
        </button>
      </div>

      {/* Methodology Info Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-brand-500/30 rounded-2xl p-4 shadow-sm text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wider">
            How Shortage Predictions Work
          </h3>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          The system analyzes recent patient visits, seasonal illness trends (like monsoon flu), and daily medicine usage to alert health officers before shelves run empty.
        </p>
      </div>

      {/* Forecast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
            <span>Analyzing stock levels and predicting shortages...</span>
          </div>
        ) : forecasts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No medicine shortages predicted for the selected region.
          </div>
        ) : (
          forecasts.map((fc) => (
            <div
              key={fc.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 space-y-3 border transition-all shadow-sm ${
                fc.risk_level === 'Critical'
                  ? 'border-rose-300 dark:border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20'
                  : fc.risk_level === 'High'
                  ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-bold text-sm">
                    <Pill className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="truncate">{fc.medicine_name}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{fc.facility_name}</span>
                  </div>
                </div>
                <StatusBadge status={fc.risk_level} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Estimated Daily Need</span>
                  <span className="font-bold text-slate-900 dark:text-white">{fc.predicted_daily_demand} / day</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Shortage Risk</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{(fc.stockout_probability * 100).toFixed(0)}%</span>
                </div>
              </div>

              {fc.risk_reason && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-brand-600 dark:text-brand-400 block text-[10px] uppercase">Why this alert was raised:</span>
                  <span className="opacity-90">{fc.risk_reason}</span>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Stock Runs Out:</span>
                <span className={`font-black ${fc.risk_level === 'Critical' ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-amber-600 dark:text-amber-300'}`}>
                  In {fc.days_until_stockout} Days ({fc.predicted_stockout_date || 'N/A'})
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ForecastsPage;
