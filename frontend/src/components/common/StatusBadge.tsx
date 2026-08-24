import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface StatusBadgeProps {
  status: 'Healthy' | 'Warning' | 'Critical' | 'Low' | 'Medium' | 'High' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  let style = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = Info;

  if (['healthy', 'low', 'approved', 'completed'].includes(normalized)) {
    style = 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
    Icon = CheckCircle;
  } else if (['warning', 'medium', 'in transit', 'recommended'].includes(normalized)) {
    style = 'bg-amber-950/60 text-amber-300 border-amber-700/50';
    Icon = AlertTriangle;
  } else if (['critical', 'high', 'extreme'].includes(normalized)) {
    style = 'bg-rose-950/70 text-rose-200 border-rose-700/60 animate-pulse';
    Icon = AlertCircle;
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center space-x-1 rounded-full border font-semibold ${px} ${style}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
