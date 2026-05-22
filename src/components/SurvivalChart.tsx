'use client';
import React, { useState } from 'react';
import { SurvivalItem, Localization } from '../logic';

interface SurvivalChartProps {
  selections: string[];
  staticItems: SurvivalItem[];
  loc: Localization;
}

/**
 * COMPONENT: Survival Correlation Chart
 * Renders an SVG line graph comparing User order vs NASA ideal order.
 */
export const SurvivalChart = ({ selections, staticItems, loc }: SurvivalChartProps) => {
  // State for storing the item name on hover
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const width = 500;
  const height = 300;
  const margin = { top: 50, right: 35, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const itemsByNASA = [...staticItems].sort((a, b) => a.idealPosition - b.idealPosition);

  const points = itemsByNASA.map((item, index) => {
    const nasaRank = item.idealPosition;
    const userRank = selections.indexOf(item.id) + 1;

    return {
      id: item.id,
      name: item.name,
      x: (index / 14) * innerWidth + margin.left,
      yNasa: ((nasaRank - 1) / 14) * innerHeight + margin.top,
      yUser: ((userRank - 1) / 14) * innerHeight + margin.top,
      nasaRank,
      userRank,
    };
  });

  return (
    <div className="border-t-2 border-[#00ff41]/20 pt-6 mt-8">
      <div className="border-2 border-[#00ff41]/30 bg-[#050505] p-2 shadow-[0_0_20px_rgba(0,255,65,0.1)] relative overflow-hidden">
        {/* Terminal-Style Tooltip */}
        <div className="h-6 mb-2 px-2 flex justify-between items-center border-b border-[#00ff41]/10">
          <span className="text-[8px] md:text-[12px] font-black uppercase text-[#00ff41]/60">
            {activeItem ? `${activeItem}` : `> ANALISI_GRAFICA_RETE`}
          </span>
          <span className="text-[6px] md:text-[8px] text-amber-500 animate-pulse">{activeItem ? 'TARGET_LOCKED' : 'STANDBY'}</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-mono cursor-crosshair">
          <defs>
            <filter id="glow-chart">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid */}
          {Array.from({ length: 15 }).map((_, i) => (
            <React.Fragment key={i}>
              <line
                x1={margin.left}
                y1={margin.top + (innerHeight / 14) * i}
                x2={width - margin.right}
                y2={margin.top + (innerHeight / 14) * i}
                stroke="#00ff41"
                strokeWidth="0.5"
                strokeOpacity="0.15"
                strokeDasharray={i % 5 === 0 ? '0' : '2 2'}
              />
              <line
                x1={margin.left + (innerWidth / 14) * i}
                y1={margin.top}
                x2={margin.left + (innerWidth / 14) * i}
                y2={height - margin.bottom}
                stroke="#00ff41"
                strokeWidth="0.5"
                strokeOpacity="0.15"
                strokeDasharray={i % 5 === 0 ? '0' : '2 2'}
              />
              <text x={margin.left - 10} y={margin.top + (innerHeight / 14) * i + 3} fill="#00ff41" fontSize="9" textAnchor="end" opacity="0.5">
                {i + 1}
              </text>
              <text
                x={margin.left + (innerWidth / 14) * i}
                y={height - margin.bottom + 12}
                fill="#00ff41"
                fontSize="9"
                textAnchor="middle"
                opacity="0.5">
                {i + 1}
              </text>
            </React.Fragment>
          ))}

          {/* DEVIATION LINES */}
          {points.map((p, i) => (
            <line key={`d-${i}`} x1={p.x} y1={p.yNasa} x2={p.x} y2={p.yUser} stroke="white" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
          ))}

          {/* NASA LINE */}
          <polyline
            fill="none"
            stroke="#00ff41"
            strokeWidth="2"
            filter="url(#glow-chart)"
            strokeOpacity="0.4"
            points={points.map(p => `${p.x},${p.yNasa}`).join(' ')}
          />

          {/* PLAYER'S LINE */}
          <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" points={points.map(p => `${p.x},${p.yUser}`).join(' ')} />

          {/* INTERACTIVE POINTS */}
          {points.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setActiveItem(`${p.name} (NASA: ${p.nasaRank} | YOU: ${p.userRank})`)}
              onMouseLeave={() => setActiveItem(null)}
              className="cursor-help">
              {/* A large, unmarked area for easy finger navigation */}
              <circle cx={p.x} cy={p.yUser} r="15" fill="transparent" />

              {/* NASA Point */}
              <circle cx={p.x} cy={p.yNasa} r="3" fill="#00ff41" opacity="0.6" />

              {/* The Player's Square */}
              <rect x={p.x - 4} y={p.yUser - 4} width="8" height="8" fill="#0a0a0a" stroke="#f59e0b" strokeWidth="1.5" />
              <rect x={p.x - 1.5} y={p.yUser - 1.5} width="3" height="3" fill="#f59e0b" />
            </g>
          ))}
        </svg>

        {/* LEGEND */}
        <div className="flex justify-center gap-6 mt-2 pb-1 text-[8px] font-black uppercase text-[#00ff41]/50 tracking-tighter">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff41] opacity-60"></div>
            <span>NASA_REF</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 border border-amber-500 bg-black"></div>
            <span>USER_DATA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
