import React, { useState, useEffect } from 'react';
import { ScenarioRequest, ScenarioResponse } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatters';
import { SlidersHorizontal, Play, ShieldAlert, ArrowRight, TrendingUp, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

interface ScenarioPageProps {
  country: string;
}

export const ScenarioPage: React.FC<ScenarioPageProps> = ({ country }) => {
  const [demandPct, setDemandPct] = useState(30);
  const [weatherSev, setWeatherSev] = useState('High');
  const [outbreakSev, setOutbreakSev] = useState('Moderate');
  const [transportDisruption, setTransportDisruption] = useState(20);
  const [supplierDelay, setSupplierDelay] = useState(5);

  const [result, setResult] = useState<ScenarioResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    runSimulation();
  }, [country]);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateScenario({
        demand_increase_pct: demandPct,
        weather_severity: weatherSev,
        outbreak_severity: outbreakSev,
        transport_disruption: transportDisruption,
        supplier_delay_days: supplierDelay,
        country
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-white tracking-tight uppercase">Emergency Scenario Simulator</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Interactive What-If Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">Simulate regional climate shocks, outbreak surges, transport disruptions, and measure intervention impact</p>
        </div>

        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-brand-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulating ? 'Simulating...' : 'Run Emergency Simulation'}</span>
        </button>
      </div>

      {/* Control Panel Grid */}
      <div className="glass-card p-5 space-y-4 border-slate-700/80">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-400" />
          <span>Stress Test Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Demand Surge Slider */}
          <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Demand Surge Increase</span>
              <span className="font-bold text-brand-400">+{demandPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={demandPct}
              onChange={(e) => setDemandPct(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Simulates footfall surge from heatwaves or seasonal illness</p>
          </div>

          {/* Weather Severity */}
          <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-300 font-medium block">Climate & Weather Severity</span>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {['Low', 'Moderate', 'High', 'Extreme'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setWeatherSev(sev)}
                  className={`py-1.5 rounded text-[11px] font-semibold border transition-all ${
                    weatherSev === sev
                      ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">Monsoon rainfall or humidity anomaly index</p>
          </div>

          {/* Outbreak Severity */}
          <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-300 font-medium block">Outbreak / Epidemic Surge</span>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['None', 'Moderate', 'Severe'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setOutbreakSev(sev)}
                  className={`py-1.5 rounded text-[11px] font-semibold border transition-all ${
                    outbreakSev === sev
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">Localized disease transmission factor</p>
          </div>

          {/* Transport Disruption Slider */}
          <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Logistics Disruption</span>
              <span className="font-bold text-amber-400">{transportDisruption}% Delay</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={transportDisruption}
              onChange={(e) => setTransportDisruption(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Flooded roads or vehicle availability bottlenecks</p>
          </div>

          {/* Supplier Lead Time Delay */}
          <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 md:col-span-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">External Supplier Lead Time Extension</span>
              <span className="font-bold text-rose-400">+{supplierDelay} Extra Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={supplierDelay}
              onChange={(e) => setSupplierDelay(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Supply chain manufacturing or customs port delay</p>
          </div>
        </div>
      </div>

      {/* Simulation Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Before vs Intervention vs After Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5 border-rose-500/40 bg-rose-950/20 glass-glow-rose space-y-1">
              <span className="text-xs text-rose-300 font-bold uppercase tracking-wider block">Before Intervention</span>
              <h3 className="text-3xl font-extrabold text-white">{result.before_interventions_facilities_at_risk} Facilities</h3>
              <p className="text-xs text-rose-200/90">Imminent stockout risk without response</p>
            </div>

            <div className="glass-card p-5 border-brand-500/40 bg-brand-950/20 glass-glow-brand space-y-1">
              <span className="text-xs text-brand-300 font-bold uppercase tracking-wider block">Recommended Intervention</span>
              <h3 className="text-3xl font-extrabold text-white">{result.recommended_interventions_redistributed_units.toLocaleString()} Units</h3>
              <p className="text-xs text-brand-200/90">Redistributed + {result.recommended_interventions_procurement_units.toLocaleString()} procured</p>
            </div>

            <div className="glass-card p-5 border-emerald-500/40 bg-emerald-950/20 glass-glow-emerald space-y-1">
              <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">After Intervention</span>
              <h3 className="text-3xl font-extrabold text-white">{result.after_interventions_facilities_at_risk} Facilities</h3>
              <p className="text-xs text-emerald-200/90">Remaining risk (92% mitigation rate)</p>
            </div>
          </div>

          {/* Intervention Executive Summary Box */}
          <div className="glass-card p-5 border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Simulated Outcome Briefing</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Confidence: {(result.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">{result.intervention_summary}</p>
          </div>

          {/* Facility Breakdown Table */}
          <div className="glass-panel overflow-hidden border border-slate-800 shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 font-bold text-xs text-white uppercase tracking-wider">
              Facility Stockout Window Comparison (Before vs After)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Facility</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Before Intervention</th>
                    <th className="p-3">After Intervention</th>
                    <th className="p-3">Status Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.facilities_comparison.map((item) => (
                    <tr key={item.facility_id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{item.facility_name}</span>
                      </td>
                      <td className="p-3 text-slate-300">{item.district}</td>
                      <td className="p-3 font-semibold text-rose-400">{item.stockout_days_before} Days Stockout</td>
                      <td className="p-3 font-semibold text-emerald-400">{item.stockout_days_after} Days Stockout</td>
                      <td className="p-3">
                        <StatusBadge status={item.status_after} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
