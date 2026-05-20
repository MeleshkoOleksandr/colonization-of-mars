'use client';
import React from 'react';
import { ArrowLeft, RefreshCcw, Info, Clock, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameResult, Team, Localization, ModalMode } from '../logic';

interface DiscussionListViewProps {
  loc: Localization;
  isAdmin: boolean;
  username: string;
  teamId: number;
  adminTeamFilter: string;
  teamsList: Team[];
  discussionResults: GameResult[];
  setIsRefreshing: (val: boolean) => void;
  isRefreshing: boolean;
  getResultsAction: () => Promise<GameResult[]>;
  setAllResults: (data: GameResult[]) => void;
  setSelectedUserDetail: (res: GameResult) => void;
  setShowDeltas: (val: boolean) => void;
  setPrevView: (view: any) => void;
  setView: (view: any) => void;
  updateTeamStatusAction: (id: number, status: boolean) => Promise<void>;
  getTeamsAction: () => Promise<Team[]>;
  setTeamsList: (teams: Team[]) => void;
  triggerModal: (type: any, mode: any, msg: string) => void;
  checkTeamStatusAction: (id: number) => Promise<boolean>;
  handleBecomeCommander: () => void;
  BUTTON_STYLES: any;
  // --- Timer
  timerSeconds: number;
  setTimerSeconds: (val: number) => void;
  timeLeft: number | null;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
}

