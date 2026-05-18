'use client';
import React from 'react';
import { ArrowLeft, RefreshCcw, Info } from 'lucide-react';
import { motion } from 'framer-motion';
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
}: DiscussionListViewProps) => {
  const uniqueTeamIds: number[] = Array.from(new Set(discussionResults.map(r => r.team_id))).sort((a, b) => a - b);
  const isCommander = username === 'Commander';

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
                  const isCommander = res.username === 'Commander';
                  const hasResult = res.score !== -1;
                  const btnColorClass = isCommander ? 'bg-amber-500' : hasResult ? 'bg-[#00ff41]' : 'bg-red-600 animate-pulse';

                  return (
                    <div
                      key={res.id}
                      className={`flex justify-between items-center p-3 border ${
                        isCommander
                          ? 'bg-[#38180670] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-[#00ff41]/5 border-[#00ff41]/20'
                      }`}>
                      <div className="flex items-center gap-3">
                        {isCommander && <div className="bg-amber-500 text-black text-[8px] px-1 font-black uppercase">Final Order</div>}
                        <span className={`font-bold uppercase text-xs ${isCommander ? 'text-amber-500' : 'text-[#00ff41]'}`}>{res.username}</span>
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
        {/* CONDITION 1: Logic for the ADMIN or COMMANDER */}
        {isAdmin || isCommander ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUnlockResults}
              className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-lg hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.4)]">
              {loc.btn_unblock}
            </button>

            {/* “Go to Results” button (For ADMIN only) */}
            {isAdmin && (
              <button
                onClick={() => {
                  setPrevView('admin'); // To return to the admin panel from the Leaderboard
                  setView('leaderboard');
                }}
                className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-lg hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.4)] flex items-center justify-center gap-2">
                <Info size={20} />
                {loc.admin_btn_results}
              </button>
            )}
          </div>
        ) : (
          /* CONDITION 2: Logic for REGULAR PLAYERS (two buttons in a row) */
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <button
              onClick={async () => {
                const unlocked = await checkTeamStatusAction(teamId);
                if (unlocked) setView('results');
                else triggerModal('alert', ModalMode.IDLE, loc.msg_modal_nocommandr);
              }}
              className="w-full flex-1 border-2 border-[#00ff41] text-[#00ff41] py-4 font-black uppercase text-sm hover:bg-[#00ff41] hover:text-black transition-all">
              {loc.btn_request}
            </button>

            {/* COMMANDER button (displayed if there is no commander on the team yet) */}
            {!teamsList.find(t => t.id === teamId)?.has_commander && (
              <button
                onClick={handleBecomeCommander}
                className="w-full flex-1 border-2 border-amber-500 text-amber-500 py-4 font-black uppercase text-sm hover:bg-amber-500 hover:text-black transition-all">
                {loc.btn_commander}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
