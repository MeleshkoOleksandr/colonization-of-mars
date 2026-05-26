'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GameResult, SurvivalItem, Localization } from '../logic';
import { ArrowLeft, MessageSquare, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { SurvivalChart } from '../components/SurvivalChart';

interface UserDetailViewProps {
  selectedUserDetail: GameResult;
  staticItems: SurvivalItem[];
  showDeltas: boolean;
  prevView: string;
  setView: (view: any) => void;
  loc: Localization;
  getTeamSynergy: (tId: number) => any;
}

/**
 * MAIN VIEW COMPONENT
 */
export const UserDetailView = ({ selectedUserDetail, staticItems, showDeltas, prevView, setView, loc, getTeamSynergy }: any) => {
  // Condition of the accordion
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  return (
    <>
      <div className="mb-6">
        <button
          // We use prevView state to decide where to go back
          onClick={() => setView(prevView)}
          className="text-xs flex items-center gap-1 hover:underline mb-4">
          <ArrowLeft size={14} />{' '}
        </button>

        <div className="mb-8">
          <div className="text-center mb-4">
            <div className="inline-block border border-[#00ff41] px-4 py-1 text-[14px] uppercase tracking-[0.2em] bg-[#00ff41]/10">
              {loc.lb_operator} <span className="text-white">{selectedUserDetail.username}</span> | {loc.lb_team}{' '}
              <span className="text-white">{selectedUserDetail.team_name}</span>
            </div>
          </div>

          {/* TEAM SENERGY INFO BAR */}
          {selectedUserDetail.username.startsWith('Commander') && showDeltas && (
            <div className="flex justify-center mt-4">
              {(() => {
                const stats = getTeamSynergy(selectedUserDetail.team_id);
                // If there isn't enough data for the calculation, we don't display anything
                if (!stats) return null;
                return (
                  <div
                    className={`inline-block border px-4 py-1 text-[12px] uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                      stats.isPositive ? 'border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]' : 'border-amber-500 bg-amber-500/10 text-amber-500'
                    }`}>
                    <span className="opacity-80">{loc.lb_synergy_result || 'Efficienza Collettiva'}:</span>
                    <span className="text-white font-black ml-2">{stats.isPositive ? `+${stats.percentage}%` : `${stats.percentage}%`}</span>
                    <span className="ml-2 text-[10px] opacity-60 lowercase italic">
                      (Avg: {stats.avg} vs Cmd: {stats.commanderScore})
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="mt-2 flex justify-center ">
            {showDeltas ? (
              <div className="text-sm font-black uppercase tracking-tight text-[#00ff41] flex items-baseline gap-2">
                <span>{loc.lb_nasapoints}</span>
                <span className="text-2xl underline decoration-double">{selectedUserDetail.score}</span>
              </div>
            ) : (
              <div className="inline-block text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-1 border border-amber-500/30 uppercase tracking-widest animate-pulse">
                {loc.lb_status}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {selectedUserDetail.selections.map((itemId: string, idx: number) => {
          const item = staticItems.find((i: SurvivalItem) => i.id === itemId);
          const diff = Math.abs(idx + 1 - (item?.idealPosition || 0));

          return (
            <div key={itemId} className="flex justify-between items-start gap-3 p-3 border-b border-[#00ff41]/10 bg-black/20">
              {/* LEFT SIDE: Index and Name (Flexible) */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] opacity-40 font-mono mr-2">{String(idx + 1).padStart(2, '0')}.</span>
                <span className="uppercase font-bold text-[11px] leading-tight wrap-break-word">{item?.name}</span>
              </div>

              {/* RIGHT SIDE: NASA Info and Delta (Fixed width, pinned to right) */}
              <div className="shrink-0 text-right font-mono flex flex-col items-end">
                {/* Condition: display deltas only if showDeltas === true */}
                {showDeltas ? (
                  <>
                    <div className="text-[9px] opacity-50 uppercase italic leading-none mb-1">NASA: {item?.idealPosition}</div>
                    <div className={`text-sm font-black leading-none ${diff === 0 ? 'text-green-400' : 'text-amber-500'}`}>Δ {diff}</div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-amber-500 opacity-80" title="In fase di discussione - Punteggio nascosto">
                    <MessageSquare size={22} className="animate-pulse" />
                    <span className="text-[7px] uppercase font-black tracking-tighter">{loc.lb_discussione}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/*  Accordion with a chart */}
      {showDeltas && (
        <div className="mt-8">
          <button
            onClick={() => setIsChartExpanded(!isChartExpanded)}
            className="w-full flex items-center justify-between p-3 border-2 border-[#00ff41]/30 bg-[#00ff41]/5 hover:bg-[#00ff41]/10 transition-all group">
            <div className="flex items-center gap-3 text-[#00ff41]">
              <Activity size={18} className="group-hover:animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">{loc.chart_toggle || 'Visualizza Matrice di Correlazione'}</span>
            </div>
            {isChartExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* graphic rendering */}
          {isChartExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
              <SurvivalChart selections={selectedUserDetail.selections} staticItems={staticItems} loc={loc} />
            </motion.div>
          )}
        </div>
      )}
    </>
  );
};
