'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Users, LockOpen, UserCheck, Trash2, Info, QrCode, RefreshCcw, UserPlus, Globe, CircleSlash, Save } from 'lucide-react';

// Импортируем типы и энумы
import { Team, GameResult, Language, Localization, ModalMode, ModalType, PRIMARY_LANG } from '../types';

interface AdminViewProps {
  loc: Localization;
  availableLangs: Language[];
  currentLangId: string;
  setCurrentLangId: (id: string) => void;
  teamsList: Team[];
  scenarios: any[];
  allResults: GameResult[];
  adminTeamFilter: string;
  setAdminTeamFilter: (val: string) => void;
  
  // Handlers & Actions
  updateTeamStatusAction: (id: number, status: boolean) => Promise<void>;
  updateCommanderStatusAction: (id: number, status: boolean) => Promise<void>;
  getTeamsAction: () => Promise<Team[]>;
  setTeamsList: (teams: Team[]) => void;
  handleDeleteTeam: (id: number) => void;
  handleAddTeam: () => void;
  getResultsAction: () => Promise<GameResult[]>;
  setAllResults: (results: GameResult[]) => void;
  handleWipeEverything: () => void;
  handleDeleteTeamResults: (teamId: number) => void;
  handleDeleteResult: (id: number) => void;
  handleAddSinglePlayer: () => void;
  
  // UI States
  isRefreshing: boolean;
  setIsRefreshing: (val: boolean) => void;
  isAutoRefresh: boolean;
  setIsAutoRefresh: (val: boolean) => void;
  newTeamName: string;
  setNewTeamName: (val: string) => void;
  selectedScenarioForNewTeam: string;
  setSelectedScenarioForNewTeam: (val: string) => void;
  
  // Navigation
  setShareData: (data: any) => void;
  setSelectedUserDetail: (res: GameResult) => void;
  setPrevView: (view: any) => void;
  setView: (view: any) => void;
  triggerModal: (type: ModalType, mode: ModalMode, message: string) => void;
}

