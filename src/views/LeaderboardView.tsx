'use client';
import React from 'react';
import { ArrowLeft, RefreshCcw, FileDown, ChevronRight, CircleSlash } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameResult, Localization, ModalMode } from '../logic';

interface LeaderboardViewProps {
  loc: Localization;
  isAdmin: boolean;
  title: string;
  leaderboardResults: GameResult[];
  exportToCSV: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (val: boolean) => void;
  getResultsAction: () => Promise<GameResult[]>;
  setAllResults: (data: GameResult[]) => void;
  setSelectedUserDetail: (res: GameResult) => void;
  setShowDeltas: (val: boolean) => void;
  setPrevView: (view: any) => void;
  setView: (view: any) => void;
  triggerModal: (type: any, mode: any, message: string) => void;
}

export const LeaderboardView = ({
  loc,
  isAdmin,
  leaderboardResults,
  exportToCSV,
  isRefreshing,
  setIsRefreshing,
  getResultsAction,
  setAllResults,
  setSelectedUserDetail,
  setShowDeltas,
  setPrevView,
  setView,
  triggerModal,
}: LeaderboardViewProps) => (
  <>
    <div className="flex justify-between items-center mb-6 border-b-2 border-[#00ff41] pb-2">
      <button
        onClick={() => {
          if (isAdmin) {
            setView('admin');
          } else {
            setView('results');
          }
        }}
        className="text-xs flex items-center gap-1 hover:underline text-[#00ff41]">
        <ArrowLeft size={14} />
        {isAdmin ? 'Admin' : loc.result_lb_res}
      </button>
      <h2 className="text-xl font-bold uppercase">{loc.lb_statuscol}</h2>

      <motion.div
        // Rotation animation: if isRefreshing = true, rotate 360 degrees
        animate={{ rotate: isRefreshing ? 360 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="flex items-center justify-center">
        <RefreshCcw
          size={18}
          className="cursor-pointer text-[#00ff41]/60 hover:text-[#00ff41] transition-colors duration-300"
          onClick={async () => {
            // 1. Play the animation
            setIsRefreshing(true);
            // 2. We are loading the data
            const freshData = await getResultsAction();
            setAllResults(freshData);
            // 3. We pause the animation briefly to allow the rotation to finish
            setTimeout(() => setIsRefreshing(false), 500);
          }}
        />
      </motion.div>
    </div>
    <div className="space-y-2">
      {/* TABLE HEADERS - Adjusted for mobile grid */}
      <div className="grid grid-cols-[1.5fr_1fr_45px_35px] md:grid-cols-4 text-[10px] uppercase opacity-50 px-4 mb-2">
        <span>Name</span>
        <span>Team</span>
        <span className="text-right">Pts</span>
        <span className="text-right md:pr-2">Info</span>
      </div>

      {leaderboardResults.map(res => {
        const isCommEntry = res.username === 'Commander';
        // Проверка наличия результата
        const hasResult = res.score !== -1 || isCommEntry;

        return (
          <div
            key={res.id}
            // Responsive grid: wider for name, narrow for score/action
            // Amber color for Commander
            className={`grid grid-cols-[1.5fr_1fr_45px_35px] md:grid-cols-4 items-center p-3 md:p-4 border transition-colors gap-2 ${
              isCommEntry
                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-[#111] border-[#00ff41]/20 hover:border-[#00ff41]'
            }`}>
            {/* NAME: Allow wrapping and multi-line for long names. Amber color for Commander */}
            <span className={`font-bold text-xs md:text-sm leading-tight wrap-break-word pr-2 ${isCommEntry ? 'text-amber-500' : ''}`}>
              {res.username}
            </span>

            {/* TEAM: Small and truncated to save space. Amber color for Commander */}
            <span className={`text-[10px] md:text-xs truncate uppercase ${isCommEntry ? 'text-amber-500 opacity-100' : 'opacity-70'}`}>
              {res.team_name}
            </span>

            {/* SCORE: The commander can also be highlighted in orange */}
            <span className={`text-right font-black text-xs md:text-base ${isCommEntry ? 'text-amber-500' : 'text-[#00ff41]'}`}>
              {res.score === -1 ? (
                // Показываем иконку вместо -1
                <div className="flex justify-end" title={loc.msg_waiting || 'In attesa...'}>
                  <CircleSlash size={16} strokeWidth={3} />
                </div>
              ) : (
                // Показываем реальный балл
                res.score
              )}
            </span>

            {/* ACTION: Icon instead of text on mobile */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!hasResult) {
                    triggerModal('alert', ModalMode.IDLE, loc.msg_no_results || 'Rapporto non disponibile.');
                    return;
                  }
                  setSelectedUserDetail(res);
                  setShowDeltas(true);
                  setPrevView('leaderboard');
                  setView('user-detail');
                }}
                className={`p-1 ${isCommEntry ? 'text-amber-500' : hasResult ? 'text-[#00ff41]' : 'text-red-600'}`}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>

    {/* BOTTOM ACTION BAR */}
    <div className="mt-8 pt-6 border-t-2 border-[#00ff41]/30">
      {isAdmin ? (
        /* 1. ADMIN OPTION: EXPORT button */
        <button
          onClick={exportToCSV}
          className="w-full bg-[#00ff41] text-black py-4 font-black uppercase text-xl hover:bg-white transition-colors flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,65,0.3)] active:scale-[0.98]">
          <FileDown size={24} />
          {loc.csv_btn_export}
        </button>
      ) : (
        /* 2. PLAYER OPTION: NEW MISSION button */
        <>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#00ff41] text-black py-4 font-black uppercase text-xl hover:bg-white transition-colors flex items-center justify-center gap-3 active:scale-[0.98]">
            <RefreshCcw size={24} />
            {loc.result_lb_newmiss}
          </button>
          <p className="text-[10px] text-center mt-4 opacity-50 uppercase tracking-widest">{loc.result_lb_atten}</p>
        </>
      )}
    </div>
  </>
);
