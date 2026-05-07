'use client';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { X, Copy, Download } from 'lucide-react';

import { CRTWrapper } from '../components/CRTWrapper';
import { RetroModal } from '../components/RetroModal';
import { AnalysisSequence } from '../components/AnalysisSequence';
import { exportToCSV, downloadQRCode } from '../utils/exportUtils';
import { useMarsMission } from '../hooks/useMarsMission';

import { LoginView } from '../views/LoginView';
import { GameView } from '../views/GameView';
import { StoryView } from '../views/StoryView';
import { ResultsView } from '../views/ResultsView';
import { UserDetailView } from '../views/UserDetailView';
import { LeaderboardView } from '../views/LeaderboardView';
import { DiscussionListView } from '../views/DiscussionListView';
import { AdminView } from '../views/AdminView';

/**
 * SERVER ACTIONS IMPORT
 * These functions bridge the Client-side UI with the Server-side Database (Postgres).
 */
import { getTeamsAction, getResultsAction, updateTeamStatusAction, updateCommanderStatusAction, checkTeamStatusAction } from './actions';

// Import all INTERFACES & TYPES
import { ModalMode, BUTTON_STYLES } from '../types';

// --- CONSTANTS FOR ADMIN MODE ---
const ADMIN_PASSWORD = 'adm'; // Password to prevent players from seeing game results
const ADMIN_USER = 'admin';