export const AdminView = (props: AdminViewProps) => {
  // --- (Destructuring) ---
  const {
    loc, availableLangs, currentLangId, setCurrentLangId,
    teamsList, scenarios, allResults, adminTeamFilter, setAdminTeamFilter,
    updateTeamStatusAction, updateCommanderStatusAction, getTeamsAction, setTeamsList,
    handleDeleteTeam, handleAddTeam, getResultsAction, setAllResults,
    handleWipeEverything, handleDeleteTeamResults, handleDeleteResult, handleAddSinglePlayer,
    isRefreshing, setIsRefreshing, isAutoRefresh, setIsAutoRefresh,
    newTeamName, setNewTeamName, selectedScenarioForNewTeam, setSelectedScenarioForNewTeam,
    setShareData, setSelectedUserDetail, setPrevView, setView, triggerModal
  } = props;

  // ---  UNIVERSAL FILTERING LOGIC ---
  const resultsFilteredByMenu = allResults.filter(r => {
    // If “All Teams” is selected
    if (adminTeamFilter === 'all') return true;

    // If a specific scenario (scen:id) is selected
    if (adminTeamFilter.startsWith('scen:')) {
      const targetScenId = adminTeamFilter.split(':')[1];
      // Let's check what scenario this player's team is facing
      const teamOfPlayer = teamsList.find(t => t.id === r.team_id);
      return teamOfPlayer?.current_scenario === targetScenId;
    }

    // If a specific team (team:id) is selected
    if (adminTeamFilter.startsWith('team:')) {
      const targetTeamId = parseInt(adminTeamFilter.split(':')[1]);
      return r.team_id === targetTeamId;
    }
    return true;
  });

  //  PREPARING THE LIST FOR THE REGISTRY (Sort by date) ---
  const filteredAdminResults = [...resultsFilteredByMenu].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; // Сначала новые
  });

  // --- PREPARING THE DISCUSSION LIST (Sort by name) ---
  const discussionResults = [...resultsFilteredByMenu].sort((a, b) => a.username.localeCompare(b.username));

  return (
    <>
      <div className="flex justify-between items-center mb-8 border-b-4 border-[#00ff41] pb-2 ">
        <h2 className="text-2xl font-black italic uppercase bg-[#00ff41] text-black px-2 ">{loc.admin_lb_terminal}</h2>
        <button onClick={() => setView('login')} className="text-xs underline pl-3">
          {loc.admin_lb_LOGOUT}
        </button>
      </div>

      {/* Settings Section */}
      <div className="border-2 border-[#00ff41]/30 p-4 bg-[#111]/30 mt-8">
        <h3 className="font-bold uppercase flex items-center gap-2 mb-4 border-b border-[#00ff41]/10 pb-2 text-[#00ff41]">
          <Globe size={18} /> {loc.admin_lb_localiz}
        </h3>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] uppercase opacity-50">{loc.admin_lb_lang}</label>
          <select
            className="w-full bg-black text-[#00ff41] text-xs border border-[#00ff41]/40 p-2 outline-none appearance-none cursor-pointer"
            value={currentLangId}
            onChange={e => setCurrentLangId(e.target.value)}>
            {/* CHECK: If the array is empty, display a placeholder */}
            {availableLangs.length === 0 ? (
              <option>{loc.admin_lb_langload}</option>
            ) : (
              availableLangs.map(l => (
                <option key={l.id} value={l.id} className="bg-black">
                  {l.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. TEAMS MANAGEMENT  */}
        <div className="border-2 border-[#00ff41]/30 p-4 bg-[#111]/30">
          <h3 className="font-bold uppercase flex items-center gap-2 mb-4 border-b border-[#00ff41]/10 pb-2">
            <Users size={18} />
            {loc.admin_lb_teamlist}
          </h3>

          {/* Scroll container */}
          <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar relative">
            <table className="w-full text-left border-collapse table-fixed">
              {/*  table-fixed helps keep column widths consistent*/}
              <thead className="sticky top-0 z-30 bg-[#00ff41] text-black uppercase text-[10px] font-black">
                <tr>
                  {/* Header 1: Unlock Results  */}
                  <th className="p-2 border border-black w-9 text-center cursor-help" title={loc.admin_msg_chkresults}>
                    <LockOpen size={14} className="mx-auto" />
                  </th>

                  {/* Header 2: Commander Status  */}
                  <th className="p-2 border border-black w-9 text-center cursor-help" title={loc.admin_msg_chkcomander}>
                    <UserCheck size={14} className="mx-auto" />
                  </th>

                  <th className="p-2 border border-black overflow-hidden">{loc.admin_lb_teamname}</th>

                  {/* Header 3: Scenario  */}
                  <th className="p-2 border border-black w-15 md:w-60">{loc.admin_lb_scename}</th>

                  <th className="p-2 border border-black w-12 text-center">CMD</th>
                </tr>
              </thead>
              <tbody className="text-[10px] uppercase">
                {teamsList
                  .sort((a, b) => a.id - b.id)
                  .map(t => {
                    const scenarioName = scenarios.find(s => s.id === t.current_scenario)?.name || 'Default';

                    return (
                      <tr key={t.id} className="border-b border-[#00ff41]/10 hover:bg-[#00ff41]/5 transition-colors">
                        {/* Checkbox 1: Unlock */}
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={t.is_unlocked}
                            onChange={async () => {
                              await updateTeamStatusAction(t.id, !t.is_unlocked);
                              setTeamsList(await getTeamsAction());
                            }}
                            className="appearance-none w-4 h-4 border border-[#00ff41]/40 bg-black checked:bg-[#00ff41] cursor-pointer relative"
                          />
                        </td>

                        {/* Checkbox 2: Commander */}
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={t.has_commander}
                            onChange={async () => {
                              await updateCommanderStatusAction(t.id, !t.has_commander);
                              setTeamsList(await getTeamsAction());
                            }}
                            className="appearance-none w-4 h-4 border border-amber-500/40 bg-black checked:bg-amber-500 cursor-pointer relative"
                          />
                        </td>

                        {/* Team Name */}
                        <td className="p-2 font-bold truncate">{t.name}</td>

                        {/* SCENARIO: Desktop Text, Mobile Left-side Tooltip */}
                        <td className="p-2 opacity-70">
                          <span className="hidden md:block truncate">{scenarioName}</span>
                          <div className="md:hidden relative group/scen flex items-center justify-center">
                            <Info size={14} className="text-[#00ff41]/50" />
                            <div className="absolute right-full top-0 mr-2 hidden group-active/scen:block z-50">
                              <div className="bg-[#00ff41] text-black text-[9px] font-black uppercase px-2 py-1 whitespace-nowrap shadow-[0_0_15px_#00ff41]">
                                {scenarioName}
                              </div>
                              <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-[#00ff41] absolute top-2 -right-1"></div>
                            </div>
                          </div>
                        </td>

                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-2">
                            {/* QR code for the whole team */}
                            <button
                              onClick={() => {
                                const scenario = scenarios.find(s => s.id === t.current_scenario);
                                const url = `${window.location.origin}?team=${t.id}&lang=${scenario?.language || 'en'}`;
                                setShareData({
                                  name: `${t.name}`,
                                  url,
                                });
                              }}
                              className="text-[#00ff41] hover:text-white transition-colors p-1"
                              title={loc.admin_msg_teamQr}>
                              <QrCode size={14} />
                            </button>

                            {/* Delete Action */}
                            <button onClick={() => handleDeleteTeam(t.id!)} className="text-red-500 hover:text-white transition-colors p-1">
                              <Trash2 size={14} className="mx-auto" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {/*Add Team area */}
          <div className="flex flex-col sm:flex-row gap-2 border-t border-[#00ff41]/20 pt-4">
            {/* 1. Selecting a scenario */}
            <select
              className="flex-1 bg-black text-[#00ff41] text-sm border border-[#00ff41]/40 p-2 outline-none cursor-pointer min-h-9.5"
              value={selectedScenarioForNewTeam}
              onChange={e => setSelectedScenarioForNewTeam(e.target.value)}>
              {scenarios.map(s => (
                <option key={s.id} value={s.id} className="bg-black">
                  {s.name}
                </option>
              ))}
            </select>

            {/* 2. Entering a command name  */}
            <input
              type="text"
              placeholder={loc.admin_lb_teamname}
              className="flex-1 bg-black text-[#00ff41] text-sm border border-c/40 p-2 outline-none focus:border-[#00ff41] transition-colors uppercase font-mono"
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
            />

            {/* 3. Create button  */}
            <button
              onClick={handleAddTeam}
              className="whitespace-nowrap border-2 border-dashed border-[#00ff41]/30 px-4 py-2 text-[12px] uppercase font-bold hover:bg-[#00ff41]/10 transition-colors sm:w-auto w-full">
              {loc.admin_lb_newteam}
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-4 border-2 border-[#00ff41]/30 p-6 bg-[#111]/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#00ff41]/30 pb-2 gap-4">
          <h3 className="font-bold uppercase flex items-center gap-2 text-[#00ff41]">
            <Save size={18} /> {loc.admin_lb_users}
          </h3>
          {/* RESULTS DASHBOARD */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full overflow-hidden">
            {/* GROUP 1: SYSTEM BUTTONS */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`px-3 py-1 border transition-all duration-300 flex items-center gap-2 ${
                  isAutoRefresh ? 'border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]' : 'border-[#00ff41]/30 text-[#00ff41]/40'
                }`}>
                <div
                  className={`w-1.5 h-1.5 ${isAutoRefresh ? 'bg-[#00ff41] animate-pulse shadow-[0_0_8px_#00ff41]' : 'bg-black border border-[#00ff41]/30'}`}></div>
                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Auto-Sync: {isAutoRefresh ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  const [freshResults, freshTeams] = await Promise.all([getResultsAction(), getTeamsAction()]);
                  setAllResults(freshResults);
                  setTeamsList(freshTeams);
                  setTimeout(() => setIsRefreshing(false), 500);
                }}
                className="px-3 py-1 border border-[#00ff41]/30 text-[#00ff41]/60 hover:border-[#00ff41] transition-all flex items-center gap-2 group text-[9px] font-black uppercase tracking-widest">
                <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.5, ease: 'linear' }} className="flex">
                  <RefreshCcw size={12} />
                </motion.div>
                <span className="whitespace-nowrap">{loc.admin_lb_refresh}</span>
              </button>

              <div className="h-6 w-px bg-[#00ff41]/20 mx-1 hidden lg:block"></div>
            </div>

            {/* GROUP 2: DATA OPERATIONS (Delete, Filter, Add) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0 lg:justify-end">
              {/* DELETE ALL BUTTON */}
              <button
                onClick={handleWipeEverything}
                className="px-3 py-1.5 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase transition-all shadow-[0_0_10px_rgba(220,38,38,0.2)] shrink-0"
                title={loc.tooltip_wipe_all}>
                {loc.admin_lb_clearall}
              </button>

              {/* FILTER CONTAINER AND ADD BUTTONS */}
              <div className="flex items-center bg-black border border-[#00ff41]/40 p-1 flex-1 min-w-0">
                <span className="text-[9px] px-2 opacity-50 uppercase italic font-bold whitespace-nowrap border-r border-[#00ff41]/20 mr-2 shrink-0">
                  {loc.admin_lb_filter}
                </span>

                {/* COMMAND SELECTOR */}
                <select
                  className="bg-transparent text-[#00ff41] text-[10px] outline-none cursor-pointer uppercase font-bold flex-1 min-w-0 max-w-full truncate"
                  value={adminTeamFilter}
                  onChange={e => setAdminTeamFilter(e.target.value)}>
                  {/* 1. General filter */}
                  <option value="all" className="bg-black text-[#00ff41]">
                    -- {loc.filter_all || 'TUTTI I RISULTATI'} --
                  </option>

                  {/* 2. We only consider scenarios that contain at least one command */}
                  {scenarios
                    .filter(scen => teamsList.some(t => t.current_scenario === scen.id))
                    .map(scen => (
                      <React.Fragment key={scen.id}>
                        {/* SELECTED SCENARIO (marked with an asterisk) */}
                        <option value={`scen:${scen.id}`} className="bg-[#002200] text-amber-500 font-black italic">
                          * {scen.name.toUpperCase()}
                        </option>

                        {/* COMMANDS IN THIS SCRIPT */}
                        {teamsList
                          .filter(t => t.current_scenario === scen.id)
                          .sort((a, b) => a.id - b.id)
                          .map(t => (
                            <option key={t.id} value={`team:${t.id}`} className="bg-black text-[#00ff41]">
                              &nbsp;&nbsp;&nbsp;{t.name}
                            </option>
                          ))}
                      </React.Fragment>
                    ))}
                </select>

                {/* ADD BUTTON */}
                <button
                  onClick={handleAddSinglePlayer}
                  className="ml-2 px-3 py-1 border border-[#00ff41] text-[#00ff41] text-[9px] font-black uppercase hover:bg-[#00ff41] hover:text-black transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  title={loc.admin_msg_addteam}>
                  <UserPlus size={12} strokeWidth={2.5} />
                  <span className="hidden xs:inline">{loc.admin_lb_add}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 md:mx-0">
          <table className="w-full text-left border-collapse min-w-300px">
            <thead>
              <tr className="bg-[#00ff41] text-black uppercase text-[9px] md:text-[10px] font-black">
                <th className="p-2 border border-black w-50px md:w-auto">Data</th>
                <th className="p-2 border border-black">User</th>
                <th className="p-2 border border-black hidden sm:table-cell">Team</th>
                <th className="p-2 border border-black text-right w-40px">Pts</th>
                <th className="p-2 border border-black text-center w-80px">Cmd</th>
              </tr>
            </thead>
            <tbody className="text-[10px] md:text-[11px] uppercase">
              {filteredAdminResults.length > 0 ? (
                filteredAdminResults.map(r => {
                  const isPending = r.score === -1;
                  return (
                    <tr
                      key={r.id}
                      // Add a very light orange background to the entire line if the player is “waiting”
                      className={`border-b border-[#00ff41]/10 transition-colors ${
                        isPending ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-[#00ff41]/5'
                      }`}>
                      {/* DATE: Short format for mobile */}
                      <td className={`p-2 whitespace-nowrap ${isPending ? 'text-amber-500/50' : 'opacity-60'}`}>
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString([], {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          : 'N/A'}
                        <span className="hidden md:inline">{r.created_at && `/${new Date(r.created_at).getFullYear().toString().slice(-2)}`}</span>
                      </td>

                      {/* USERNAME: Wraps if long */}
                      <td className={`p-2 font-bold wrap-break-word max-w-80px md:max-w-none ${isPending ? 'text-amber-500' : ''}`}>
                        {r.username}
                        {isPending && <span className="ml-2 text-[8px] animate-pulse">[LOAD...]</span>}
                      </td>

                      {/* TEAM: Hidden on very small screens, visible on tablets/desktop */}
                      <td
                        className={`p-2 italic truncate hidden sm:table-cell ${
                          isPending ? 'text-amber-500 opacity-100' : 'text-[#00ff41] opacity-60'
                        }`}>
                        {r.team_name}
                      </td>

                      {/* SCORE */}
                      <td className={`p-2 font-black text-right ${isPending ? 'text-amber-500' : 'text-[#00ff41]'}`}>
                        {isPending ? (
                          <div className="flex justify-end opacity-50">
                            <CircleSlash size={14} strokeWidth={3} />
                          </div>
                        ) : (
                          r.score
                        )}
                      </td>

                      {/* ACTION buttons */}
                      <td className="p-2">
                        <div className="flex justify-center gap-2 md:gap-4">
                          <button
                            onClick={() => {
                              // Select the language from the script (or [it] by default)
                              const team = teamsList.find(t => t.id === r.team_id);
                              const scenario = scenarios.find(s => s.id === team?.current_scenario);
                              const lang = scenario?.language || PRIMARY_LANG;
                              // To create the link: your current address + player name
                              const url = `${window.location.origin}?user=${encodeURIComponent(r.username)}&lang=${lang}`;
                              setShareData({ name: r.username, url });
                            }}
                            className={`${isPending ? 'text-amber-500' : 'text-[#00ff41]'} hover:text-white transition-colors p-1`}
                            title={loc.admin_msg_qr}>
                            <QrCode size={18} />{' '}
                          </button>
                          <button onClick={() => handleDeleteResult(r.id!)} className="text-red-500 hover:text-white transition-colors p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center opacity-50 italic">
                    {loc.admin_lb_nodata}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <button
          onClick={() => {
            setPrevView('admin');
            setView('leaderboard');
          }}
          className="border-2 border-[#00ff41] py-3 hover:bg-[#00ff41] hover:text-black uppercase font-bold text-xs">
          {loc.admin_btn_results}
        </button>

        <button
          onClick={() => {
            if (adminTeamFilter === 'all') {
              triggerModal('alert', ModalMode.IDLE, loc.msg_err_select_team);
            } else {
              setPrevView('admin');
              setView('discussion-list');
            }
          }}
          className="border-2 border-amber-500 py-3 text-amber-500 hover:bg-amber-500 hover:text-black uppercase font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          {loc.admin_btn_dicusion}
        </button>
      </div>
    </>
  );
};
