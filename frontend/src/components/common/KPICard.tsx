import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorVariant?: 'brand' | 'emerald' | 'amber' | 'rose' | 'info';
  trend?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorVariant = 'brand',
  trend
}) => {
  const colorStyles = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/30 glass-glow-brand',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 glass-glow-emerald',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30 glass-glow-rose',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  };

  return (
    <div className={`glass-card p-4 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 border ${colorStyles[colorVariant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg bg-slate-900/60 border border-slate-700/50`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
        {trend && <span className="text-xs font-medium text-emerald-400">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-[11px] text-slate-400 leading-tight">{subtitle}</p>}
    </div>
  );
};
