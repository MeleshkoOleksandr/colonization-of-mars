'use client';
import { AnimatePresence } from 'framer-motion';

import { CRTWrapper } from '../components/CRTWrapper';
import { RetroModal } from '../components/RetroModal';
import { QRModal } from '../components/QRModal';
import { AnalysisSequence } from '../components/AnalysisSequence';
import { exportToCSV, downloadQRCode } from '../utils/exportUtils';
import { useMarsMission } from '../logic/useMarsMission';

import { StandbyView } from '../views/StandbyView';
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
import { ModalMode, BUTTON_STYLES } from '../logic';

// --- CONSTANTS FOR ADMIN MODE ---
const ADMIN_PASSWORD = 'adm'; // Password to prevent players from seeing game results

// --- MAIN APPLICATION LOGIC ---
export default function MarsSurvivalGame() {
  // This constant is a link to file where all the application logic is stored
  const app = useMarsMission(ADMIN_PASSWORD);
  /**
   * VIEW ENGINE
   * Determines which screen to render into the CRTWrapper.
   */
  let content;
  if (!app.isInitialized) {
    //Check if init is passed
    content = (
      <div className="flex items-center justify-center py-40 animate-pulse">
        <span className="text-[#00ff41] text-xs tracking-[0.5em] uppercase">Initializing System...</span>
      </div>
    );
  } else if (app.view === 'standby') {
    content = <StandbyView loc={app.loc} onAdminLogin={app.openAdminLogin} />;
  }
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
        onAdminLogin={app.openAdminLogin}
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
        timerInputMin={app.timerInputMin}
        setTimerInputMin={app.setTimerInputMin}
        timerInputSec={app.timerInputSec}
        setTimerInputSec={app.setTimerInputSec}
        timeLeft={app.timeLeft}
        isTimerRunning={app.isTimerRunning}
        startTimer={app.startTimer}
        stopTimer={app.stopTimer}
        activeTimerDuration={app.activeTimerDuration}
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
        handleFinishMission={app.handleFinishMission} 
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
        handleToggleArchive={app.handleToggleArchive}
        setShowArchivedTeams={app.setShowArchivedTeams}
        showArchivedTeams={app.showArchivedTeams}
        handleLogout={app.handleLogout}
        handlePasswordChangeRequest={app.handlePasswordChangeRequest}
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
        mode={app.modal.mode}
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
            case ModalMode.CHANGE_PASSWORD:
              app.executePasswordChange();
              break;
            default: // For all other alerts and confirmations
              app.modal.action(); // It simply closes the window or performs a simple action
              break;
          }
        }}
        onChange={val => app.setModal(prev => ({ ...prev, value: val }))}
        loc={app.loc}
      />

      {/* QR ACCESS MODAL */}
      <AnimatePresence>
        {app.shareData && (
          <QRModal shareData={app.shareData} loc={app.loc} setShareData={app.setShareData} onDownload={name => downloadQRCode(name, app.loc)} />
        )}
      </AnimatePresence>
    </CRTWrapper>
  );
}
