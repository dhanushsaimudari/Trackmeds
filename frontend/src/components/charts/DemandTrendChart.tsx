import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

interface DemandTrendChartProps {
  historicalData: Array<{ date: string; demand: number }>;
  forecastData: Array<{ date: string; demand: number }>;
}

export const DemandTrendChart: React.FC<DemandTrendChartProps> = ({
  historicalData,
  forecastData
}) => {
  // Combine historical and forecast data with distinct keys
  const combined = [
    ...historicalData.map(d => ({ date: d.date.slice(5), Historical: d.demand, Forecast: null })),
    ...forecastData.map(d => ({ date: d.date.slice(5), Historical: null, Forecast: d.demand }))
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={combined} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorFore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#171F33',
              borderColor: '#334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px'
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <ReferenceLine stroke="#94A3B8" strokeDasharray="3 3" label={{ value: 'Today', fill: '#CBD5E1', fontSize: 10 }} />
          <Area
            type="monotone"
            dataKey="Historical"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorHist)"
            connectNulls={true}
          />
          <Area
            type="monotone"
            dataKey="Forecast"
            stroke="#EF4444"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorFore)"
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
