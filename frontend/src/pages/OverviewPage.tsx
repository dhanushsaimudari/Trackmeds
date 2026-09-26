import React, { useState, useEffect } from 'react';
import { DashboardSummary, Facility, RedistributionItem } from '../types';
import { api } from '../services/api';
import { getSeedSummary } from '../services/mockData';
import { FacilityMap } from '../components/maps/FacilityMap';
import { SmartStockIngestion } from '../components/SmartStockIngestion';
import { formatCurrency } from '../utils/formatters';
import {
  ShieldCheck,
  Cpu,
  Share2,
  Leaf,
  Building2,
  Users,
  Bed,
  Sparkles,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Truck,
  AlertTriangle,
  Bot,
  Camera,
  Layers,
  ArrowUpRight,
  Radio
} from 'lucide-react';

interface OverviewPageProps {
  country: string;
  region: string;
  state?: string;
  district?: string;
  onNavigateTab: (tab: string) => void;
  onOpenCopilot: () => void;
  onOpenSOSModal?: () => void;
  refreshTrigger: number;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  country,
  region,
  state,
  district,
  onNavigateTab,
  onOpenCopilot,
  onOpenSOSModal,
  refreshTrigger
}) => {
  const activeState = state || (region !== 'All' && region ? region : 'Maharashtra');
  const activeDistrict = district || 'All';
  const isIndia = country === 'India';

  const [summary, setSummary] = useState<DashboardSummary>(() => getSeedSummary(country, activeState, activeDistrict));
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [redistributions, setRedistributions] = useState<RedistributionItem[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [dispatchedIds, setDispatchedIds] = useState<Set<string>>(new Set());
  const [showSmartIngestion, setShowSmartIngestion] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setSummary(getSeedSummary(country, activeState, activeDistrict));
    loadOverviewData();
  }, [country, region, state, district, refreshTrigger]);

  const loadOverviewData = async () => {
    setIsRefreshing(true);
    try {
      const [sumRes, facRes, redRes] = await Promise.all([
        api.getDashboardSummary(country, activeState, activeDistrict),
        api.getFacilities(country, activeState, activeDistrict),
        api.getRedistributions(country)
      ]);
      if (sumRes) setSummary(sumRes);
      if (facRes && facRes.length > 0) {
        setFacilities(facRes);
        setSelectedFacility(facRes[0]);
      }
      if (redRes) setRedistributions(redRes);
    } catch (e) {
      console.error('Error loading overview data:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApproveDispatch = async (id: string, medicineName: string) => {
    setApprovingId(id);
    // Instant optimistic update
    setDispatchedIds(prev => new Set(prev).add(id));
    setRedistributions(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Approved' } : r))
    );
    setToastMessage(`Transfer Approved: Delivery scheduled for ${medicineName}.`);
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await api.approveRedistribution(id);
    } catch (err) {
      console.error('Approval sync error:', err);
    } finally {
      setApprovingId(null);
    }
  };

  // Metrics customized for India Maharashtra Corridor or Federated Nodes
  const wasteSavedValue = 482000;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/20 dark:bg-emerald-950/60 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32] dark:text-emerald-400 shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="font-bold text-slate-500 hover:text-slate-800">✕</button>
        </div>
      )}

      {/* Top Status Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-[#001F5B] flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs text-[#001F5B] dark:text-white uppercase tracking-wider">
                Medicine Supply & Availability Network
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                System Live & Online
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isIndia
                ? `${activeState} (${activeDistrict !== 'All' ? activeDistrict + ' District' : 'All Districts'}) • Live Stock Monitoring`
                : `${country} • Primary Health Centers`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenSOSModal && (
            <button
              onClick={onOpenSOSModal}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer animate-pulse"
              title="Request emergency medicine immediately"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Urgent Stock SOS</span>
            </button>
          )}

          <button
            onClick={() => setShowSmartIngestion(prev => !prev)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#006CD4] to-[#00897B] hover:from-[#005bb5] hover:to-[#007569] text-white font-bold text-xs shadow-md shadow-cyan-950/20 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{showSmartIngestion ? 'Close Scanner' : 'Scan Invoices & Stock'}</span>
          </button>

          <button
            onClick={loadOverviewData}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#006CD4]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Multimodal Ingestion Modal / Drawer (if toggled) */}
      {showSmartIngestion && (
        <div className="animate-slide-up">
          <SmartStockIngestion
            onClose={() => setShowSmartIngestion(false)}
            onCommitSuccess={() => {
              setShowSmartIngestion(false);
              loadOverviewData();
            }}
          />
        </div>
      )}

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: PATIENT DEMAND */}
        <div className="bg-white dark:bg-slate-900 border-l-4 border-l-[#001F5B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#001F5B] dark:text-blue-300">
              1. Patient Visits & Capacity
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#001F5B]/10 dark:bg-blue-950 flex items-center justify-center text-[#001F5B] dark:text-blue-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300">Daily Patient Footfall</h3>
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#001F5B] dark:text-white tracking-tight">
                {(summary.total_daily_footfall || 2150).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-500">
                +{summary.average_footfall_surge_pct || 14.2}% Surge
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              72% Beds Occupied • <strong className="text-[#2E7D32]">91% Staff on Duty</strong>
            </p>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#001F5B] dark:bg-blue-500 h-full rounded-full" style={{ width: '72%' }} />
          </div>
        </div>

        {/* CARD 2: SHORTAGE ALERTS */}
        <div className="bg-white dark:bg-slate-900 border-l-4 border-l-[#006CD4] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006CD4]">
              2. Shortage Early Warnings
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#006CD4]/10 dark:bg-cyan-950 flex items-center justify-center text-[#006CD4]">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300">Clinics Running Low</h3>
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#006CD4] tracking-tight">18 Clinics</span>
              <span className="text-xs font-medium text-slate-500">&lt; 14 Days Stock</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              High need: <span className="font-semibold text-rose-600">ORS & Amoxicillin</span>
            </p>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-[10px] font-bold text-[#006CD4]">
            <Sparkles className="w-3 h-3" />
            <span>94.2% AI Prediction Accuracy</span>
          </div>
        </div>

        {/* CARD 3: STOCK SHARING */}
        <div className="bg-white dark:bg-slate-900 border-l-4 border-l-[#00897B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00897B]">
              3. Medicine Sharing & Transfers
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#00897B]/10 dark:bg-teal-950 flex items-center justify-center text-[#00897B]">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300">Active Medicine Dispatches</h3>
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#00897B] tracking-tight">14 Active</span>
              <span className="text-xs font-medium text-slate-500">Deliveries</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Moving surplus medicines to clinics facing shortages
            </p>
          </div>
          <div className="mt-3 flex items-center space-x-1 text-[10px] font-bold text-[#00897B]">
            <Truck className="w-3 h-3 mr-1" />
            <span>62% of shortages resolved by sharing stock</span>
          </div>
        </div>

        {/* CARD 4: EXPIRY SAVED */}
        <div className="bg-white dark:bg-slate-900 border-l-4 border-l-[#2E7D32] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D32]">
              4. Expiring Medicines Saved
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#2E7D32]/10 dark:bg-emerald-950 flex items-center justify-center text-[#2E7D32]">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300">Money Saved from Expiry</h3>
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#2E7D32] tracking-tight">
                {formatCurrency(wasteSavedValue, country)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Near-expiry medicines transferred to high-need clinics in time
            </p>
          </div>
          <div className="mt-3 flex items-center space-x-1 text-[10px] font-bold text-[#2E7D32]">
            <ShieldCheck className="w-3 h-3 mr-1" />
            <span>28 medicine batches rescued this quarter</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: MAP                                                            */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-black text-[#001F5B] dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <span>Hospital & Clinic Map {activeState} {activeDistrict !== 'All' ? `• ${activeDistrict}` : ''}</span>
            </h2>
            <span className="text-[11px] text-slate-500">
              ({facilities.length} Monitored Facilities • Live Status)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">Map:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Google Maps Live Markers
            </span>
          </div>
        </div>

        {/* 60vh Interactive Map Container */}
        <FacilityMap
          facilities={facilities}
          selectedFacility={selectedFacility}
          onSelectFacility={(f) => setSelectedFacility(f)}
          country={country}
          state={activeState}
          district={activeDistrict}
          redistributions={redistributions}
        />
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: ACTION MATRIX & 1-CLICK DISPATCH TABLE                         */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-black text-[#001F5B] dark:text-white uppercase tracking-wider">
                Recommended Medicine Transfers
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00897B]/15 text-[#00897B] border border-[#00897B]/30">
                1-Click Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send near-expiry medicines to clinics in need before they expire unused
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('redistribution')}
            className="text-xs font-bold text-[#006CD4] hover:underline flex items-center space-x-1"
          >
            <span>View All Medicine Transfers</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Urgency</th>
                <th className="p-3">Sending Hospital (Has Extra Stock)</th>
                <th className="p-3">Receiving Clinic (Low on Stock)</th>
                <th className="p-3">Medicine & Quantity</th>
                <th className="p-3">Batch & Expiry</th>
                <th className="p-3">Money Saved</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {redistributions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No active medicine transfer recommendations for the selected region.
                  </td>
                </tr>
              ) : (
                redistributions.slice(0, 5).map((rec, idx) => {
                  const isApproved = rec.status === 'Approved' || dispatchedIds.has(rec.id);
                  const isPriorityCritical = idx === 0 || rec.quantity >= 500;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Priority */}
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isPriorityCritical
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        }`}>
                          {isPriorityCritical ? 'Urgent' : 'Standard'}
                        </span>
                      </td>

                      {/* Donor */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.source_facility_name}</div>
                        <div className="text-[11px] text-slate-400">ID: {rec.source_facility_id}</div>
                      </td>

                      {/* Receiver */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.destination_facility_name}</div>
                        <div className="text-[11px] text-slate-400">Distance: {rec.distance_km} km away</div>
                      </td>

                      {/* Medicine */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.medicine_name}</div>
                        <div className="text-[11px] text-[#006CD4] font-bold">
                          {rec.quantity.toLocaleString()} Units to Transfer
                        </div>
                      </td>

                      {/* Batch & Expiry */}
                      <td className="p-3">
                        <div className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">Batch #B-2026</div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Expires in ~40 Days</div>
                      </td>

                      {/* Waste Saved */}
                      <td className="p-3">
                        <span className="font-bold text-[#2E7D32]">
                          {formatCurrency(rec.estimated_waste_avoided_value, country)}
                        </span>
                      </td>

                      {/* 1-Click Dispatch Action */}
                      <td className="p-3 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#2E7D32] bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                            <span>Transfer Approved</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApproveDispatch(rec.id, rec.medicine_name)}
                            disabled={approvingId === rec.id}
                            className="px-3.5 py-1.5 rounded-xl bg-[#00897B] hover:bg-[#007065] text-white font-bold text-[11px] shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5 mx-auto"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{approvingId === rec.id ? 'Approving...' : 'Approve Transfer'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
