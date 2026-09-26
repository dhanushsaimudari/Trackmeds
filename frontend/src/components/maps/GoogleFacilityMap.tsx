import React, { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { Facility, RedistributionItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Building2, Users, Activity, ArrowUpRight, Bed, ShieldAlert, Truck, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ALL_INDIA_STATES } from '../../services/indiaGeoData';

interface GoogleFacilityMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (fac: Facility) => void;
  country: string;
  state?: string;
  district?: string;
  redistributions?: RedistributionItem[];
}


// Country centroid mapping - India focused on Maharashtra Pilot Corridor
const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  'India': { lat: 18.65, lng: 74.10, zoom: 8 }, // Maharashtra Corridor (Pune, Satara, Solapur, Nashik)
  'China': { lat: 23.1291, lng: 113.3242, zoom: 8 },
  'South Africa': { lat: -26.2041, lng: 28.0473, zoom: 9 },
  'Brazil': { lat: -23.5505, lng: -46.6333, zoom: 9 },
  'Russia': { lat: 55.7558, lng: 37.6173, zoom: 8 },
  'All': { lat: 20.0, lng: 30.0, zoom: 3 }
};

// Institutional Command Center Map Theme
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#070C18' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#001F5B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#E2E8F0' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#00BCD4' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0B1326' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#171F33' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#001F5B' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1E2842' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#001F5B' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38BDF8' }]
  }
];

// Helper component for Polylines between transfer source and destination
const RedistributionPolylines: React.FC<{
  redistributions: RedistributionItem[];
  facilities: Facility[];
}> = ({ redistributions, facilities }) => {
  const map = useMap();
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  React.useEffect(() => {
    if (!map) return;

    // Clean up previous polylines
    polylines.forEach(p => p.setMap(null));

    const newPolylines: google.maps.Polyline[] = [];

    redistributions.forEach((rd) => {
      const src = facilities.find(f => f.id === rd.source_facility_id);
      const dst = facilities.find(f => f.id === rd.destination_facility_id);
      if (!src || !dst) return;

      const path = [
        { lat: src.latitude, lng: src.longitude },
        { lat: dst.latitude, lng: dst.longitude }
      ];

      // BRICS Cooperation Teal (#00897B) for transit paths, Forest Green (#2E7D32) for approved
      const poly = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: rd.status === 'Approved' ? '#2E7D32' : '#00897B',
        strokeOpacity: 0.9,
        strokeWeight: 3.5,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            strokeColor: '#00BCD4',
            fillColor: '#00BCD4',
            fillOpacity: 1,
            scale: 2.5
          },
          offset: '50%'
        }]
      });

      poly.setMap(map);
      newPolylines.push(poly);
    });

    setPolylines(newPolylines);

    return () => {
      newPolylines.forEach(p => p.setMap(null));
    };
  }, [map, redistributions, facilities]);

  return null;
};

const MapCameraController: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, zoom]);
  return null;
};