// --- MAIN APPLICATION LOGIC ---
export default function MarsSurvivalGame() {
  // This constant is a link to file where all the application logic is stored
  const app = useMarsMission(ADMIN_USER, ADMIN_PASSWORD);
  /**
   * VIEW ENGINE
   * Determines which screen to render into the CRTWrapper.
   */
  let content;
  if (app.view === 'login') {
    content = (
      <LoginView
        loc={app.loc}
        story={app.story}
        allResults={app.allResults}
        teamsList={app.teamsList}
        scenarios={app.scenarios}
        teamId={app.teamId}
        setTeamId={app.setTeamId}
        username={app.username}
        setUsername={app.setUsername}
        handleStart={app.handleStart}
      />
    );
  } else if (app.view === 'story') {
    content = <StoryView story={app.story} loc={app.loc} setView={app.setView} />;
  } else if (app.view === 'game') {
    content = (
      <GameView
        username={app.username}
        currentTeamName={app.currentTeamName}
        items={app.items}
        setItems={app.setItems}
        finishGame={app.finishGame}
        loc={app.loc}
      />
    );
  } else if (app.view === 'discussion-list') {
    content = (
      <DiscussionListView
        loc={app.loc}
        isAdmin={app.isAdmin}
        username={app.username}
        teamId={app.teamId}
        adminTeamFilter={app.adminTeamFilter}
        teamsList={app.teamsList}
        discussionResults={app.discussionResults}
        setIsRefreshing={app.setIsRefreshing}
        isRefreshing={app.isRefreshing}
        getResultsAction={getResultsAction}
        setAllResults={app.setAllResults}
        setSelectedUserDetail={app.setSelectedUserDetail}
        setShowDeltas={app.setShowDeltas}
        setPrevView={app.setPrevView}
        setView={app.setView}
        updateTeamStatusAction={updateTeamStatusAction}
        getTeamsAction={getTeamsAction}
        setTeamsList={app.setTeamsList}
        triggerModal={app.triggerModal}
        checkTeamStatusAction={checkTeamStatusAction}
        handleBecomeCommander={app.handleBecomeCommander}
        BUTTON_STYLES={BUTTON_STYLES}
      />
    );
  } else if (app.view === 'results') {
    content = (
      <ResultsView
        loc={app.loc}
        username={app.username}
        currentTeamName={app.currentTeamName}
        currentScore={app.currentScore}
        getScoreMessage={app.getScoreMessage}
        staticItems={app.staticItems}
        setView={app.setView}
      />
    );
  } else if (app.view === 'leaderboard') {
    content = (
      <LeaderboardView
        loc={app.loc}
        isAdmin={app.isAdmin}
        title={
          app.adminTeamFilter === 'all'
            ? app.loc.filter_all
            : (app.adminTeamFilter.startsWith('scen:')
                ? app.scenarios.find(s => s.id === app.adminTeamFilter.split(':')[1])?.name
                : app.teamsList.find(t => t.id === parseInt(app.adminTeamFilter.split(':')[1]))?.name) || ''
        }
        leaderboardResults={app.leaderboardResults}
        exportToCSV={() => exportToCSV(app.leaderboardResults, app.loc)}
        isRefreshing={app.isRefreshing}
        setIsRefreshing={app.setIsRefreshing}
        getResultsAction={getResultsAction}
        setAllResults={app.setAllResults}
        setSelectedUserDetail={app.setSelectedUserDetail}
        setShowDeltas={app.setShowDeltas}
        setPrevView={app.setPrevView}
        setView={app.setView}
        triggerModal={app.triggerModal}
      />
    );
  } else if (app.view === 'user-detail' && app.selectedUserDetail) {
    content = (
      <UserDetailView
        selectedUserDetail={app.selectedUserDetail}
        staticItems={app.staticItems}
        showDeltas={app.showDeltas}
        prevView={app.prevView}
        setView={app.setView}
        loc={app.loc}
      />
    );
  } else if (app.view === 'admin') {
    content = (
      <AdminView
        loc={app.loc}
        availableLangs={app.availableLangs}
        currentLangId={app.currentLangId}
        setCurrentLangId={app.setCurrentLangId}
        teamsList={app.teamsList}
        scenarios={app.scenarios}
        allResults={app.allResults}
        adminTeamFilter={app.adminTeamFilter}
        setAdminTeamFilter={app.setAdminTeamFilter}
        updateTeamStatusAction={updateTeamStatusAction}
        updateCommanderStatusAction={updateCommanderStatusAction}
        getTeamsAction={getTeamsAction}
        setTeamsList={app.setTeamsList}
        handleDeleteTeam={app.handleDeleteTeam}
        handleAddTeam={app.handleAddTeam}
        getResultsAction={getResultsAction}
        setAllResults={app.setAllResults}
        handleWipeEverything={app.handleWipeEverything}
        handleDeleteResult={app.handleDeleteResult}
        handleAddSinglePlayer={app.handleAddSinglePlayer}
        isRefreshing={app.isRefreshing}
        setIsRefreshing={app.setIsRefreshing}
        isAutoRefresh={app.isAutoRefresh}
        setIsAutoRefresh={app.setIsAutoRefresh}
        newTeamName={app.newTeamName}
        setNewTeamName={app.setNewTeamName}
        selectedScenarioForNewTeam={app.selectedScenarioForNewTeam}
        setSelectedScenarioForNewTeam={app.setSelectedScenarioForNewTeam}
        setShareData={app.setShareData}
        setPrevView={app.setPrevView}
        setView={app.setView}
        triggerModal={app.triggerModal}
      />
    );
  }
  return (
    <CRTWrapper>
      {content}
      {/* 1. ANALYSIS ANIMATION LAYER */}
      {app.isAnalyzing && (
        <AnalysisSequence
          onComplete={() => {
            app.setIsAnalyzing(false); // Hide animation
            app.setView('discussion-list'); // Show results
          }}
        />
      )}

      {/* 2. MODAL LAYER */}
      <RetroModal
        isOpen={app.modal.isOpen}
        type={app.modal.type}
        message={app.modal.message}
        value={app.modal.value}
        onClose={() => app.setModal(prev => ({ ...prev, isOpen: false, mode: ModalMode.IDLE }))}
        onConfirm={() => {
          switch (app.modal.mode) {
            case ModalMode.ADMIN_AUTH:
              app.executeAdminAuth();
              break;
            case ModalMode.ADD_TEAM:
              app.executeAddTeam();
              break;
            case ModalMode.ADD_PLAYER:
              app.executeAddSinglePlayer();
              break;
            // For all alerts and confirmations (where mode === ModalMode.IDLE)
            default:
              app.modal.action(); // It simply closes the window or performs a simple action
              break;
          }
        }}
        onChange={val => app.setModal(prev => ({ ...prev, value: val }))}
        loc={app.loc}
      />

      {/* QR ACCESS MODAL */}
      {app.shareData && (
        <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm border-4 border-[#00ff41] bg-black p-6 shadow-[0_0_50px_rgba(0,255,65,0.4)] text-center relative">
            <button onClick={() => app.setShareData(null)} className="absolute top-2 right-2 text-[#00ff41]/50 hover:text-[#00ff41]">
              <X size={20} />
            </button>

            <h3 className="text-[#00ff41] font-black uppercase mb-6 italic border-b border-[#00ff41]/30 pb-2">
              {app.loc.modal_msg_qr}
              {app.shareData.name}
            </h3>

            {/* QR CODE CANVAS */}
            <div className="bg-[#00ff41] p-3 inline-block mb-6 shadow-[0_0_20px_rgba(0,255,65,0.3)] overflow-hidden">
              <QRCodeCanvas
                id="qr-code-canvas"
                value={app.shareData.url}
                size={1000} // Big size for saving as image
                level={'H'}
                bgColor={'#00ff41'}
                fgColor={'#000000'}
                style={{ width: '200px', height: '200px' }} // And we'll show 200px on the screen
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-[#001100] border border-[#00ff41]/30 p-2 overflow-hidden">
                <span className="text-[9px] text-[#00ff41] truncate flex-1 font-mono opacity-70">{app.shareData.url}</span>
                <button
                  onClick={() => {
                    if (app.shareData?.url) {
                      navigator.clipboard.writeText(app.shareData.url);
                    }
                  }}
                  className="text-[#00ff41] hover:text-white">
                  <Copy size={16} />
                </button>
              </div>

              <button
                onClick={() => {
                  if (app.shareData) {
                    downloadQRCode(app.shareData.name, app.loc);
                  }
                }}
                className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-xs hover:bg-white transition-colors flex items-center justify-center gap-2">
                <Download size={16} /> {app.loc.admin_msg_qrsave} (PNG)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </CRTWrapper>
  );
}
