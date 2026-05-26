'use client';
import React from 'react';
import { Header } from '../components/Header';
import { SurvivalItem, Localization } from '../logic';

interface ResultsViewProps {
  loc: Localization;
  username: string;
  currentTeamName: string;
  currentScore: number;
  getScoreMessage: (s: number) => string;
  staticItems: SurvivalItem[];
  setView: (view: any) => void;
  teamId: number;
  getTeamSynergy: (tId: number) => any;
}

export const ResultsView = ({
  loc,
  username,
  currentTeamName,
  currentScore,
  getScoreMessage,
  staticItems,
  setView,
  teamId,
  getTeamSynergy,
}: ResultsViewProps) => (
  <>
    <Header title={loc.result_lb_analis} />
    {/* PLAYER INFO BAR */}
    <div className="text-center mb-4">
      <div className="inline-block border border-[#00ff41] px-4 py-1 text-[14px] uppercase tracking-[0.2em] bg-[#00ff41]/10">
        {loc.lb_operator} <span className="text-white">{username}</span> | {loc.lb_team} <span className="text-white">{currentTeamName}</span>
      </div>
    </div>

    {/* TEAM SENERGY INFO BAR */}
    {username.startsWith('Commander') && (
      <div className="text-center mb-4">
        {(() => {
          const stats = getTeamSynergy(teamId);
          if (!stats) return null;
          return (
            <div
              className={`inline-block border-2 px-4 py-1 text-[12px] md:text-[14px] uppercase tracking-widest ${
                stats.isPositive ? 'border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]' : 'border-amber-500 bg-amber-500/10 text-amber-500'
              }`}>
              {loc.lb_synergy_avg} <span className="text-white font-black">{stats.avg}</span> | {loc.lb_synergy_gain}{' '}
              <span className="text-white font-black">{stats.isPositive ? `+${stats.percentage}%` : `${stats.percentage}%`}</span>
              <span className="ml-2 opacity-70">({stats.isPositive ? loc.lb_synergy_positive : loc.lb_synergy_negative})</span>
            </div>
          );
        })()}
      </div>
    )}

    <div className="text-center mb-4">
      <div className="text-4xl font-black mb-2">{currentScore} (110) </div>
      <div className="text-sm uppercase tracking-[0.3em] mb-0 opacity-70">{loc.lb_points}</div>
      <div className="text-xs text-white/80 italic mb-4">({loc.lb_explane})</div>
      <p className="text-xl italic bg-[#00ff41] text-black p-3 font-bold uppercase">{getScoreMessage(currentScore)}</p>
    </div>

    <div className="grid gap-4 mb-8 border border-[#00ff41]/30 p-4 bg-black/50">
      {[...staticItems] // Create a copy to avoid mutating state
        .sort((a, b) => a.idealPosition - b.idealPosition)
        .map(item => (
          <div key={item.id} className="text-xs border-b border-[#00ff41]/20 pb-4 last:border-0">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 border border-[#00ff41]/30 shrink-0">
                <img src={`/img/${item.photo}`} alt={item.name} className="w-full h-full object-cover opacity-50" />
              </div>
              <div className="flex-1">
                <span className="text-[#00ff41] font-bold uppercase block mb-1">
                  {item.idealPosition}. {item.name}
                </span>
                <p className="opacity-70 italic leading-relaxed">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
    </div>

    <div className="flex flex-col md:flex-row gap-4">
      <button
        onClick={() => setView('leaderboard')}
        className="flex-1 border-2 border-[#00ff41] py-3 hover:bg-[#00ff41] hover:text-black uppercase font-bold">
        {loc.lb_classific}
      </button>
    </div>
  </>
);
