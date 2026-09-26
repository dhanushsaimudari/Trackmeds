import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Thermometer,
  Truck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileCode2,
  RefreshCw,
  Building2,
  Activity,
  Zap,
  ExternalLink
} from 'lucide-react';

interface ABDMPageProps {
  country: string;
  state?: string;
  district?: string;
}

export const ABDMPage: React.FC<ABDMPageProps> = ({ country, state, district }) => {
  const [hfrFacilities, setHfrFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('IN-MH-PUN-001');
  const [hfrData, setHfrData] = useState<any | null>(null);
  const [coldChainData, setColdChainData] = useState<any | null>(null);
  const [fhirBundle, setFhirBundle] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingFhir, setIsGeneratingFhir] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const facs = await api.getAbdmFacilities();
      setHfrFacilities(facs);
      const currentFacId = selectedFacilityId || facs[0]?.facility_id || 'IN-MH-PUN-001';
      
      const [hfr, cc] = await Promise.all([
        api.verifyAbdmFacility(currentFacId),
        api.getColdChainTelemetry(currentFacId)
      ]);
      setHfrData(hfr);
      setColdChainData(cc);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFacilityId]);

  const handleGenerateFhir = async () => {
    setIsGeneratingFhir(true);
    try {
      const bundle = await api.generateFhirDispense({
        facility_id: selectedFacilityId,
        medicine_name: 'Insulin Regular 40IU',
        batch_number: 'B-2026-IN-401',
        quantity: 15,
        abha_id: '91-8201-9921-2094'
      });
      setFhirBundle(bundle);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingFhir(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Clinic Verification & Cold Storage
            </h1>
            <span className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>National Health Registry Connected</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verified government health facilities, live vaccine fridge temperature monitoring, and digital prescriptions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
          >
            {hfrFacilities.map((f) => (
              <option key={f.facility_id} value={f.facility_id}>
                {f.name} ({f.facility_type})
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pillar 1: Verified Facility Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Facility Verification
                </h2>
                <span className="text-[10px] text-slate-500">Official Government Health Registry</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              VERIFIED
            </span>
          </div>

          {hfrData && (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Facility ID:</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{hfrData.hfr_id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Provider Service ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{hfrData.hip_id}</span>
              </div>
              
              {/* Compliance Milestones */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Government Certification Levels
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">Level 1</span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400">Verified</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">Level 2</span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400">Tele-Health</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">Level 3</span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400">Digital RX</span>
                  </div>
                </div>
              </div>

              {/* QR Code preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3 mt-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    Patient Check-in QR Code
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Patients scan with their government health app (ABHA) for instant token.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pillar 2: Vaccine Fridge Temperature Control */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Vaccine Fridge Temperature
                </h2>
                <span className="text-[10px] text-slate-500">Live Temperature Sensor</span>
              </div>
            </div>
            {coldChainData && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                coldChainData.status === 'OPTIMAL'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 animate-pulse'
              }`}>
                {coldChainData.status === 'OPTIMAL' ? 'SAFE TEMPERATURE' : 'WARNING'}
              </span>
            )}
          </div>

          {coldChainData && (
            <div className="space-y-3">
              {/* Temperature display */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                    Current Temperature
                  </span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {coldChainData.current_temperature}°C
                    </span>
                    <span className="text-[11px] text-slate-500">
                      (Safe range: {coldChainData.safe_min}°C to {coldChainData.safe_max}°C)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                    Sensor Status
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Battery: {coldChainData.battery_percent}% • {coldChainData.door_status}
                  </span>
                </div>
              </div>

              {/* Monitored biologicals */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Protected Vaccines & Medicines
                </span>
                <div className="space-y-1">
                  {coldChainData.monitored_biologicals?.map((bio: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{bio.name}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-500">{bio.safe_range}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pillar 3: Digital Prescription Record */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Digital Prescription
                </h2>
                <span className="text-[10px] text-slate-500">Government Health Record & Delivery</span>
              </div>
            </div>
            <button
              onClick={handleGenerateFhir}
              disabled={isGeneratingFhir}
              className="px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
            >
              <Zap className="w-3 h-3" />
              <span>{isGeneratingFhir ? 'Creating...' : 'Create Digital Record'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Creates a standardized digital medicine prescription linked to the patient's Ayushman Bharat Health Account (ABHA) and prepares delivery.
          </p>

          {fhirBundle ? (
            <div className="space-y-2.5">
              {/* Minimalist Human-Friendly Summary Card */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Prescription Created & Verified</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                    Ready
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Patient ABHA ID:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">91-8201-9921-2094</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Prescribed Medicine:</span>
                    <strong className="text-slate-900 dark:text-white">Insulin Regular 40IU (15 Units)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Batch Number:</span>
                    <span className="font-mono text-slate-900 dark:text-white">B-2026-IN-401</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Delivery Protocol:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">ONDC Logistics Ready</span>
                  </div>
                </div>
              </div>

              {/* Optional Collapsible Technical JSON */}
              <div>
                <button
                  onClick={() => setShowRawJson(prev => !prev)}
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center space-x-1"
                >
                  <span>{showRawJson ? '▼ Hide' : '▶ Show'} Technical Code (JSON)</span>
                </button>
                {showRawJson && (
                  <pre className="mt-2 p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800">
                    {JSON.stringify(fhirBundle, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              Click <strong className="text-slate-700 dark:text-slate-300">Create Digital Record</strong> above to test patient prescription generation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ABDMPage;
