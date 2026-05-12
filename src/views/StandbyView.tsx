'use client';
import { Header } from '../components/Header';
import { MissionImageBlock } from '../components/MissionImageBlock';
import { Localization } from '../logic';

interface StandbyViewProps {
  loc: Localization;
  onAdminLogin: () => void;
}

export const StandbyView = ({ loc, onAdminLogin }: StandbyViewProps) => (
  <div className="relative flex flex-col min-h-full">
    <button onClick={onAdminLogin} className="absolute right-1 z-50 hover:opacity-30 transition-opacity" title={loc.tooltip_admin_access}>
      <img src="/img/admin_ico.png" alt="Admin Access" className="w-6 h-6 md:w-10 md:h-10 border border-[#00ff41]/30 bg-black/50" />
    </button>
    <Header title={loc.standby_header} />

    <div className="flex-1 flex flex-col justify-center items-center w-full  contain={true} space-y-3">
      <div className="w-full px-1 md:px-2">
        <MissionImageBlock src="logo_stand_by.png" isFullWidth={true} contain={true} />
      </div>

      <div className="text-center space-y-2 animate-pulse">
        <p className="text-[#00ff41] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-xs leading-relaxed">
          {loc.standby_msg}
        </p>
        <p className="text-[9px] opacity-40 uppercase">Ares-1 Terminal v4.0</p>
      </div>
    </div>
  </div>
);