export const GoogleFacilityMap: React.FC<GoogleFacilityMapProps> = ({
  facilities = [],
  selectedFacility,
  onSelectFacility,
  country,
  state,
  district,
  redistributions = []
}) => {
  const { theme } = useTheme();
  const [activeFacility, setActiveFacility] = useState<Facility | null>(selectedFacility);

  React.useEffect(() => {
    if (selectedFacility) {
      setActiveFacility(selectedFacility);
    }
  }, [selectedFacility]);

  // Demo key or user environment key
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // Determine center & zoom based on selected facility or State & District
  const stateObj = ALL_INDIA_STATES.find(
    s => s.name.toLowerCase() === (state || '').toLowerCase()
  );

  let targetCenter = { lat: 18.65, lng: 74.10 };
  let targetZoom = 8;

  if (selectedFacility) {
    targetCenter = { lat: selectedFacility.latitude, lng: selectedFacility.longitude };
    targetZoom = 12;
  } else if (stateObj) {
    if (district && district !== 'All') {
      const distObj = stateObj.districts.find(d => d.name.toLowerCase() === district.toLowerCase());
      if (distObj) {
        targetCenter = { lat: distObj.lat, lng: distObj.lng };
        targetZoom = 10;
      } else {
        targetCenter = { lat: stateObj.lat, lng: stateObj.lng };
        targetZoom = stateObj.zoom;
      }
    } else {
      targetCenter = { lat: stateObj.lat, lng: stateObj.lng };
      targetZoom = stateObj.zoom;
    }
  } else if (COUNTRY_CENTROIDS[country]) {
    targetCenter = { lat: COUNTRY_CENTROIDS[country].lat, lng: COUNTRY_CENTROIDS[country].lng };
    targetZoom = COUNTRY_CENTROIDS[country].zoom;
  }

  // Semantic Marker Coding according to official BRICS India 2026 4-Pillar Design System
  const getMarkerColor = (status: string) => {
    if (status === 'Critical') return '#DC2626';     // Red/Coral: Stockout Imminent (<5 days buffer)
    if (status === 'Warning') return '#00897B';      // Amber/Teal: High Expiring Inventory (Eligible Donor)
    return '#2E7D32';                                // Forest Green: Balanced PHC (Healthy)
  };

  // If no Google Maps API key is configured, provide interactive high-tech Vector Tactical GIS Canvas
  if (!apiKey || apiKey.trim() === '') {
    const lats = facilities.map(f => f.latitude);
    const lngs = facilities.map(f => f.longitude);
    const minLat = lats.length > 0 ? Math.min(...lats) - 0.25 : 17.5;
    const maxLat = lats.length > 0 ? Math.max(...lats) + 0.25 : 20.5;
    const minLng = lngs.length > 0 ? Math.min(...lngs) - 0.25 : 73.0;
    const maxLng = lngs.length > 0 ? Math.max(...lngs) + 0.25 : 76.0;

    const getX = (lng: number) => {
      const pct = ((lng - minLng) / (maxLng - minLng || 1)) * 80 + 10;
      return Math.max(10, Math.min(90, pct));
    };

    const getY = (lat: number) => {
      const pct = (1 - (lat - minLat) / (maxLat - minLat || 1)) * 75 + 12;
      return Math.max(10, Math.min(90, pct));
    };

    return (
      <div className="relative w-full h-[60vh] min-h-[500px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#070C18] to-[#0A1124] border border-slate-800 shadow-2xl select-none">
        {/* Tactical Grid Background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 188, 212, 0.4) 1px, transparent 0)',
            backgroundSize: '36px 36px'
          }}
        />

        {/* SVG Redistribution Corridor Links */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00897B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00BCD4" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          {redistributions.map((rd, i) => {
            const src = facilities.find(f => f.id === rd.source_facility_id);
            const dst = facilities.find(f => f.id === rd.destination_facility_id);
            if (!src || !dst) return null;
            return (
              <g key={`rd-line-${i}`}>
                <line
                  x1={`${getX(src.longitude)}%`}
                  y1={`${getY(src.latitude)}%`}
                  x2={`${getX(dst.longitude)}%`}
                  y2={`${getY(dst.latitude)}%`}
                  stroke="url(#corridorGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </g>
            );
          })}
        </svg>

        {/* Interactive Facility Pins */}
        {facilities.map((fac) => {
          const isSelected = activeFacility?.id === fac.id;
          const color = getMarkerColor(fac.status);
          const x = getX(fac.longitude);
          const y = getY(fac.latitude);

          return (
            <div
              key={fac.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => {
                setActiveFacility(fac);
                onSelectFacility(fac);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-transform duration-200 ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              {fac.status === 'Critical' && (
                <span className="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-ping" />
              )}
              <div
                style={{ backgroundColor: color }}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-white"
              >
                <Building2 className="w-4 h-4 text-white" />
              </div>

              {/* Label */}
              <div className="absolute left-1/2 -translate-x-1/2 top-8 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-white text-[9px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
                {fac.name} ({fac.status})
              </div>
            </div>
          );
        })}

        {/* Interactive Floating Info Card on Selected Facility */}
        {activeFacility && (
          <div className="absolute top-16 right-4 z-30 w-72 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-4 text-slate-200 text-xs space-y-2.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white truncate text-xs">{activeFacility.name}</span>
              <StatusBadge status={activeFacility.status} size="sm" />
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">District / State:</span>
                <span className="font-semibold">{activeFacility.district}, {activeFacility.state || activeFacility.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Type:</span>
                <span className="font-semibold">{activeFacility.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bed Occupancy:</span>
                <span className={`font-bold ${activeFacility.occupancy_rate > 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeFacility.occupied_beds || 0} / {activeFacility.total_beds || 40} ({activeFacility.occupancy_rate || 72}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Staff on Duty:</span>
                <span className="font-bold text-emerald-400">{activeFacility.staffing_percentage || 91}% Present</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex space-x-2">
              <button
                onClick={() => onSelectFacility(activeFacility)}
                className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg text-[10px] flex items-center justify-center space-x-1"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setActiveFacility(null)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px]"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 border border-slate-800 shadow-lg text-[11px] space-y-1.5 z-20 pointer-events-auto">
          <div className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#006CD4]" />
            <span>Map Legend</span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
              <span className="text-slate-300">Healthy Stock (Clinic OK)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              <span className="text-slate-300">Low Stock (&lt; 5 Days)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00897B]" />
              <span className="text-slate-300">Extra Stock (Can Share)</span>
            </div>
            <div className="flex items-center space-x-2 pt-0.5 border-t border-slate-800">
              <span className="w-4 h-0.5 bg-[#00897B] rounded" />
              <span className="text-slate-300">Medicine Delivery Route</span>
            </div>
          </div>
        </div>

        {/* Status Tag */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md rounded-xl px-3 py-1.5 border border-slate-800 shadow-lg text-[11px] font-mono z-20 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-semibold">
            Live Map View • {country === 'India' ? 'Maharashtra Region' : `${country}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] min-h-[500px] rounded-2xl overflow-hidden glass-panel border border-slate-200 dark:border-slate-800 shadow-xl">
      <APIProvider apiKey={apiKey} libraries={['places', 'marker']}>
        <Map
          center={targetCenter}
          zoom={targetZoom}
          mapId="trackmeds-health-command-map"
          style={{ width: '100%', height: '100%' }}
          styles={theme === 'dark' ? DARK_MAP_STYLE : []}
          internalUsageAttributionIds={['gmp_git_agentskills_v1']}
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
        >
          <MapCameraController center={targetCenter} zoom={targetZoom} />
          <RedistributionPolylines redistributions={redistributions} facilities={facilities} />


          {facilities.map((fac) => {
            const isSelected = (activeFacility?.id === fac.id);
            const color = getMarkerColor(fac.status);

            return (
              <AdvancedMarker
                key={fac.id}
                position={{ lat: fac.latitude, lng: fac.longitude }}
                onClick={() => {
                  setActiveFacility(fac);
                  onSelectFacility(fac);
                }}
                title={fac.name}
              >
                <div
                  className={`relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                  }`}
                >
                  {/* Critical pulse */}
                  {fac.status === 'Critical' && (
                    <span className="absolute w-7 h-7 rounded-full bg-rose-500/40 animate-ping" />
                  )}
                  <div
                    style={{ backgroundColor: color }}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-white"
                  >
                    <Building2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Detailed InfoWindow on Click */}
          {activeFacility && (
            <InfoWindow
              position={{ lat: activeFacility.latitude, lng: activeFacility.longitude }}
              onCloseClick={() => setActiveFacility(null)}
              headerContent={
                <div className="flex items-center justify-between gap-2 pr-2">
                  <span className="font-bold text-xs text-slate-900 truncate">{activeFacility.name}</span>
                  <StatusBadge status={activeFacility.status} size="sm" />
                </div>
              }
            >
              <div className="p-1 space-y-2 text-slate-800 text-xs min-w-[230px]">
                <div className="space-y-1.5 text-[11px] pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">District:</span>
                    <span className="font-bold text-slate-800">{activeFacility.district}, {activeFacility.country}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Facility Type:</span>
                    <span className="font-semibold text-slate-700">{activeFacility.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Bed Occupancy:</span>
                    <span className={`font-bold ${activeFacility.occupancy_rate > 90 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {activeFacility.occupied_beds || 0} / {activeFacility.total_beds || 40} Beds ({activeFacility.occupancy_rate || 72}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Staff on Duty:</span>
                    <span className="font-bold text-[#2E7D32]">
                      {activeFacility.staffing_percentage || 91}% Present
                    </span>
                  </div>
                  
                  {/* Top Critical Deficits */}
                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Running Low On:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        ORS Sachets (&lt; 5d)
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Amoxicillin 500mg
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectFacility(activeFacility)}
                    className="w-full py-1.5 px-2.5 bg-[#001F5B] hover:bg-[#002f8a] text-white font-bold rounded-lg text-[10px] flex items-center justify-center space-x-1 transition-colors"
                  >
                    <span>View Clinic Details</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Legend Overlay */}
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-lg text-[11px] space-y-1.5 z-10 pointer-events-auto">
          <div className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#006CD4]" />
            <span>Map Legend</span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
              <span className="text-slate-600 dark:text-slate-300">Healthy Stock (Clinic OK)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              <span className="text-slate-600 dark:text-slate-300">Low Stock (&lt; 5 Days)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00897B]" />
              <span className="text-slate-600 dark:text-slate-300">Extra Stock (Can Share)</span>
            </div>
            <div className="flex items-center space-x-2 pt-0.5 border-t border-slate-200 dark:border-slate-800">
              <span className="w-4 h-0.5 bg-[#00897B] rounded" />
              <span className="text-slate-600 dark:text-slate-300">Medicine Delivery Route</span>
            </div>
          </div>
        </div>

        {/* Region Tag */}
        <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-800 shadow-lg text-[11px] font-mono z-10 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            {country === 'India' ? 'Maharashtra Region (Pune, Satara, Solapur, Nashik)' : `${country} Region`}
          </span>
        </div>
      </APIProvider>
    </div>
  );
};

export default GoogleFacilityMap;
