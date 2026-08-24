import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, Filter, RefreshCw, AlertTriangle, Pill, Building2, Calendar, ArrowRight } from 'lucide-react';

interface InventoryPageProps {
  country: string;
  region: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ country, region }) => {
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, [country, region, categoryFilter, riskFilter]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInventory({
        country: country !== 'All' ? country : undefined,
        district: region !== 'All' ? region : undefined,
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
          <h1 className="text-lg font-bold text-white tracking-tight uppercase">Medicine Stock & Inventory Control</h1>
          <p className="text-xs text-slate-400">Searchable facility inventory logs with batch expiry and stockout risk tracking</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadInventory}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine, facility, batch number..."
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-brand-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Categories</option>
            <option value="Rehydration" className="bg-slate-900">Rehydration</option>
            <option value="Antibiotics" className="bg-slate-900">Antibiotics</option>
            <option value="Insulin" className="bg-slate-900">Insulin</option>
            <option value="Vaccines" className="bg-slate-900">Vaccines</option>
            <option value="Analgesics" className="bg-slate-900">Analgesics</option>
            <option value="Maternal" className="bg-slate-900">Maternal</option>
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Risk Levels</option>
            <option value="Critical" className="bg-slate-900">Critical (&lt; 7 days)</option>
            <option value="High" className="bg-slate-900">High (7-14 days)</option>
            <option value="Medium" className="bg-slate-900">Medium (14-25 days)</option>
            <option value="Low" className="bg-slate-900">Healthy (&gt; 25 days)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel overflow-hidden border border-slate-800 shadow-2xl">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
            <span>Loading facility inventory logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">No inventory records found.</p>
            <p>Try adjusting your search query or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Medicine</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Batch</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Daily Usage</th>
                  <th className="p-3.5">Predicted Stockout</th>
                  <th className="p-3.5">Expiry Risk</th>
                  <th className="p-3.5">Risk Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedItem(inv)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-bold text-white flex items-center space-x-2">
                      <Pill className="w-4 h-4 text-brand-400" />
                      <span>{inv.medicine_name}</span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{inv.facility_name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{inv.batch_number}</td>
                    <td className="p-3.5 font-bold text-white">
                      {inv.quantity.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{inv.unit}</span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">{inv.daily_consumption} / day</td>
                    <td className="p-3.5 text-slate-300">
                      <span className={`font-semibold ${inv.days_to_stockout <= 5 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {inv.days_to_stockout} days
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <span className={`font-semibold ${inv.days_to_expiry <= 30 ? 'text-amber-400' : 'text-slate-400'}`}>
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
                        className="text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Medicine Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg p-6 space-y-4 border border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Pill className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">{selectedItem.medicine_name}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Facility</span>
                <span className="font-bold text-white text-sm">{selectedItem.facility_name}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Batch Number</span>
                <span className="font-mono font-bold text-brand-400 text-sm">{selectedItem.batch_number}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Current Stock</span>
                <span className="font-bold text-emerald-400 text-sm">{selectedItem.quantity.toLocaleString()} {selectedItem.unit}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Safety Stock Level</span>
                <span className="font-bold text-slate-300 text-sm">{selectedItem.safety_stock_level.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-brand-950/30 border border-brand-500/30 text-xs text-brand-200 space-y-1">
              <span className="font-bold text-brand-400 block">AI Demand Forecast Rationale:</span>
              <p className="leading-relaxed text-[11px]">
                Daily demand is projected at {selectedItem.daily_consumption} units/day based on historical consumption, season, and climate signals. Projected stockout date: {selectedItem.predicted_stockout_date || 'N/A'}.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
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
