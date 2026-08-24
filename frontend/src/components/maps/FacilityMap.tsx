import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Facility } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Building2, Users, Activity, ArrowUpRight } from 'lucide-react';

interface FacilityMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (fac: Facility) => void;
  country: string;
}

// Custom SVG Colored Map Pin Markers
const createCustomIcon = (status: string, isSelected: boolean) => {
  let color = '#10B981'; // Green (Healthy)
  if (status === 'Warning') color = '#F59E0B'; // Amber (Warning)
  if (status === 'Critical') color = '#EF4444'; // Red (Critical)

  const size = isSelected ? 34 : 26;

  const svgHtml = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#0B1326" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Map Recenter Helper Component
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

export const FacilityMap: React.FC<FacilityMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  country
}) => {
  // Map center coordinates per country
  let center: [number, number] = [20.5937, 78.9629]; // Default India
  let zoom = 5;

  if (country === 'India') {
    center = [20.5937, 78.9629];
    zoom = 5;
  } else if (country === 'China') {
    center = [35.8617, 104.1954];
    zoom = 4;
  } else if (country === 'South Africa') {
    center = [-29.0000, 25.0000];
    zoom = 5;
  } else if (country === 'Brazil') {
    center = [-14.2350, -51.9253];
    zoom = 4;
  } else if (country === 'Russia') {
    center = [55.7558, 37.6173]; // Centered around European Russia / Moscow
    zoom = 5;
  } else if (country === 'All') {
    center = [20.0, 30.0];
    zoom = 2;
  }

  if (selectedFacility) {
    center = [selectedFacility.latitude, selectedFacility.longitude];
    zoom = 10;
  }

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapController center={center} zoom={zoom} />
        {/* Dark CartoDB Matter TileLayer for High-Tech Command Center Look */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {facilities.map((fac) => (
          <Marker
            key={fac.id}
            position={[fac.latitude, fac.longitude]}
            icon={createCustomIcon(fac.status, selectedFacility?.id === fac.id)}
            eventHandlers={{
              click: () => onSelectFacility(fac),
            }}
          >
            <Popup>
              <div className="p-1 space-y-2 text-slate-100 min-w-[220px]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5">
                  <span className="font-bold text-sm text-white truncate">{fac.name}</span>
                  <StatusBadge status={fac.status} size="sm" />
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-medium text-slate-200">{fac.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">District:</span>
                    <span className="font-medium text-slate-200">{fac.district}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Stock Health:</span>
                    <span className="font-bold text-brand-400">{fac.stock_health_score}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bed Occupancy:</span>
                    <span className={`font-bold ${fac.occupancy_rate > 90 ? 'text-rose-400' : (fac.occupancy_rate >= 75 ? 'text-amber-400' : 'text-emerald-400')}`}>
                      {fac.occupancy_rate ? `${fac.occupancy_rate}% (${fac.occupied_beds}/${fac.total_beds})` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Staff Attendance:</span>
                    <span className={`font-bold ${fac.staffing_percentage < 70 ? 'text-rose-400' : (fac.staffing_percentage <= 85 ? 'text-amber-400' : 'text-emerald-400')}`}>
                      {fac.staffing_percentage ? `${fac.staffing_percentage}%` : 'Healthy'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Critical Risks:</span>
                    <span className="font-bold text-rose-400">{fac.critical_medicines_count} Medicines</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectFacility(fac)}
                  className="w-full mt-2 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-[11px] font-semibold flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>View Facility Details</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 shadow-xl z-[1000] text-xs space-y-1.5">
        <span className="font-bold text-slate-300 block mb-1 text-[11px] uppercase tracking-wider">Facility Health Status</span>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
          <span className="text-slate-300">Healthy (Stock &gt; 25 days)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50"></span>
          <span className="text-slate-300">Warning (Stock 7 - 25 days)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50 animate-pulse"></span>
          <span className="text-slate-300">Critical Risk (&lt; 7 days)</span>
        </div>
      </div>
    </div>
  );
};
