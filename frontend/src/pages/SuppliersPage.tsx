import React, { useState, useEffect } from 'react';
import { SupplierItem } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { Truck, Clock, ShieldCheck, RefreshCw, FileText, Sparkles, AlertCircle, Bot, Building2 } from 'lucide-react';

interface SuppliersPageProps {
  country: string;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ country }) => {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [gapData, setGapData] = useState<any>(null);
  const [summaryText, setSummaryText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadSupplierData();
  }, [country]);

  const loadSupplierData = async () => {
    setIsLoading(true);
    try {
      const [supRes, gapRes] = await Promise.all([
        api.getSuppliers(),
        api.getProcurementGap(country)
      ]);
      setSuppliers(supRes);
      setGapData(gapRes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateProcurementSummary(country);
      setSummaryText(res.ai_generated_summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight uppercase">Supplier Oversight & Emergency Procurement</h1>
          <p className="text-xs text-slate-400">Supplier reliability metrics, lead times, and regional deficit procurement briefings</p>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Synthesizing Briefing...' : 'Generate AI Procurement Briefing'}</span>
        </button>
      </div>

      {/* 30-Day Deficit Gap Ribbon */}
      {gapData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 border-slate-700 space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Projected 30-Day Demand</span>
            <h3 className="text-2xl font-extrabold text-white">{gapData.projected_30_day_demand_units.toLocaleString()} Units</h3>
            <p className="text-[10px] text-slate-400">Across {gapData.facilities_impacted} facilities in {country}</p>
          </div>

          <div className="glass-card p-4 border-emerald-500/30 bg-emerald-950/20 glass-glow-emerald space-y-1">
            <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block">Internal Stock & Redistribution</span>
            <h3 className="text-2xl font-extrabold text-white">{gapData.current_regional_stock_units.toLocaleString()} Units</h3>
            <p className="text-[10px] text-emerald-300">58% Demand fulfilled internally</p>
          </div>

          <div className="glass-card p-4 border-rose-500/30 bg-rose-950/20 glass-glow-rose space-y-1">
            <span className="text-[11px] text-rose-400 font-semibold uppercase tracking-wider block">Net Procurement Deficit</span>
            <h3 className="text-2xl font-extrabold text-white">{gapData.projected_deficit_units.toLocaleString()} Units</h3>
            <p className="text-[10px] text-rose-300">Remaining procurement requirement</p>
          </div>

          <div className="glass-card p-4 border-brand-500/30 bg-brand-950/20 glass-glow-brand space-y-1">
            <span className="text-[11px] text-brand-400 font-semibold uppercase tracking-wider block">Est. Order Cost</span>
            <h3 className="text-2xl font-extrabold text-white">{formatCurrency(gapData.estimated_procurement_cost_currency, country)}</h3>
            <p className="text-[10px] text-brand-300">Target Supplier: {gapData.primary_recommended_supplier}</p>
          </div>
        </div>
      )}

      {/* AI Generated Procurement Briefing (If Generated) */}
      {summaryText && (
        <div className="glass-card p-5 border-brand-500/40 bg-gradient-to-r from-slate-900 via-brand-950/30 to-slate-900 text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Bot className="w-5 h-5 text-brand-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Gemini Executive Procurement Briefing</h3>
          </div>
          <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-xs pt-1">{summaryText}</div>
        </div>
      )}

      {/* Supplier Directory List */}
      <div className="glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 font-bold text-xs text-white uppercase tracking-wider">
          Verified Pharmaceutical Supplier Network ({suppliers.length} Active Partners)
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
            <span>Loading supplier reliability metrics...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Supplier Name</th>
                  <th className="p-3.5">Operating Region</th>
                  <th className="p-3.5">Avg Lead Time</th>
                  <th className="p-3.5">Reliability Score</th>
                  <th className="p-3.5">Contact Status</th>
                  <th className="p-3.5 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-brand-400" />
                      <span>{sup.name}</span>
                    </td>
                    <td className="p-3.5 text-slate-300">{sup.region}</td>
                    <td className="p-3.5 font-semibold text-slate-200">{sup.average_lead_time_days} Days</td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-emerald-400">{(sup.reliability_score * 100).toFixed(0)}%</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {sup.contact_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-[11px] border border-slate-700 transition-colors">
                        Issue Requisition
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
