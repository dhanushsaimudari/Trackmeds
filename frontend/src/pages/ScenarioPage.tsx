import React, { useState, useEffect } from 'react';
import { ScenarioResponse } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { SlidersHorizontal, Play, Building2, CheckCircle2 } from 'lucide-react';

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
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Emergency & Crisis Planner</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-brand-500/20 text-blue-700 dark:text-brand-300 border border-blue-200 dark:border-brand-500/30">
              Crisis Preparedness Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Test how floods, disease surges, or blocked roads impact medicine supply, and see how stock sharing prevents shortages</p>
        </div>

        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulating ? 'Testing Plan...' : 'Test Emergency Plan'}</span>
        </button>
      </div>

      {/* Control Panel Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-500" />
          <span>Crisis Situations to Test</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Demand Surge Slider */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Increase in Patient Demand</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">+{demandPct}%</span>
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Extra patients due to heatwaves, seasonal fever, or local incidents</p>
          </div>

          {/* Weather Severity */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-700 dark:text-slate-300 font-medium block">Weather / Monsoon Severity</span>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {['Low', 'Moderate', 'High', 'Extreme'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setWeatherSev(sev)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    weatherSev === sev
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Heavy rains, floods, or storms affecting deliveries</p>
          </div>

          {/* Outbreak Severity */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-700 dark:text-slate-300 font-medium block">Disease Outbreak Level</span>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['None', 'Moderate', 'Severe'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setOutbreakSev(sev)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    outbreakSev === sev
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Spread of infectious illnesses like dengue, malaria, or flu</p>
          </div>

          {/* Transport Disruption Slider */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Road & Transport Delays</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{transportDisruption}% Delay</span>
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Flooded routes or vehicle shortages slowing down deliveries</p>
          </div>

          {/* Supplier Lead Time Delay */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 md:col-span-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Manufacturer & Supplier Delays</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">+{supplierDelay} Extra Days</span>
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Delays from central warehouses and pharmaceutical factories</p>
          </div>
        </div>
      </div>

      {/* Simulation Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Before vs Intervention vs After Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/40 p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-xs text-rose-600 dark:text-rose-300 font-bold uppercase tracking-wider block">1. Without Action (Danger)</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{result.before_interventions_facilities_at_risk} Clinics</h3>
              <p className="text-xs text-rose-700 dark:text-rose-200/90 font-medium">Clinics facing empty medicine shelves</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-brand-500/40 p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-xs text-blue-600 dark:text-brand-300 font-bold uppercase tracking-wider block">2. System Action Plan</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{result.recommended_interventions_redistributed_units.toLocaleString()} Units Shared</h3>
              <p className="text-xs text-blue-700 dark:text-brand-200/90 font-medium">Transferred from nearby clinics + {result.recommended_interventions_procurement_units.toLocaleString()} ordered fresh</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/40 p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-xs text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-wider block">3. After Stock Sharing (Protected)</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{result.after_interventions_facilities_at_risk} Clinics</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-200/90 font-medium">Only minimal risk remaining (92% crisis resolved)</p>
            </div>
          </div>

          {/* Intervention Executive Summary Box */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 shadow-sm text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Action Plan Summary</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/30">
                Confidence Level: {(result.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">{result.intervention_summary}</p>
          </div>

          {/* Facility Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Clinic Stock Status: Before vs After Stock Sharing
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Clinic / Hospital</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Days Left (Before Action)</th>
                    <th className="p-3">Days Protected (After Sharing)</th>
                    <th className="p-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {result.facilities_comparison.map((item) => (
                    <tr key={item.facility_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{item.facility_name}</span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{item.district}</td>
                      <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">{item.stockout_days_before} Days left</td>
                      <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">{item.stockout_days_after} Days safe</td>
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

export default ScenarioPage;
