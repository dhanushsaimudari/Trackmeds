import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, Filter, RefreshCw, AlertTriangle, Pill, Building2, Calendar, ArrowRight } from 'lucide-react';

interface InventoryPageProps {
  country: string;
  region: string;
  state?: string;
  district?: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ country, region, state, district }) => {
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeState = state || (region !== 'All' && region ? region : undefined);
  const activeDistrict = district && district !== 'All' ? district : undefined;

  useEffect(() => {
    loadInventory();
  }, [country, region, state, district, categoryFilter, riskFilter]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInventory({
        country: country !== 'All' ? country : undefined,
        state: activeState,
        district: activeDistrict,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        risk_level: riskFilter !== 'All' ? riskFilter : undefined,
        search: searchQuery || undefined
      });
      setInventories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = inventories.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.medicine_name.toLowerCase().includes(q) ||
      item.facility_name.toLowerCase().includes(q) ||
      item.batch_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Medicine Stock & Inventory Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeState ? `${activeState} ${activeDistrict ? `• ${activeDistrict}` : ''} | ` : ''}
            Facility inventory logs with real-time stockout risk & batch expiry tracking
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadInventory}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine, facility, batch number..."
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-brand-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
          >
            <option value="All" className="bg-white dark:bg-slate-900">All Categories</option>
            <option value="Rehydration" className="bg-white dark:bg-slate-900">Rehydration</option>
            <option value="Antibiotics" className="bg-white dark:bg-slate-900">Antibiotics</option>
            <option value="Insulin" className="bg-white dark:bg-slate-900">Insulin</option>
            <option value="Vaccines" className="bg-white dark:bg-slate-900">Vaccines</option>
            <option value="Analgesics" className="bg-white dark:bg-slate-900">Analgesics</option>
            <option value="Maternal" className="bg-white dark:bg-slate-900">Maternal</option>
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
          >
            <option value="All" className="bg-white dark:bg-slate-900">All Risk Levels</option>
            <option value="Critical" className="bg-white dark:bg-slate-900">Critical (&lt; 7 days)</option>
            <option value="High" className="bg-white dark:bg-slate-900">High (7-14 days)</option>
            <option value="Medium" className="bg-white dark:bg-slate-900">Medium (14-25 days)</option>
            <option value="Low" className="bg-white dark:bg-slate-900">Healthy (&gt; 25 days)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
            <span>Loading facility inventory logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">No inventory records found.</p>
            <p>Try adjusting your search query or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Medicine & Category</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Batch</th>
                  <th className="p-3.5">Stock Level & Ratio</th>
                  <th className="p-3.5">Daily Usage</th>
                  <th className="p-3.5">Predicted Stockout</th>
                  <th className="p-3.5">Expiry Risk</th>
                  <th className="p-3.5">Risk Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filtered.map((inv) => {
                  const safetyLevel = Math.max(1, inv.safety_stock_level || 1);
                  const stockPct = Math.min(100, Math.round((inv.quantity / (safetyLevel * 2)) * 100));
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedItem(inv)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <Pill className="w-4 h-4 text-brand-500 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{inv.medicine_name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {inv.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{inv.facility_name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{inv.batch_number}</td>
                      <td className="p-3.5">
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-bold text-slate-900 dark:text-white">{inv.quantity.toLocaleString()} {inv.unit}</span>
                            <span className="text-[10px] text-slate-500">Target: {inv.safety_stock_level.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                stockPct < 30 ? 'bg-rose-500' : stockPct < 65 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{inv.daily_consumption} / day</td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <span className={`font-bold ${inv.days_to_stockout <= 7 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : (inv.days_to_stockout <= 14 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200')}`}>
                          {inv.days_to_stockout} Days
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <span className={`font-semibold ${inv.days_to_expiry <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {inv.days_to_expiry} days left
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={inv.risk_level} size="sm" />
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(inv);
                          }}
                          className="text-brand-600 dark:text-brand-400 hover:text-brand-500 font-bold"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Medicine Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 space-y-4 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Pill className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedItem.medicine_name}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] block">Facility</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedItem.facility_name}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] block">Batch Number</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">{selectedItem.batch_number}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] block">Current Stock</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{selectedItem.quantity.toLocaleString()} {selectedItem.unit}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] block">Safety Stock Level</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{selectedItem.safety_stock_level.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-500/30 text-xs text-brand-900 dark:text-brand-200 space-y-1">
              <span className="font-bold text-brand-700 dark:text-brand-400 block">AI Demand Forecast Rationale:</span>
              <p className="leading-relaxed text-[11px]">
                Daily demand is projected at {selectedItem.daily_consumption} units/day based on historical consumption, season, and climate signals. Projected stockout date: {selectedItem.predicted_stockout_date || 'N/A'}.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
