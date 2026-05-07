"use client";
import React from "react";
import { ArrowLeft, RefreshCcw, ChevronRight, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { GameResult, Team, Localization, ModalMode } from "../types";

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
  loc, isAdmin, username, teamId, adminTeamFilter, teamsList, discussionResults,
  setIsRefreshing, isRefreshing, getResultsAction, setAllResults,
  setSelectedUserDetail, setShowDeltas, setPrevView, setView,
  updateTeamStatusAction, getTeamsAction, setTeamsList, triggerModal,
  checkTeamStatusAction, handleBecomeCommander, BUTTON_STYLES
}: DiscussionListViewProps) => {

  const uniqueTeamIds: number[] = Array.from(new Set(discussionResults.map(r => r.team_id))).sort((a, b) => a - b);
  const isCommander = username === "Commander";
  const currentTeam = teamsList.find(t => t.id === (isAdmin ? parseInt(adminTeamFilter.split(":")[1]) : teamId));

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

        {/* --- BOTTOM BUTTON PANEL  --- */}
        <div className="space-y-4">
          {/* If it's an admin or a commander — the unlock button */}
          {isAdmin || isCommander ? (
            <button
              onClick={async () => {
                // If it's an admin, we try to extract the ID from the string “team:123”
                // If it's a player, we use their numeric teamId
                const isAdmin = username.toLowerCase() === 'admin';
                let teamIdToUnlock: number = 0;

                if (isAdmin) {
                  if (adminTeamFilter.startsWith('team:')) {
                    teamIdToUnlock = parseInt(adminTeamFilter.split(':')[1]);
                  } else if (adminTeamFilter.startsWith('scen:')) {
                    // Optional: if you want to unlock the entire script
                    return triggerModal('alert', ModalMode.IDLE, 'Seleziona una squadra specifica per sbloccare i risultati.');
                  }
                } else {
                  teamIdToUnlock = teamId;
                }
                // Security check
                if (teamIdToUnlock === 0) return triggerModal('alert', ModalMode.IDLE, 'Seleziona un team.');

                // CALL ACTION (Now pass a number)
                await updateTeamStatusAction(teamIdToUnlock, true);

                // Refresh data
                setTeamsList(await getTeamsAction());

                if (username === 'Commander') {
                  setView('results');
                } else {
                  triggerModal('alert', ModalMode.IDLE, loc.msg_modal_missioncomlite);
                }
              }}
              className={BUTTON_STYLES}>
              {loc.btn_unblock}
            </button>
          ) : (
            /* For a regular player, there are two buttons: “Request Results” and “Become Commander” */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={async () => {
                  const unlocked = await checkTeamStatusAction(teamId);
                  if (unlocked) setView('results');
                  else triggerModal('alert', ModalMode.IDLE, loc.msg_modal_nocommandr);
                }}
                className="border-2 border-[#00ff41] text-[#00ff41] py-4 font-black uppercase text-sm hover:bg-[#00ff41] hover:text-black transition-all">
                {loc.btn_request}
              </button>

              {/* We display the “Become Commander” button only if it isn't already there */}
              {!currentTeam?.has_commander && (
                <button
                  onClick={handleBecomeCommander}
                  className="border-2 border-amber-500 text-amber-500 py-4 font-black uppercase text-sm hover:bg-amber-500 hover:text-black transition-all">
                  {loc.btn_commander}
                </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};