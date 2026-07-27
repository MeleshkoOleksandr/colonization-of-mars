'use client';
import React from 'react';
import { ArrowLeft, RefreshCcw, Maximize2, Minimize2, Clock, Play, Square, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameResult, Team, Localization, ModalMode, ModalType } from '../logic';

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
  triggerModal: (type: ModalType, mode: ModalMode, message: string, action?: () => void) => void;
  checkTeamStatusAction: (id: number) => Promise<boolean>;
  handleBecomeCommander: () => void;
  BUTTON_STYLES: any;
  // --- Timer
  timerInputMin: number;
  setTimerInputMin: (val: number) => void;
  timerInputSec: number;
  setTimerInputSec: (val: number) => void;
  timeLeft: number | null;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  activeTimerDuration: number;
  isTimerMinimized: boolean;
  setIsTimerMinimized: (val: boolean) => void;

  updateTeamCommUnlockAction: (id: number, status: boolean) => Promise<void>;
  setModal: (val: any) => void;
  showArchivedTeams: boolean;
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
  timerInputMin,
  setTimerInputMin,
  timerInputSec,
  setTimerInputSec,
  timeLeft,
  isTimerRunning,
  startTimer,
  stopTimer,
  activeTimerDuration,
  isTimerMinimized,
  setIsTimerMinimized,
  updateTeamCommUnlockAction,
  setModal,
  showArchivedTeams,
}: DiscussionListViewProps) => {
  const uniqueTeamIds: number[] = Array.from(new Set(discussionResults.map(r => r.team_id))).sort((a, b) => a - b);
  const isCommander = username.startsWith('Commander');

  // Get the list of teams that are currently visible based on the admin filter
  const activeTeamsInFilter = teamsList.filter(t => {
    // RULE #1: The command must match the current mode (Active/Archive)
    if (isAdmin && t.is_archived !== showArchivedTeams) return false;
    // RULE #2: Compatibility with the selector
    if (isAdmin) {
      if (adminTeamFilter === 'all') return true;
      if (adminTeamFilter.startsWith('team:')) return t.id === parseInt(adminTeamFilter.split(':')[1]);
      if (adminTeamFilter.startsWith('scen:')) return t.current_scenario === adminTeamFilter.split(':')[1];
      return false;
    }
    return t.id === teamId;
  });

  //  Check if the "Commander" feature is enabled for ALL teams in the current selection
  const isAllCommUnlocked = activeTeamsInFilter.length > 0 && activeTeamsInFilter.every(t => !!t.is_comm_unlocked);
  //  Check whether there is at least one designated commander in the selected teams
  const anyTeamHasCommander = activeTeamsInFilter.some(t => !!t.has_commander);
  // Activate/diactivale commander button
  const isCommBtnDisabled = isAllCommUnlocked || anyTeamHasCommander;

  // Have all the participants on the current list responded?
  const allAnswered = discussionResults.length > 0 && discussionResults.every(r => r.score !== -1);
  // Have the results been released yet
  const isTargetUnlocked = activeTeamsInFilter.length > 0 && activeTeamsInFilter.every(t => t.is_unlocked);
  // FINAL WARNING FLAG
  const showDiscussionWarning = isAdmin && allAnswered && !isTargetUnlocked;
  // Unlock results button activity
  const isUnlockBtnDisabled = isTargetUnlocked;

  const handleUnlockWithSystemAlert = () => {
    triggerModal(
      'confirm',
      ModalMode.IDLE,
      `> > MESSAGGIO SISTEMA\n\nMISSION COMPLETE: I RISULTATI FINALI SONO ORA ACCESSIBILI PER TUTTA LA SQUADRA.\n\nSicuro di voler procedere con la decriptazione dei dati?`,
      async () => {
        await handleUnlockResults();
        setModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    );
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

  /**
   * HANDLER: Toggle Commander Lock
   */
  const handleToggleCommanderLock = async () => {
    try {
      const newState = true;
      for (const t of activeTeamsInFilter) {
        await updateTeamCommUnlockAction(t.id, newState);
      }
      setTeamsList(await getTeamsAction());
      // show you the confirmation
      triggerModal(
        'alert',
        ModalMode.IDLE,
        loc.msg_comm_unlocked_success || 'Autorizzazione concessa. I coloni могут теперь номинировать одного Командира.'
      );

      console.log(`SYSTEM: Commander selection ENABLED.`);
    } catch (e) {
      console.error('Failed to toggle commander lock:', e);
    }
  };

  return (
    <>
      {/* TIMER VISUAL EFFECT */}
      <AnimatePresence>
        {isTimerRunning && timeLeft !== null && (
          <motion.div
            className="fixed top-0 left-0 w-full z-150 flex flex-col items-center overflow-hidden border-[#00ff41]/30 backdrop-blur-md pointer-events-none"
            initial={{ opacity: 0, height: 0 }}
            animate={{
              height: isTimerMinimized ? '70px' : '100vh',
              borderBottomWidth: isTimerMinimized ? '2px' : '0px',
              backgroundColor: isTimerMinimized ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.85)',
              opacity: 1,
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            {/* Timer content*/}
            <div
              className={`relative w-full h-full flex flex-col items-center pointer-events-auto ${isTimerMinimized ? 'justify-center' : 'justify-center'}`}>
              {/* MINIMIZE / MAXIMIZE BUTTON */}
              <button
                onClick={() => setIsTimerMinimized(!isTimerMinimized)}
                className="absolute top-4 right-4 z-160 text-[#00ff41]/50 hover:text-[#00ff41] p-2 transition-all active:scale-90"
                title={isTimerMinimized ? loc.timer_expand || 'Expand' : loc.timer_minimize || 'Minimize'}>
                {isTimerMinimized ? <Maximize2 size={20} /> : <Minimize2 size={24} />}
              </button>

              {/* MAIN BLOCK : NUMBER AND TEXT */}
              <div
                className={`flex flex-col items-center transition-all duration-500 ${isTimerMinimized ? 'scale-[0.4] md:scale-[0.5]' : 'scale-100'}`}>
                {!isTimerMinimized && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    className="text-[#00ff41] font-black uppercase tracking-[0.8em] text-[10px] md:text-sm mb-4 animate-pulse text-center">
                    — {loc.timer_overlay_title || 'MISSION DEBRIEFING COUNTDOWN'} —
                  </motion.div>
                )}

                <div
                  className={`font-black font-mono text-[#00ff41] leading-none drop-shadow-[0_0_20px_#00ff41] flex items-center gap-4 ${
                    isTimerMinimized ? 'text-8xl' : 'text-8xl md:text-[12rem]'
                  }`}>
                  <span className="tabular-nums">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {!isTimerMinimized && (
                  <div className="w-full max-w-2xl h-1 bg-[#00ff41]/10 mt-8 relative overflow-hidden">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: activeTimerDuration, ease: 'linear' }}
                      className="absolute inset-0 bg-[#00ff41] shadow-[0_0_15px_#00ff41]"
                    />
                  </div>
                )}
              </div>

              {/* Additional text */}
              {isTimerMinimized && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:block">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00ff41]/40 animate-pulse">
                    {loc.timer_overlay_title || 'MISSION DEBRIEFING COUNTDOWN'}
                  </span>
                </div>
              )}
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
                  const isCommEntry = res.username.startsWith('Commander');
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
                        className={`${btnColorClass} text-black px-4 py-1 text-[10px] font-black hover:bg-white uppercase`}>
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
      <div className="flex flex-col gap-2 mt-8">
        {/* Timer */}
        {isAdmin && (
          <div className="mb-4 border-2 border-[#00ff41]/20 bg-black/60 flex items-stretch p-1 gap-1 w-full shadow-[inset_0_0_10px_rgba(0,255,65,0.05)]">
            <div className="flex items-center gap-4 flex-1 px-3 py-1 bg-black/40 border border-[#00ff41]/10">
              <div className="flex flex-col items-center justify-center shrink-0 min-w-12.5">
                <Clock size={16} className={`${isTimerRunning ? 'text-[#00ff41] animate-pulse' : 'text-[#00ff41]/30'}`} />
                <span className="text-[8px] uppercase opacity-50 font-black tracking-tighter leading-none mt-1">
                  {loc.timer_control_label || 'Duration'}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={timerInputMin}
                    onChange={e => setTimerInputMin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 bg-black border-b border-[#00ff41]/50 text-[#00ff41] text-base text-center outline-none focus:bg-[#00ff41]/10 transition-colors"
                  />
                  <span className="text-[10px] opacity-40 uppercase font-bold">m.</span>
                </div>

                <span className="text-base font-black text-[#00ff41] opacity-30">:</span>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={timerInputSec}
                    onChange={e => setTimerInputSec(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-10 bg-black border-b border-[#00ff41]/50 text-[#00ff41] text-base text-center outline-none focus:bg-[#00ff41]/10 transition-colors"
                  />
                  <span className="text-[10px] opacity-40 uppercase font-bold">s.</span>
                </div>
              </div>
            </div>

            {!isTimerRunning ? (
              <button
                onClick={startTimer}
                className="px-6 md:px-10 bg-[#00ff41] text-black font-black uppercase text-[12px] hover:bg-white transition-all flex items-center justify-center active:scale-95 shrink-0">
                <Play size={12} fill="currentColor" />
                {loc.timer_btn_start || 'Start'}
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="px-6 md:px-10 bg-red-600 text-white font-black uppercase text-[12px] hover:bg-red-500 transition-all flex items-center justify-center active:scale-95 shrink-0">
                <Square size={12} fill="currentColor" />
                {loc.timer_btn_stop || 'Abort'}
              </button>
            )}
          </div>
        )}

        {/* Pulsing text */}
        {showDiscussionWarning && (
          <div className="text-center py-2 border border-red-600 bg-red-950 animate-pulse">
            <span className="text-[14px] text-red-600 font-black uppercase tracking-widest">
              {loc.msg_conduct_discussion || 'Conduct group discussion before unlocking results'}
            </span>
          </div>
        )}

        {/* --- ADMIN COMMAND PANEL --- */}
        {isAdmin ? (
          <div className="flex flex-col gap-3 w-full">
            {/* 1. ENABLE COMMANDER BUTTON */}
            <button
              onClick={handleToggleCommanderLock}
              disabled={isCommBtnDisabled} // Block the button
              className={`w-full py-3 font-black uppercase text-lg transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                isCommBtnDisabled
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' // Inctive
                  : 'bg-amber-500 text-black hover:bg-white transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)]' // Active
              }`}>
              {/* Text*/}
              {anyTeamHasCommander
                ? loc.btn_comm_assigned || 'Comandante Assegnato'
                : isAllCommUnlocked
                  ? loc.btn_comm_waiting || 'In attesa di selezione...'
                  : adminTeamFilter.startsWith('scen:')
                    ? 'Abilita Comandanti Scenario'
                    : 'Abilita selezione Comandante'}
            </button>

            {/* 2. UNLOCK RESULTS (Calls your confirmation modal logic) */}
            <button
              onClick={handleUnlockWithSystemAlert}
              disabled={isUnlockBtnDisabled} // Lock the button
              className={`w-full py-3 font-black uppercase text-lg transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                isUnlockBtnDisabled
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' // Inctive
                  : 'bg-amber-500 text-black py-3  hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.4)]' // Active
              }`}>
              {/* Динамический текст */}
              {isTargetUnlocked ? loc.btn_results_unlocked || 'Risultati Sbloccati' : loc.btn_unblock || 'Sblocca Risultati NASA'}
            </button>

            {/* 3. LEADERBOARD ACCESS */}
            <button
              onClick={() => {
                setPrevView('admin');
                setView('leaderboard');
              }}
              className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-lg hover:bg-white transition-colors flex items-center justify-center gap-2">
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
