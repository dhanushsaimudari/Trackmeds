import React, { useState, useEffect } from 'react';
import { SupplierItem, ReplenishmentItem } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { Truck, Sparkles, Bot, CheckCircle2, RefreshCw } from 'lucide-react';

interface SuppliersPageProps {
  country: string;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ country }) => {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [replenishments, setReplenishments] = useState<ReplenishmentItem[]>([]);
  const [gapData, setGapData] = useState<any>(null);
  const [summaryText, setSummaryText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    loadSupplierData();
  }, [country]);

  const loadSupplierData = async () => {
    setIsLoading(true);
    try {
      const [supRes, gapRes, replRes] = await Promise.all([
        api.getSuppliers(),
        api.getProcurementGap(country),
        api.getReplenishments(country)
      ]);
      setSuppliers(supRes);
      setGapData(gapRes);
      setReplenishments(replRes);
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

  const handleApproveReplenishment = async (id: string) => {
    setApprovingId(id);
    try {
      await api.approveReplenishment(id);
      await loadSupplierData();
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Suppliers & New Medicine Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Approved medicine suppliers, delivery timelines, and official purchase orders
          </p>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Preparing Summary...' : 'Generate Order Summary'}</span>
        </button>
      </div>

      {/* Internal vs External Logistics Distinction Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/30 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wider">
              How Medicine Supply Works
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 font-bold">
              ✓ Step 1: Transfer Extra Stock from Nearby Clinics (Fast & Free)
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40 font-bold">
              ⚡ Step 2: Order Fresh Stock from Suppliers (When nearby stock is unavailable)
            </span>
          </div>
        </div>
      </div>

      {/* 30-Day Deficit Gap Ribbon */}
      {gapData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Estimated 30-Day Need</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{(gapData.projected_30_day_demand_units || 0).toLocaleString()} Units</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Across {gapData.facilities_impacted || 0} clinics in {country}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block">Available Local Stock</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{(gapData.current_regional_stock_units || 0).toLocaleString()} Units</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-300 font-medium">58% Demand fulfilled locally</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider block">Shortage to Purchase</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{(gapData.projected_deficit_units || 0).toLocaleString()} Units</h3>
            <p className="text-[10px] text-rose-600 dark:text-rose-300 font-medium">Needs purchase from manufacturers</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-brand-500/30 p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] text-blue-700 dark:text-brand-400 font-bold uppercase tracking-wider block">Estimated Order Cost</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(gapData.estimated_procurement_cost_currency || 0, country)}</h3>
            <p className="text-[10px] text-blue-600 dark:text-brand-300 font-medium">Suggested Supplier: {gapData.primary_recommended_supplier || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* AI Generated Procurement Briefing (If Generated) */}
      {summaryText && (
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-brand-500/40 rounded-2xl p-5 shadow-sm text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Bot className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Smart Order Summary & Recommendations</h3>
          </div>
          <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-xs pt-1">{summaryText}</div>
        </div>
      )}

      {/* Supplier Replenishment Requisitions */}
      {replenishments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-amber-50/50 dark:bg-slate-950/80 border-b border-amber-200 dark:border-amber-500/30 font-bold text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>Medicine Orders Waiting for Approval ({replenishments.length})</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Health Officer Approval Required</span>
          </div>
          <div className="p-4 space-y-3">
            {replenishments.map((rpl) => (
              <div key={rpl.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{rpl.facility_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                      {rpl.urgency} Urgency
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{rpl.id}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{rpl.reason}</p>
                  <div className="flex items-center space-x-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>Medicine: <strong className="text-slate-900 dark:text-white">{rpl.medicine_name}</strong></span>
                    <span>Quantity Needed: <strong className="text-emerald-600 dark:text-emerald-400">{rpl.quantity_required.toLocaleString()} units</strong></span>
                    <span>Suggested Supplier: <strong className="text-blue-600 dark:text-brand-300">{rpl.recommended_supplier_name}</strong></span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  {rpl.status === 'Approved' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-xs font-bold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Order Approved & Sent</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveReplenishment(rpl.id)}
                      disabled={approvingId === rpl.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {approvingId === rpl.id ? 'Approving Order...' : 'Approve Medicine Order'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Directory List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
          Approved Medicine Suppliers ({suppliers.length} Active Partners)
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
            <span>Loading supplier list...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Supplier Name</th>
                  <th className="p-3.5">Delivery Region</th>
                  <th className="p-3.5">Average Delivery Time</th>
                  <th className="p-3.5">On-Time Delivery Rate</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-brand-500" />
                      <span>{sup.name}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{sup.region}</td>
                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-200">{sup.average_lead_time_days} Days</td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{(sup.reliability_score * 100).toFixed(0)}%</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        {sup.contact_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">
                        Place Order
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

export default SuppliersPage;
