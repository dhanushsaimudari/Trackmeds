import React from 'react';

interface TrackMedsLogoProps {
  variant?: 'full' | 'emblem' | 'compact';
  className?: string;
}

export const TrackMedsLogo: React.FC<TrackMedsLogoProps> = ({ variant = 'full', className = '' }) => {
  if (variant === 'emblem') {
    return (
      <svg
        viewBox="0 0 220 220"
        className={`w-12 h-12 shrink-0 drop-shadow-sm ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="emblemResilience" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#001F5B" />
            <stop offset="100%" stopColor="#003580" />
          </linearGradient>
          <linearGradient id="emblemInnovation" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#006CD4" />
            <stop offset="100%" stopColor="#00BCD4" />
          </linearGradient>
          <linearGradient id="emblemSustainability" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
        </defs>

        <g transform="translate(110, 110)">
          {/* Dynamic Orbit Ring */}
          <ellipse
            cx="0"
            cy="0"
            rx="94"
            ry="36"
            transform="rotate(-30)"
            fill="none"
            stroke="url(#emblemInnovation)"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            opacity="0.85"
          />
          {/* Autonomous Logistics Nodes */}
          <circle cx="75" cy="-43" r="5" fill="#00BCD4" />
          <circle cx="-75" cy="43" r="5" fill="#00897B" />

          {/* Central Modern Capsule Body */}
          <g transform="rotate(-45)">
            <path
              d="M -54,-28 L 0,-28 L 0,28 L -54,28 A 28,28 0 0,1 -54,-28 Z"
              fill="url(#emblemResilience)"
            />
            <path
              d="M 0,-28 L 54,-28 A 28,28 0 0,1 54,28 L 0,28 Z"
              fill="url(#emblemSustainability)"
            />
            <line x1="0" y1="-28" x2="0" y2="28" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9" />

            {/* Inner Cross Symbol: Primary Healthcare */}
            <path
              d="M -31,-12 L -23,-12 L -23,-20 L -15,-20 L -15,-12 L -7,-12 L -7,-4 L -15,-4 L -15,4 L -23,4 L -23,-4 L -31,-4 Z"
              fill="#FFFFFF"
              opacity="0.95"
            />

            {/* Connected Routing Nodes */}
            <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.95">
              <line x1="14" y1="-10" x2="26" y2="8" />
              <line x1="26" y1="8" x2="38" y2="-6" />
              <circle cx="14" cy="-10" r="3.5" fill="#00BCD4" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="26" cy="8" r="3.5" fill="#00897B" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="38" cy="-6" r="3.5" fill="#FFFFFF" stroke="#001F5B" strokeWidth="1.5" />
            </g>
          </g>

          {/* Radar Telemetry Pulse */}
          <path d="M 50,-58 A 82,82 0 0,1 78,-18" fill="none" stroke="#00BCD4" strokeWidth="3" strokeLinecap="round" />
          <path d="M 62,-70 A 100,100 0 0,1 98,-20" fill="none" stroke="#006CD4" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>
      </svg>
    );
  }

  // Full / Compact Variant
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <TrackMedsLogo variant="emblem" className="w-12 h-12" />
      <div className="flex flex-col justify-center">
        <div className="flex items-center space-x-2.5">
          <span className="font-black text-2xl tracking-tight leading-none text-[#001F5B] dark:text-white">
            TRACK<span className="text-[#00897B] dark:text-[#00BCD4]">MEDS</span>
          </span>
          <span className="bg-[#006CD4]/10 dark:bg-[#006CD4]/20 text-[#006CD4] dark:text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-[#006CD4]/30 shadow-xs">
            DPI • AI
          </span>
        </div>
        <span className="text-[10.5px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase hidden sm:block mt-1">
          Healthcare Resource & Supply Resilience
        </span>
      </div>
    </div>
  );
};
