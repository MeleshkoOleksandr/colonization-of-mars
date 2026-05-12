'use client';
import React from 'react';

export const MissionImageBlock = ({ src, isFullWidth, contain }: { src: string; isFullWidth: boolean; contain?: boolean; }) => (
  <div
    className={`${isFullWidth ? 'w-full' : 'max-w-md mx-auto'} border border-[#00ff41]/30 bg-black relative overflow-hidden group shadow-[0_0_15px_rgba(0,255,65,0.1)] transition-all duration-700`}>
    {/* Corner decorative elements */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff41]"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff41]"></div>

     <img
      src={`/img/${src}`}
      alt="Mission Visual"
      className={`w-full transition-opacity duration-1000 
        ${contain 
          ? "h-auto object-contain p-1 md:p-2 opacity-80" // For logos: vehicle height, uncropped, with margins
          : `${isFullWidth ? "h-64 md:h-80" : "h-48"} object-cover opacity-60 group-hover:opacity-80` // For photos: fixed height and cropping
        }`}
    />

    {/* Text caption */}
    <div className="absolute bottom-2 left-3 flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-red-600 animate-pulse rounded-full"></div>
      <span className="text-[8px] uppercase tracking-[0.3em] text-[#00ff41]/70 font-black">Ares-1 Live Stream</span>
    </div>

    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
  </div>
);
