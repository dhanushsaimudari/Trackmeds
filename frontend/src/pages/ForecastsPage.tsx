import React, { useState, useEffect } from 'react';
import { ForecastItem } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrendingUp, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Building2, Pill } from 'lucide-react';

interface ForecastsPageProps {
  country: string;
}

export const ForecastsPage: React.FC<ForecastsPageProps> = ({ country }) => {
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [riskFilter, setRiskFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadForecasts();
  }, [country, riskFilter]);

  const loadForecasts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getForecasts(country, riskFilter);
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
          <h1 className="text-lg font-bold text-white tracking-tight uppercase">Predictive Stockout Forecasting Engine</h1>
          <p className="text-xs text-slate-400">Moving average + seasonality + weather-adjusted demand projection model</p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={isRefreshing}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Running Pipeline...' : 'Run Forecast Engine'}</span>
        </button>
      </div>

      {/* Methodology Info Banner */}
      <div className="glass-card p-4 bg-gradient-to-r from-brand-950/40 via-slate-900 to-slate-900 border-brand-500/30 text-xs text-slate-300 space-y-1">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h3 className="font-bold text-white uppercase text-[11px] tracking-wider">Forecasting Methodology</h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          <code className="bg-slate-950 px-1.5 py-0.5 rounded text-brand-300 font-mono text-[10px]">
            Days Until Stockout = Current Stock / (30-day Moving Avg Consumption × Seasonality × Climate Multiplier)
          </code>
          • Risk levels are updated dynamically as environmental signals change.
        </p>
      </div>

      {/* Forecast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
            <span>Calculating stockout risks & probabilities...</span>
          </div>
        ) : forecasts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No forecast risks found matching criteria.
          </div>
        ) : (
          forecasts.map((fc) => (
            <div
              key={fc.id}
              className={`glass-card p-4 space-y-3 border transition-all ${
                fc.risk_level === 'Critical'
                  ? 'border-rose-500/50 bg-rose-950/20 glass-glow-rose'
                  : fc.risk_level === 'High'
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1.5 text-white font-bold text-sm">
                    <Pill className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="truncate">{fc.medicine_name}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400 text-xs mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{fc.facility_name}</span>
                  </div>
                </div>
                <StatusBadge status={fc.risk_level} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Daily Projected Usage</span>
                  <span className="font-bold text-white">{fc.predicted_daily_demand} / day</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Probability</span>
                  <span className="font-bold text-rose-400">{(fc.stockout_probability * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Expected Stockout:</span>
                <span className={`font-black ${fc.risk_level === 'Critical' ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
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
