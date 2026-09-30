import React, { useState } from 'react';
import { Facility } from '../types';
import { api } from '../services/api';
import {
  Bed,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Edit3,
  X,
  Save,
  RefreshCw,
  TrendingUp,
  HeartPulse
} from 'lucide-react';

interface FacilityResourceTelemetryProps {
  facility: Facility;
  onFacilityUpdated: (updated: Facility) => void;
  onClose?: () => void;
}

export const FacilityResourceTelemetry: React.FC<FacilityResourceTelemetryProps> = ({
  facility,
  onFacilityUpdated,
  onClose
}) => {
  const [showBedModal, setShowBedModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states for Beds
  const [occupiedBeds, setOccupiedBeds] = useState(facility.occupied_beds || 0);
  const [totalBeds, setTotalBeds] = useState(facility.total_beds || 40);
  const [emergencyBeds, setEmergencyBeds] = useState(facility.emergency_beds || 6);
  const [icuBeds, setIcuBeds] = useState(facility.icu_beds || 4);

  // Form states for Staff
  const [docsAvail, setDocsAvail] = useState(facility.doctors_available || 0);
  const [docsReq, setDocsReq] = useState(facility.doctors_required || 4);
  const [nursesAvail, setNursesAvail] = useState(facility.nurses_available || 0);
  const [nursesReq, setNursesReq] = useState(facility.nurses_required || 12);
  const [supportAvail, setSupportAvail] = useState(facility.support_available || 0);
  const [supportReq, setSupportReq] = useState(facility.support_required || 8);

  const handleSaveBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateFacilityBeds(facility.id, {
        occupied_beds: Number(occupiedBeds),
        total_beds: Number(totalBeds),
        emergency_beds: Number(emergencyBeds),
        icu_beds: Number(icuBeds)
      });
      onFacilityUpdated(updated);
      setShowBedModal(false);
      setFeedback('Bed availability telemetry updated successfully.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update bed telemetry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateFacilityStaff(facility.id, {
        doctors_available: Number(docsAvail),
        doctors_required: Number(docsReq),
        nurses_available: Number(nursesAvail),
        nurses_required: Number(nursesReq),
        support_available: Number(supportAvail),
        support_required: Number(supportReq)
      });
      onFacilityUpdated(updated);
      setShowStaffModal(false);
      setFeedback('Personnel attendance telemetry updated successfully.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update personnel telemetry');
    } finally {
      setIsSaving(false);
    }
  };

  const occupancyRate = facility.total_beds > 0
    ? Math.round((facility.occupied_beds / facility.total_beds) * 100)
    : 0;

  const availableBeds = Math.max(0, (facility.total_beds || 0) - (facility.occupied_beds || 0));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#001F5B] to-[#006CD4] flex items-center justify-center text-white shadow-md">
            <Building2 className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
                {facility.name}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {facility.type}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  facility.status === 'Critical'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                    : facility.status === 'Warning'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {facility.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {facility.district} District, {facility.state || facility.country} • Population Served: {(facility.population_served || 45000).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {feedback && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{feedback}</span>
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Telemetry Pillars */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Bed Availability */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Bed className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Bed Availability
                </span>
              </div>
              <button
                onClick={() => {
                  setOccupiedBeds(facility.occupied_beds || 0);
                  setTotalBeds(facility.total_beds || 40);
                  setEmergencyBeds(facility.emergency_beds || 6);
                  setIcuBeds(facility.icu_beds || 4);
                  setShowBedModal(true);
                }}
                className="px-2 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 flex items-center space-x-1 shadow-2xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>Update</span>
              </button>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {availableBeds}
                </span>
                <span className="text-xs text-slate-500 ml-1">Beds Free</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  occupancyRate >= 90
                    ? 'bg-rose-500/15 text-rose-600'
                    : occupancyRate >= 75
                    ? 'bg-amber-500/15 text-amber-600'
                    : 'bg-emerald-500/15 text-emerald-600'
                }`}
              >
                {occupancyRate}% Occupied
              </span>
            </div>

            {/* Occupancy bar */}
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyRate >= 90
                    ? 'bg-rose-500'
                    : occupancyRate >= 75
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, occupancyRate)}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Total</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {facility.total_beds || 40}
                </span>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">ICU</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {facility.icu_beds || 4}
                </span>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Emergency</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {facility.emergency_beds || 6}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Medical Personnel Attendance */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Staff Attendance
                </span>
              </div>
              <button
                onClick={() => {
                  setDocsAvail(facility.doctors_available || 0);
                  setDocsReq(facility.doctors_required || 4);
                  setNursesAvail(facility.nurses_available || 0);
                  setNursesReq(facility.nurses_required || 12);
                  setSupportAvail(facility.support_available || 0);
                  setSupportReq(facility.support_required || 8);
                  setShowStaffModal(true);
                }}
                className="px-2 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-600 flex items-center space-x-1 shadow-2xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>Update</span>
              </button>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {(facility.doctors_available || 0) + (facility.nurses_available || 0) + (facility.support_available || 0)}
                </span>
                <span className="text-xs text-slate-500 ml-1">On Duty</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  (facility.staffing_percentage || 90) < 70
                    ? 'bg-rose-500/15 text-rose-600'
                    : (facility.staffing_percentage || 90) < 85
                    ? 'bg-amber-500/15 text-amber-600'
                    : 'bg-emerald-500/15 text-emerald-600'
                }`}
              >
                {facility.staffing_percentage || 91}% Staffed
              </span>
            </div>

            {/* Attendance bar */}
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, facility.staffing_percentage || 91)}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Doctors</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {facility.doctors_available || 0} / {facility.doctors_required || 4}
                </span>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Nurses</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {facility.nurses_available || 0} / {facility.nurses_required || 12}
                </span>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Support</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {facility.support_available || 0} / {facility.support_required || 8}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Patient Footfall & Resilience */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Footfall & Resilience
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-600 border border-purple-500/30">
                Live Telemetry
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {facility.daily_footfall || 120}
                </span>
                <span className="text-xs text-slate-500 ml-1">Daily Visits</span>
              </div>
              <span className="text-xs font-bold text-amber-500 flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>+{facility.footfall_surge_pct || 14}% vs Baseline</span>
              </span>
            </div>

            <div className="mt-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Resilience Index:</span>
                <span className="font-extrabold text-blue-600 dark:text-cyan-400">
                  {facility.resilience_score || 84}/100
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Critical Medicines:</span>
                <span className={`font-bold ${(facility.critical_medicines_count || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {facility.critical_medicines_count || 0} Low Stock
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Edit Bed Availability */}
      {showBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Bed className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Update Bed Availability • {facility.name}
                </h4>
              </div>
              <button onClick={() => setShowBedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBeds} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Total Beds</label>
                  <input
                    type="number"
                    min="1"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Occupied Beds</label>
                  <input
                    type="number"
                    min="0"
                    max={totalBeds}
                    value={occupiedBeds}
                    onChange={(e) => setOccupiedBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">ICU Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={icuBeds}
                    onChange={(e) => setIcuBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Emergency Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={emergencyBeds}
                    onChange={(e) => setEmergencyBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBedModal(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1.5 shadow-md"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Bed Telemetry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Staff Attendance */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Update Personnel Attendance • {facility.name}
                </h4>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Doctors On Duty</label>
                    <input
                      type="number"
                      min="0"
                      value={docsAvail}
                      onChange={(e) => setDocsAvail(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Doctors Required</label>
                    <input
                      type="number"
                      min="1"
                      value={docsReq}
                      onChange={(e) => setDocsReq(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Nurses On Duty</label>
                    <input
                      type="number"
                      min="0"
                      value={nursesAvail}
                      onChange={(e) => setNursesAvail(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Nurses Required</label>
                    <input
                      type="number"
                      min="1"
                      value={nursesReq}
                      onChange={(e) => setNursesReq(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Support Staff On Duty</label>
                    <input
                      type="number"
                      min="0"
                      value={supportAvail}
                      onChange={(e) => setSupportAvail(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Support Required</label>
                    <input
                      type="number"
                      min="1"
                      value={supportReq}
                      onChange={(e) => setSupportReq(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1.5 shadow-md"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Staff Telemetry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
