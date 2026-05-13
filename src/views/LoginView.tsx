'use client';
import React from 'react';
import { Header } from '../components/Header';
import { MissionImageBlock } from '../components/MissionImageBlock';
import { GameResult, Team, Story, Localization, BUTTON_STYLES } from '../logic';

interface LoginViewProps {
  loc: Localization;
  story: Story;
  allResults: GameResult[];
  teamsList: Team[];
  scenarios: any[];
  teamId: number;
  setTeamId: (id: number) => void;
  username: string;
  setUsername: (name: string) => void;
  handleStart: () => void;
  onAdminLogin: () => void;
}

export const LoginView = ({
  loc,
  allResults,
  teamsList,
  scenarios,
  teamId,
  setTeamId,
  username,
  setUsername,
  handleStart,
  onAdminLogin,
}: LoginViewProps) => {
  // 1. Filter the commands that haven't finished yet and not archived.
  const activeTeams = teamsList.filter(t => !t.is_unlocked && !t.is_archived);
  // 2. Filter players for the SELECTED team who have not yet played (score === -1)
  const availablePlayers = allResults.filter(r => r.team_id === teamId && r.score === -1).sort((a, b) => a.username.localeCompare(b.username));
  return (
    <>
      {/* --- Header --- */}
      <div className="relative">
        <Header title={loc.login_header} />
        <button
          onClick={onAdminLogin}
          className="absolute top-1 right-0 md:top-0 md:right-2 z-50 hover:opacity-30 transition-opacity"
          title={loc.tooltip_admin_access}>
          <img src="/img/admin_ico.png" alt="Admin Access" className="w-6 h-6 md:w-10 md:h-10 border border-[#00ff41]/30 bg-black/50" />
        </button>
      </div>
      {/* --- Image block --- */}
      <MissionImageBlock src={'login_page.png'} isFullWidth={false} />
      {/* --- LOGIN FORM--- */}
      <div className="flex flex-col gap-3 max-w-sm mx-auto py-4 ">
        {/* SELECTOR 1: TEAM SELECTION (Grouped by scenarios) */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase opacity-50 font-bold tracking-widest">{loc.login_team_label || 'Seleziona Unità:'}</label>
          <select
            className="w-full bg-black border-2 border-[#00ff41] p-3 outline-none cursor-pointer text-sm font-bold uppercase"
            value={teamId}
            onChange={e => {
              setTeamId(Number(e.target.value));
              setUsername(''); // Reset the name when changing teams
            }}>
            <option value={0}>{loc.login_select_team}</option>
            {scenarios.map(scen => {
              const teamsInScen = activeTeams.filter(t => t.current_scenario === scen.id);
              if (teamsInScen.length === 0) return null;
              return (
                <optgroup key={scen.id} label={scen.name.toUpperCase()} className="bg-[#002200] text-[#00ff41]">
                  {teamsInScen.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {/* SELECTOR 2: PLAYER SELECTION */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase opacity-50 font-bold tracking-widest">
            {loc.login_operator_label || 'Identificativo Operatore:'}
          </label>
          <select
            className={`w-full bg-black border-2 p-3 outline-none cursor-pointer text-sm font-bold uppercase transition-all ${
              teamId === 0 && username !== 'admin' ? 'border-[#00ff41]/20 opacity-50' : 'border-[#00ff41]'
            }`}
            value={username}
            onChange={e => setUsername(e.target.value)}>
            <option value="">{loc.login_select_prompt}</option>
            {/* PLAYERS APPEAR ONLY AFTER A TEAM IS SELECTED */}
            {teamId !== 0 && (
              <optgroup label={`${loc.login_select_group}`}>
                {availablePlayers.map(p => (
                  <option key={p.id} value={p.username}>
                    {p.username}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <button onClick={handleStart} className={BUTTON_STYLES}>
          {loc.btn_start_main}
        </button>
      </div>
    </>
  );
};
