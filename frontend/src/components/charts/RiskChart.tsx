import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface RiskChartProps {
  data: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const RiskChart: React.FC<RiskChartProps> = ({ data = { critical: 0, high: 0, medium: 0, low: 0 } }) => {
  const d = data || { critical: 0, high: 0, medium: 0, low: 0 };
  const chartData = [
    { category: 'Critical (< 7d)', count: d.critical || 0, color: '#EF4444' },
    { category: 'High (7-14d)', count: d.high || 0, color: '#F59E0B' },
    { category: 'Medium (14-25d)', count: d.medium || 0, color: '#3B82F6' },
    { category: 'Healthy (> 25d)', count: d.low || 0, color: '#10B981' },
  ];

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="category"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#171F33',
              borderColor: '#334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px'
            }}
            formatter={(value: any) => [`${value} Facilities`, 'Count']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
