import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { BarChart3, ShieldCheck, Globe, CheckCircle2, Award, Zap, Lock } from 'lucide-react';

interface InsightsPageProps {
  country: string;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ country }) => {
  const bricsBenchmarks = [
    { country: 'India', flag: '🇮🇳', facilities: '1,240 PHCs & CHCs', coverage: '94.2%', resilience: '84/100', status: 'Active Node' },
    { country: 'China', flag: '🇨🇳', facilities: '2,150 Community Health Hubs', coverage: '96.5%', resilience: '88/100', status: 'Active Node' },
    { country: 'South Africa', flag: '🇿🇦', facilities: '320 Primary Health Clinics', coverage: '89.5%', resilience: '78/100', status: 'Active Node' },
    { country: 'Brazil', flag: '🇧🇷', facilities: '480 UBS Units (SUS)', coverage: '91.8%', resilience: '81/100', status: 'Active Node' },
    { country: 'Russia', flag: '🇷🇺', facilities: '610 Regional Polyclinics', coverage: '92.4%', resilience: '82/100', status: 'Active Node' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight uppercase">Health Supply Resilience & BRICS Scalability Benchmark</h1>
        <p className="text-xs text-slate-400">National supply chain health indices, wastage prevention metrics, and cross-border governance audit</p>
      </div>

      {/* Score Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* National Score Card */}
        <div className="glass-card p-6 border-brand-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/40 glass-glow-brand space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-400 font-bold uppercase tracking-wider">Health Supply Resilience Score</span>
            <Award className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-4xl font-extrabold text-white">84</h2>
            <span className="text-base font-bold text-slate-400">/ 100</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium">Optimal Resilience Range (Grade A)</p>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full w-[84%]"></div>
          </div>
        </div>

        {/* Expiry Waste Prevention */}
        <div className="glass-card p-6 border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 glass-glow-emerald space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Expiry Wastage Prevention</span>
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">{formatCurrency(48000, country)}</h2>
          <p className="text-xs text-emerald-300">₹48,000 inventory saved from expiration via early redistribution</p>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[91%]"></div>
          </div>
        </div>

        {/* Non-PHI Security Rating */}
        <div className="glass-card p-6 border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Data Privacy & Security</span>
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">100% Non-PHI</h2>
          <p className="text-xs text-slate-400">Zero Patient Health Information collected or processed</p>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Compliant with National Data Frameworks</span>
          </div>
        </div>
      </div>

      {/* BRICS Scalability Matrix */}
      <div className="glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-brand-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">BRICS Member Nation Deployment Scalability Matrix</h3>
          </div>
          <span className="text-xs text-slate-400">Unified Architecture Core</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase">
              <tr>
                <th className="p-3.5">Member Country</th>
                <th className="p-3.5">Health Network Footprint</th>
                <th className="p-3.5">Logistics Coverage</th>
                <th className="p-3.5">Resilience Score</th>
                <th className="p-3.5">Federated Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bricsBenchmarks.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-white flex items-center space-x-2">
                    <span className="text-base">{b.flag}</span>
                    <span>{b.country}</span>
                  </td>
                  <td className="p-3.5 text-slate-300">{b.facilities}</td>
                  <td className="p-3.5 font-bold text-brand-400">{b.coverage}</td>
                  <td className="p-3.5 font-bold text-emerald-400">{b.resilience}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