export const DiscussionListView = ({
  loc,
  isAdmin,
  username,
  teamId,
  adminTeamFilter,
  teamsList,
  discussionResults,
  setIsRefreshing,
  isRefreshing,
  getResultsAction,
  setAllResults,
  setSelectedUserDetail,
  setShowDeltas,
  setPrevView,
  setView,
  updateTeamStatusAction,
  getTeamsAction,
  setTeamsList,
  triggerModal,
  checkTeamStatusAction,
  handleBecomeCommander,
  BUTTON_STYLES,
  timerSeconds,
  setTimerSeconds,
  timeLeft,
  isTimerRunning,
  startTimer,
  stopTimer,
}: DiscussionListViewProps) => {
  const uniqueTeamIds: number[] = Array.from(new Set(discussionResults.map(r => r.team_id))).sort((a, b) => a - b);
  const isCommander = username.startsWith('Commander');

  const getCurrentTeamName = () => {
    if (isAdmin) {
      if (adminTeamFilter.startsWith('team:')) {
        const id = parseInt(adminTeamFilter.split(':')[1]);
        return teamsList.find(t => t.id === id)?.name;
      }
      if (adminTeamFilter.startsWith('scen:')) {
        return adminTeamFilter.split(':')[1].toUpperCase();
      }
      return 'Global';
    }
    return teamsList.find(t => t.id === teamId)?.name;
  };

  // --- Unlock Logic ---
  const handleUnlockResults = async () => {
    try {
      if (isAdmin) {
        if (adminTeamFilter.startsWith('team:')) {
          const id = parseInt(adminTeamFilter.split(':')[1]);
          await updateTeamStatusAction(id, true);
        } else if (adminTeamFilter.startsWith('scen:')) {
          const scenId = adminTeamFilter.split(':')[1];
          // Let's enable all commands in this script
          const scenarioTeams = teamsList.filter(t => t.current_scenario === scenId);
          for (const t of scenarioTeams) {
            await updateTeamStatusAction(t.id, true);
          }
        } else {
          return triggerModal('alert', ModalMode.IDLE, 'Seleziona un Team o uno Scenario specifico.');
        }
      } else {
        // If you are the Commander, unlock only your own team
        await updateTeamStatusAction(teamId, true);
      }

      // Updating the list of commands in memory
      const freshTeams = await getTeamsAction();
      setTeamsList(freshTeams);

      if (isCommander) {
        setView('results');
      } else {
        triggerModal('alert', ModalMode.IDLE, loc.msg_modal_missioncomlite);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* TIMER: A MASSIVE VISUAL EFFECT */}
      <AnimatePresence>
        {isTimerRunning && timeLeft !== null && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 flex items-center justify-center z-100 pointer-events-none">
            {/* A very wide, translucent band across the entire screen */}
            <div className="w-full bg-[#00ff41]/5 border-y-2 border-[#00ff41]/20 backdrop-blur-md py-12 flex flex-col items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.9)]">
              <div className="text-[#00ff41] font-black uppercase tracking-[0.8em] text-[10px] md:text-sm mb-4 animate-pulse opacity-70">
                — {loc.timer_overlay_title || 'DEBRIEFING COUNTDOWN'} —
              </div>

              {/* GIANT NUMBERS */}
              <div className="text-8xl md:text-[12rem] font-black font-mono text-[#00ff41] leading-none drop-shadow-[0_0_30px_#00ff41] flex items-center gap-4">
                <span className="tabular-nums">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Decorative progress bar below the numbers */}
              <div className="w-full max-w-2xl h-1 bg-[#00ff41]/10 mt-8 relative overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: timerSeconds, ease: 'linear' }}
                  className="absolute inset-0 bg-[#00ff41] shadow-[0_0_15px_#00ff41]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6 border-b-2 border-[#00ff41] pb-2 text-[#00ff41]">
        {isAdmin && (
          <button onClick={() => setView('admin')} className="text-xs flex items-center gap-1 hover:underline">
            <ArrowLeft size={14} /> {loc.btn_admin}
          </button>
        )}

        <h2 className="text-lg font-bold uppercase italic tracking-tighter">{loc.btn_report}</h2>

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

      <div className="space-y-8 mb-8">
        {/* 2. OUTER LOOP: Iterate through each command */}
        {uniqueTeamIds.map(tId => {
          const teamName = teamsList.find(t => t.id === tId)?.name || 'Unità Sconosciuta';
          const teamMembers = discussionResults.filter(r => r.team_id === tId);

          return (
            <div key={tId} className="space-y-2">
              {/* TEAM HEADING */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-0.5 flex-1 bg-[#00ff41]"></div>
                <h3 className="text-xs font-black uppercase text-[#00ff41] tracking-[0.2em] px-2">- {teamName} -</h3>
                <div className="h-0.5 flex-1 bg-[#00ff41]"></div>
              </div>

              {/* 3. INER LOOP: Players on this team */}
              <div className="space-y-2">
                {teamMembers.map(res => {
                  const isCommEntry = res.username.startsWith("Commander");
                  const hasResult = res.score !== -1;
                  const btnColorClass = isCommEntry ? 'bg-amber-500' : hasResult ? 'bg-[#00ff41]' : 'bg-red-600 animate-pulse';

                  return (
                    <div
                      key={res.id}
                      className={`flex justify-between items-center p-3 border ${
                        isCommEntry
                          ? 'bg-[#38180670] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-[#00ff41]/5 border-[#00ff41]/20'
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold uppercase text-xs ${isCommEntry ? 'text-amber-500' : 'text-[#00ff41]'}`}>{res.username}</span>
                      </div>

                      <button
                        onClick={() => {
                          if (!hasResult) {
                            triggerModal('alert', ModalMode.IDLE, loc.msg_no_results || 'Rapporto non disponibile.');
                            return;
                          }
                          setSelectedUserDetail(res);
                          setShowDeltas(false);
                          setPrevView('discussion-list');
                          setView('user-detail');
                        }}
                        className={`${btnColorClass} text-black px-4 py-1 text-[10px] font-black uppercase`}>
                        {loc.btn_analise || 'Analizza'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- BOTTOM BUTTON PANEL --- */}
      <div className="flex flex-col gap-4 mt-8">
        {/* Timer */}
        {isAdmin && (
          <div className="mb-6 p-3 border-2 border-[#00ff41]/20 bg-black/40 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Clock size={16} className="text-[#00ff41]/60" />
              <span className="text-[14px] font-bold uppercase whitespace-nowrap"> {loc.timer_control_label || 'Set Mission Duration'} </span>
              <input
                type="number"
                value={timerSeconds}
                onChange={e => setTimerSeconds(parseInt(e.target.value) || 0)}
                className="w-16 bg-[#001100] border border-[#00ff41]/40 p-1 text-[#00ff41] text-[14px] font-mono outline-none focus:border-[#00ff41]"
              />
              <span className="text-[14px] opacity-50 uppercase">sec</span>
            </div>

            {!isTimerRunning ? (
              <button
                onClick={startTimer}
                className="px-4 py-1.5 bg-[#00ff41] text-black text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white transition-colors">
                <Play size={12} fill="currentColor" /> {loc.timer_btn_start || 'INITIATE COUNTDOWN'}
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="px-4 py-1.5 bg-red-600 text-white text-[12px] font-black uppercase flex items-center gap-2 hover:bg-red-500 transition-colors">
                <Square size={12} fill="currentColor" /> {loc.timer_btn_stop || 'ABORT TIMER'}
              </button>
            )}
          </div>
        )}

        {/* 1. LOGIC FOR ADMINISTRATORS ONLY */}
        {isAdmin ? (
          <div className="flex flex-col gap-3 w-full">
            {/* UNLOCK button: Now only the admin can use it */}
            <button
              onClick={handleUnlockResults}
              className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-lg hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.4)]">
              {loc.btn_unblock || 'Sblocca Risultati NASA'}
            </button>

            {/* “Go to Leaderboard” button */}
            <button
              onClick={() => {
                setPrevView('admin');
                setView('leaderboard');
              }}
              className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-lg hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.4)] flex items-center justify-center gap-2">
              <Info size={20} />
              {loc.admin_btn_results || 'Visualizza Classifica'}
            </button>
          </div>
        ) : (
          /* 2. LOGIC FOR PLAYERS AND THE COMMANDER */
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* The captain and players see the request button */}
            <button
              onClick={async () => {
                const unlocked = await checkTeamStatusAction(teamId);
                if (unlocked) {
                  setView('results');
                } else {
                  triggerModal('alert', ModalMode.IDLE, loc.msg_modal_nocommandr || "ACCESSO NEGATO: In attesa dell'autorizzazione finale.");
                }
              }}
              className="w-full flex-1 border-2 border-[#00ff41] text-[#00ff41] py-4 font-black uppercase text-sm hover:bg-[#00ff41] hover:text-black transition-all">
              {loc.btn_request || 'Richiedi Risultati NASA'}
            </button>

            {/* Display the “Become Commander” button only if he is NOT YET in the database and the CURRENT USER is not him */}
            {!teamsList.find(t => t.id === teamId)?.has_commander && !isCommander && (
              <button
                onClick={handleBecomeCommander}
                className="w-full flex-1 border-2 border-amber-500 text-amber-500 py-4 font-black uppercase text-sm hover:bg-amber-500 hover:text-black transition-all">
                {loc.btn_commander || 'Assumi il Comando'}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
