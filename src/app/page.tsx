'use client';
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { X, Copy, Download } from 'lucide-react';

import { CRTWrapper } from '../components/CRTWrapper';
import { RetroModal } from '../components/RetroModal';
import { AnalysisSequence } from '../components/AnalysisSequence';
import { parseStoryXml } from '../utils/xmlParser';

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
import {
  getTeamsAction,
  saveResultAction,
  getResultsAction,
  deleteTeamAction,
  deleteResultAction,
  deleteAllResultsAction,
  updateTeamStatusAction,
  deleteResultsByTeamAction,
  updateCommanderStatusAction,
  checkCommanderStatusAction,
  addTeamWithPlayersAction,
  updatePlayerResultAction,
  addSinglePlayerAction,
  wipeEntireDatabaseAction,
  checkTeamStatusAction,
} from './actions';

// Import all INTERFACES & TYPES
import { SurvivalItem, GameResult, Team, ModalMode, ModalType, ScoreEvaluation, Language, Localization, PRIMARY_LANG, BUTTON_STYLES } from '../types';

// --- CONSTANTS FOR ADMIN MODE ---
const ADMIN_PASSWORD = 'adm'; // Password to prevent players from seeing game results
const ADMIN_USER = 'admin';

// --- MAIN APPLICATION LOGIC ---
export default function MarsSurvivalGame() {
  //  STATE MANAGEMENT
  const [view, setView] = useState<'login' | 'story' | 'game' | 'results' | 'admin' | 'leaderboard' | 'user-detail' | 'discussion-list'>('login');
  const [prevView, setPrevView] = useState<'leaderboard' | 'admin' | 'results' | 'discussion-list'>('leaderboard');

  // Game Content from XML and scenarios
  const [story, setStory] = useState({ title: 'Loading...', plot: '', language: PRIMARY_LANG, photo: 'login_page.png' });
  const [items, setItems] = useState<SurvivalItem[]>([]);
  const [staticItems, setStaticItems] = useState<SurvivalItem[]>([]);
  const [evaluations, setEvaluations] = useState<ScoreEvaluation[]>([]);
  //List of all available scripts from JSON
  const [scenarios, setScenarios] = useState<{ id: string; file: string; name: string; language: string }[]>([]);
  //A new state for storing the selected script in the admin panel
  const [selectedScenarioForNewTeam, setSelectedScenarioForNewTeam] = useState('mars_it');

  // Database Data
  const [username, setUsername] = useState('');
  const [allResults, setAllResults] = useState<GameResult[]>([]);
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<number>(0);

  // Scoring & UI Toggles
  const [selectedUserDetail, setSelectedUserDetail] = useState<GameResult | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDeltas, setShowDeltas] = useState<boolean>(true);
  const [adminTeamFilter, setAdminTeamFilter] = useState<string>('all');
  const [newTeamName, setNewTeamName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // QR Code
  const [shareData, setShareData] = useState<{ name: string; url: string } | null>(null);

  // LOCALIZATION STATES
  const [availableLangs, setAvailableLangs] = useState<Language[]>([]);
  const [currentLangId, setCurrentLangId] = useState<string>(PRIMARY_LANG); // Default
  const [loc, setLoc] = useState<Localization>({}); // The current dictionary

  // Computed helper
  const currentTeamName = teamsList.find(t => t.id === teamId)?.name || 'NASA';

  // Auto Refresh timer component:
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const resultsSnapshotRef = useRef<GameResult[]>([]);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    mode: ModalMode;
    message: string;
    value: string;
    action: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    mode: ModalMode.IDLE,
    message: '',
    value: '',
    action: () => {},
  });

  const triggerModal = (type: ModalType, mode: ModalMode, message: string, action?: () => void) => {
    setModal({
      isOpen: true,
      type,
      mode,
      message,
      value: '',
      action: action || (() => setModal(prev => ({ ...prev, isOpen: false }))),
    });
  };

  /**
   * INITIALIZATION
   * This synchronizes both the static XML story content
   * and the dynamic Database records (Teams & Results).
   */
  useEffect(() => {
    async function initializeSystem() {
      console.log('SYSTEM: Initializing...');
      try {
        // 1. We load everything we need from the files and the database at the same time
        const [resScen, resLang, teams, results] = await Promise.all([
          fetch('/data/scenarios.json').then(r => r.json()),
          fetch('/languages/localization.json').then(r => r.json()),
          getTeamsAction(),
          getResultsAction(),
        ]);

        setScenarios(resScen);
        setAvailableLangs(resLang);
        setTeamsList(teams);
        setAllResults(results);

        // 2. Processing URL parameters
        const params = new URLSearchParams(window.location.search);
        const teamFromUrl = params.get('team');
        const userFromUrl = params.get('user');
        const langFromUrl = params.get('lang');

        // Language set
        if (langFromUrl) {
          console.log('SYSTEM: Setting language from URL:', langFromUrl);
        }

        //  Let's set the command
        if (teamFromUrl) {
          setTeamId(Number(teamFromUrl));
        }

        if (userFromUrl) {
          setUsername(userFromUrl);
          // Processing URL parameters
          const player = results.find(r => r.username === userFromUrl && r.score === -1);
          if (player) setTeamId(player.team_id);
        }

        console.log('SYSTEM: Ready.');
      } catch (error) {
        console.error('CRITICAL ERROR:', error);
        triggerModal('alert', ModalMode.IDLE, loc.msg_modal_sinx);
      }
    }
    initializeSystem();
  }, []); // Run only once on mount

  /**
   * AUTO-SYNC
   * Refreshes results whenever the user enters the Leaderboard or Admin panel.
   */
  useEffect(() => {
    if (view === 'leaderboard' || view === 'admin' || view === 'discussion-list') {
      async function syncData() {
        try {
          console.log(`SYSTEM: Auto-syncing data for view [${view}]...`);
          const freshResults = await getResultsAction();
          setAllResults(freshResults);

          // If we are on the leaderboard, also refresh teams to catch status changes (is_unlocked)
          if (view === 'leaderboard') {
            const freshTeams = await getTeamsAction();
            setTeamsList(freshTeams);
          }
        } catch (error) {
          console.error('SYSTEM ERROR: Auto-sync failed', error);
        }
      }
      syncData();
    }
  }, [view]); // This effect runs every time 'view' changes

  /**
   * SCENARIO LOADER
   * Automatically reloads XML content when the team (and its scenario) changes.
   */
  useEffect(() => {
    // 1. DETERMINE THE TARGET COMMAND ID
    // If we're viewing a player's details, we use their team. If not, we use the player's current team.
    const targetTeamId = selectedUserDetail && (view === 'user-detail' || view === 'discussion-list') ? selectedUserDetail.team_id : teamId;

    // 2. Search for a team in the list
    const targetTeam = teamsList.find(t => t.id === targetTeamId);

    // 3. We're looking for a script configuration for this command
    const foundConfig = scenarios.find(s => s.id === targetTeam?.current_scenario);

    if (targetTeamId !== 0 && foundConfig) {
      const scenarioFile = foundConfig.file;
      const scenarioName = foundConfig.name;

      const loadSpecificScenario = async () => {
        try {
          console.log(`SYSTEM: Syncing mission data for [${scenarioName}]...`);
          const response = await fetch(`/data/${scenarioFile}`);
          if (!response.ok) throw new Error('Scenario XML not found');

          const xmlString = await response.text();
          const parsedData = parseStoryXml(xmlString);

          // We'll sync all the data from the XML
          setCurrentLangId(parsedData.story.language);
          setStory(parsedData.story);
          setStaticItems(parsedData.items);
          setEvaluations(parsedData.evaluations);

          // only if we're in game mode
          if (view === 'game' || view === 'login') {
            setItems([...parsedData.items].sort(() => Math.random() - 0.5));
          }
        } catch (err) {
          console.error('Failed to load scenario XML:', err);
        }
      };

      loadSpecificScenario();
    }
    // selectedUserDetail for the XML loads when any player is clicked
  }, [teamId, selectedUserDetail, view, scenarios, teamsList]);

  useEffect(() => {
    async function init() {
      // Load scenario manifest
      const res = await fetch('/data/scenarios.json');
      if (!res.ok) throw new Error('Manifest not found');
      const manifest = await res.json();
      setScenarios(manifest);

      // LOADING THE LIST OF LANGUAGES
      const resLang = await fetch('/languages/localization.json');
      const langManifest = await resLang.json();
      setAvailableLangs(langManifest);

      // Load DB records
      const [teams, results] = await Promise.all([getTeamsAction(), getResultsAction()]);
      setTeamsList(teams);
      setAllResults(results);
    }
    init();
  }, []);

  // --- EFFECT: DICTIONARY LOADER ---
  // Triggers every time currentLangId changes
  useEffect(() => {
    async function loadDictionary() {
      try {
        const response = await fetch(`/languages/${currentLangId}.json`);
        const data = await response.json();
        setLoc(data); // We are updating all the text in the interface
      } catch (e) {
        console.error('Lang Load Error', e);
      }
    }
    loadDictionary();
  }, [currentLangId]);

  /**
   * UNIVERSAL DATA FILTERING LOGIC
   * Filters results based on "all", "scen:id", or "team:id"
   */
  const isAdmin = username.toLowerCase() === 'admin';

  const getEffectiveResults = () => {
    // 1. If it's a regular PLAYER, we always show only their team
    if (!isAdmin) {
      return allResults.filter(r => r.team_id === teamId);
    }

    // 2. If this is ADMIN, we'll follow your algorithm for strings
    if (adminTeamFilter === 'all') return allResults;

    if (adminTeamFilter.startsWith('scen:')) {
      const targetScenId = adminTeamFilter.split(':')[1];
      return allResults.filter(r => {
        const team = teamsList.find(t => t.id === r.team_id);
        return team?.current_scenario === targetScenId;
      });
    }

    if (adminTeamFilter.startsWith('team:')) {
      const targetTeamId = parseInt(adminTeamFilter.split(':')[1]);
      return allResults.filter(r => r.team_id === targetTeamId);
    }

    return allResults;
  };

  // 3. We use this function to create lists for each screen:
  // For the main admin table (sorted by date)
  const displayedResults = getEffectiveResults().sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  // For the discussion list (sorted by Commander -> Name)
  const discussionResults = getEffectiveResults().sort((a, b) => {
    if (a.username === 'Commander') return -1;
    if (b.username === 'Commander') return 1;
    return a.username.localeCompare(b.username);
  });

  // For the leaderboard
  const leaderboardResults = getEffectiveResults().sort((a, b) => {
    // 1. If one player has finished and the other hasn't, the one who has finished always ranks higher
    if (a.score === -1 && b.score !== -1) return 1;
    if (a.score !== -1 && b.score === -1) return -1;
    // 2. If both are finished, sort them from best to worst (lower = better)
    return a.score - b.score;
  });

  // Audio playback function
  const playBeep = () => {
    const audio = new Audio('/sounds/soft_beep.wav');
    audio.volume = 0.4; // Не слишком громко
    audio.play().catch(e => console.log('Audio play blocked by browser policy'));
  };

  const downloadQRCode = () => {
    const qrCanvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!qrCanvas || !shareData) return;

    // 1. Dimensions
    const qrSize = 1250;
    const padding = 100; // Indents on the sides
    const headerSpace = 250; // Space for text at the top
    // Creating the final canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Final Dimensions
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + headerSpace + padding;

    // 2. Draw the background (black, like in the game)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Drawing a Frame (Retro Style)
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // 4. Text formatting (large and bold)
    ctx.fillStyle = '#00ff41';
    ctx.font = '900 80px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titlePart1 = loc.modal_msg_qr;
    const titlePart2 = shareData.name.toUpperCase();
    ctx.fillText(titlePart1, canvas.width / 2, 80);

    ctx.fillStyle = '#8cff9e'; // Имя игрока выделим белым
    ctx.font = '900 100px monospace';
    ctx.fillText(titlePart2, canvas.width / 2, 180);

    // 5. Drow the QR code
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(padding - 10, headerSpace - 10, qrSize + 20, qrSize + 20);
    ctx.drawImage(qrCanvas, padding, headerSpace);

    // 6. Saving
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_ID_${shareData.name.replace(/\s+/g, '_').toUpperCase()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  /**
   * SMART AUTO-REFRESH (Admin Only)
   * Works on Admin, Leaderboard, and Discussion views for the administrator.
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isAdmin = username.toLowerCase() === 'admin';

    // Condition: Only for admins on authorized screens
    const isAllowedView = view === 'admin' || view === 'leaderboard' || view === 'discussion-list';

    if (isAdmin && isAllowedView && isAutoRefresh) {
      interval = setInterval(async () => {
        if (document.hidden) return;

        try {
          console.log(`SYSTEM: Auto-sync active for [${view}]...`);

          const [freshResults, freshTeams] = await Promise.all([getResultsAction(), getTeamsAction()]);

          // --- LOGIC OF THE AUDIO SIGNAL (Using Snapshot Ref)
          const prevResults = resultsSnapshotRef.current;

          // 1. Checking for new players
          const hasNewEntries = freshResults.length > prevResults.length;

          // 2. Check for completed games
          const prevPendingCount = prevResults.filter(r => r.score === -1).length;
          const newPendingCount = freshResults.filter(r => r.score === -1).length;
          const hasNewFinishes = newPendingCount < prevPendingCount;

          if (hasNewEntries || hasNewFinishes) {
            console.log('SYSTEM: New telemetry received!');
            playBeep();
          }

          // Updating statuses
          setAllResults(freshResults);
          setTeamsList(freshTeams);
        } catch (error) {
          console.error('Auto-sync error:', error);
        }
      }, 15000); // 15 sec. refresh time
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view, isAutoRefresh, username]);

  // We update the snapshot every time allResults changes
  useEffect(() => {
    resultsSnapshotRef.current = allResults;
  }, [allResults]);

  /**
   * LOGIC HANDLERS
   */
  const handleStart = () => {
    if (!username) {
      return triggerModal('alert', ModalMode.IDLE, loc.msg_modal_name);
    }
    // ADMIN CHECK
    if (username.toLowerCase() === ADMIN_USER) {
      setModal({
        isOpen: true,
        type: 'prompt',
        mode: ModalMode.ADMIN_AUTH,
        message: loc.msg_modal_admincode,
        value: '',
        action: () => {},
      });
      return;
    }
    if (teamId === 0) {
      return triggerModal('alert', ModalMode.IDLE, loc.msg_modal_team);
    }
    setView('story');
  };

  const finishGame = async () => {
    let totalScore = 0;
    items.forEach((item, index) => {
      const ideal = staticItems.find(si => si.id === item.id);
      if (ideal) {
        totalScore += Math.abs(index + 1 - ideal.idealPosition);
      }
    });
    // We store the current player's score in a separate variable
    setCurrentScore(totalScore);
    // Starting analysis animation
    setIsAnalyzing(true);

    const resultData = {
      username,
      team_id: teamId,
      score: totalScore,
      selections: items.map(i => i.id),
    };
    //Save rusult to DB
    try {
      if (username === 'Commander') {
        // Create a new record (INSERT) for the commander
        await saveResultAction(resultData);
      } else {
        // For a regular player, UPDATE the existing record
        await updatePlayerResultAction(resultData);
      }
      // Refresh the list of results to see the changes in the table
      const updatedResults = await getResultsAction();
      setAllResults(updatedResults);
    } catch (error) {
      console.error('Failed to save result:', error);
      triggerModal('alert', ModalMode.IDLE, loc.msg_modal_saveerror);
    }
  };

  const getScoreMessage = (s: number) => {
    // If the data hasn't loaded yet
    if (evaluations.length === 0) return 'Analisi in corso...';
    // Sort the scores in ascending order by threshold
    const sortedEvals = [...evaluations].sort((a, b) => a.threshold - b.threshold);
    // Find the first grade whose threshold is greater than or equal to the score obtained
    const result = sortedEvals.find(e => s <= e.threshold);
    // If nothing is found (although 999 should cover everything), return the last message
    return result ? result.message : evaluations[evaluations.length - 1].message;
  };

  /**
   * ADMIN & DATABASE HANDLERS
   */
  // Logic for deleting a team
  const handleDeleteTeam = (id: number) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      mode: ModalMode.IDLE,
      message: loc.msg_modal_teamdelete,
      value: '',
      action: async () => {
        await deleteTeamAction(id);
        setTeamsList(await getTeamsAction());
        setAllResults(await getResultsAction());
        setAdminTeamFilter('all');
        setModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Logic for adding a team
  const handleAddTeam = () => {
    if (!newTeamName.trim()) {
      return triggerModal('alert', ModalMode.IDLE, loc.msg_modal_teamname);
    }
    setModal({
      isOpen: true,
      type: 'prompt-area',
      mode: ModalMode.ADD_TEAM,
      message: `${loc.msg_modal_new} [${newTeamName.toUpperCase()}]`,
      value: '',
      action: () => {},
    });
  };

  const executeAddTeam = async () => {
    // Parsing player names from a TextArea
    const playerNames = modal.value
      .split('\n')
      .map(l => l.trim())
      .filter(l => l !== '');

    if (playerNames.length === 0) {
      return triggerModal('alert', ModalMode.IDLE, loc.msg_modal_teamcrea);
    }

    try {
      //  We use `newTeamName` and `selectedScenarioForNewTeam` from  states
      await addTeamWithPlayersAction(newTeamName.trim(), selectedScenarioForNewTeam, playerNames);

      // Updating data
      setTeamsList(await getTeamsAction());
      setAllResults(await getResultsAction());

      // Clean the form and close the modal window
      setNewTeamName('');
      setModal(prev => ({ ...prev, isOpen: false, value: '' }));
    } catch (error) {
      console.error(error);
      triggerModal('alert', ModalMode.IDLE, loc.msg_modal_saveerror);
    }
  };

  const executeAdminAuth = () => {
    if (modal.value.toLowerCase() === ADMIN_PASSWORD) {
      // Pass
      setModal(prev => ({ ...prev, isOpen: false, value: '' }));
      setView('admin');
    } else {
      // Wrong password
      triggerModal('alert', ModalMode.IDLE, loc.msg_modal_wrongpass);
    }
  };

  // Delete a specific player result
  const handleDeleteResult = (id: number) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      mode: ModalMode.IDLE,
      message: loc.msg_modal_recorddel,
      value: '',
      action: async () => {
        try {
          // 1. Call the server action to delete from DB
          await deleteResultAction(id);
          // 2. Refresh the local results list from the DB
          const updatedResults = await getResultsAction();
          setAllResults(updatedResults);
          // 3. Close the modal
          setModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Failed to delete result:', error);
          setModal(prev => ({
            ...prev,
            type: 'alert',
            message: loc.msg_modal_delerror,
          }));
        }
      },
    });
  };

  // Delete all result
  const handleDeleteAllResults = () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      mode: ModalMode.IDLE,
      message: loc.msg_modal_cleardb,
      value: '',
      action: async () => {
        await deleteAllResultsAction();
        setAllResults(await getResultsAction());
        setModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete all results for one team
  const handleDeleteTeamResults = (teamId: number) => {
    const teamName = teamsList.find(t => t.id === teamId)?.name;
    triggerModal('confirm', ModalMode.IDLE, `${loc.msg_confirm_clear_team || 'Cancellare tutti i record di'} [${teamName}]?`, async () => {
      try {
        await deleteResultsByTeamAction(teamId); // Экшен тоже ждет число
        setAllResults(await getResultsAction());
        setModal(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error(error);
      }
    });
  };

  // Action for team member becoming Commander
  const handleBecomeCommander = async () => {
    // 1. CHECK: Have all the players on the team finished the test?
    // We're looking for players on your team with a score of -1 in the overall results list
    const missingPlayers = allResults.filter(r => r.team_id === teamId && r.score === -1);

    if (missingPlayers.length > 0) {
      // If there is even one person who hasn't finished, we stop the process
      const names = missingPlayers.map(p => p.username).join(', ');

      return triggerModal(
        'alert',
        ModalMode.IDLE,
        `${loc.msg_team_not_ready}: 
       ${loc.msg_waiting_for}: ${names}`
      );
    }
    // 2. If everyone is ready, let's show the standard confirmation procedure
    triggerModal('confirm', ModalMode.IDLE, loc.msg_modal_commander, async () => {
      //  Check the database to see if the slot is available
      const alreadyHas = await checkCommanderStatusAction(teamId);
      if (alreadyHas) {
        setModal(prev => ({ ...prev, isOpen: false }));
        triggerModal('alert', ModalMode.IDLE, loc.msg_modal_commError);
        return;
      }

      await updateCommanderStatusAction(teamId, true);
      setUsername('Commander');

      // We're shuffling the items for the final team score
      setItems([...staticItems].sort(() => Math.random() - 0.5));
      setView('game');
      setModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  // Action for adding new member  to existing team
  const handleAddSinglePlayer = () => {
    if (!adminTeamFilter.startsWith('team:')) {
      return triggerModal('alert', ModalMode.IDLE, loc.msg_err_select_team);
    }

    const targetTeamId = parseInt(adminTeamFilter.split(':')[1]);
    const teamName = teamsList.find(t => t.id === targetTeamId)?.name || '';

    setModal({
      isOpen: true,
      type: 'prompt',
      mode: ModalMode.ADD_PLAYER,
      message: `${loc.msg_modal_newinit} [${teamName.toUpperCase()}]:`,
      value: '',
      action: () => {},
    });
  };

  // Action for deleting all teams and, consequently, all results
  const handleWipeEverything = () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      mode: ModalMode.IDLE,
      message: loc.msg_confirm_wipe_system,
      value: '',
      action: async () => {
        try {
          // 1. Initiate a full deletion
          await wipeEntireDatabaseAction();
          // 2. Мгновенно очищаем локальные списки
          setTeamsList([]);
          setAllResults([]);
          // 3. Set the filter to “all”
          setAdminTeamFilter('all');
          // 4. Closing the modal window
          setModal(prev => ({ ...prev, isOpen: false }));

          console.log('SYSTEM: Full database wipe complete.');
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  // Function used for save (called from a modal window)
  const executeAddSinglePlayer = async () => {
    if (modal.value.trim() && adminTeamFilter.startsWith('team:')) {
      const targetTeamId = parseInt(adminTeamFilter.split(':')[1]);

      try {
        await addSinglePlayerAction(targetTeamId, modal.value);
        setAllResults(await getResultsAction());
        setModal(prev => ({ ...prev, isOpen: false, value: '' }));
      } catch (error) {
        console.error('Error adding player:', error);
        triggerModal('alert', ModalMode.IDLE, loc.msg_saveplayer);
      }
    } else {
      triggerModal('alert', ModalMode.IDLE, loc.msg_selectteam);
    }
  };

  const exportToCSV = () => {
    // 1. Column headers
    const headers = [
      loc.csv_h_operator || 'Operatore',
      loc.csv_h_team || 'Unità',
      loc.csv_h_score || 'Score',
      loc.csv_h_date || 'Data',
      loc.csv_h_time || 'Ora',
    ];

    // 2. Converting results into text strings
    const rows = leaderboardResults.map(res => [
      `"${res.username}"`, // Quotation are needed so that commas in names don't mess up the table
      `"${res.team_name}"`,
      res.score === -1 ? loc.csv_status_waiting || 'WAIT' : res.score,
      res.created_at ? new Date(res.created_at).toLocaleDateString() : 'N/A',
      res.created_at ? new Date(res.created_at).toLocaleTimeString() : 'N/A',
    ]);

    // 3. Combine everything into one long string
    const csvContent = [
      'sep=;', // tell Excel to use semicolons
      headers.join(';'),
      ...rows.map(e => e.join(';')),
    ].join('\n');

    // 4. Create a file in the browser's memory (Blob)
    // Add a BOM (Byte Order Mark) so that Excel can correctly display special characters
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);

    //File name with current data
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const fileName = `MISSION_REPORT_${dateStr}_${timeStr}.csv`;

    // 5. Click here to download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * VIEW ENGINE
   * Determines which screen to render into the CRTWrapper.
   */
  let content;
  if (view === 'login') {
    content = (
      <LoginView
        loc={loc}
        story={story}
        allResults={allResults}
        teamsList={teamsList}
        scenarios={scenarios}
        teamId={teamId}
        setTeamId={setTeamId}
        username={username}
        setUsername={setUsername}
        handleStart={handleStart}
      />
    );
  } else if (view === 'story') {
    content = <StoryView story={story} loc={loc} setView={setView} />;
  } else if (view === 'game') {
    content = <GameView username={username} currentTeamName={currentTeamName} items={items} setItems={setItems} finishGame={finishGame} loc={loc} />;
  } else if (view === 'discussion-list') {
    content = (
      <DiscussionListView
        loc={loc}
        isAdmin={isAdmin}
        username={username}
        teamId={teamId}
        adminTeamFilter={adminTeamFilter}
        teamsList={teamsList}
        discussionResults={discussionResults}
        setIsRefreshing={setIsRefreshing}
        isRefreshing={isRefreshing}
        getResultsAction={getResultsAction}
        setAllResults={setAllResults}
        setSelectedUserDetail={setSelectedUserDetail}
        setShowDeltas={setShowDeltas}
        setPrevView={setPrevView}
        setView={setView}
        updateTeamStatusAction={updateTeamStatusAction}
        getTeamsAction={getTeamsAction}
        setTeamsList={setTeamsList}
        triggerModal={triggerModal}
        checkTeamStatusAction={checkTeamStatusAction}
        handleBecomeCommander={handleBecomeCommander}
        BUTTON_STYLES={BUTTON_STYLES}
      />
    );
  } else if (view === 'results') {
    content = (
      <ResultsView
        loc={loc}
        username={username}
        currentTeamName={currentTeamName}
        currentScore={currentScore}
        getScoreMessage={getScoreMessage}
        staticItems={staticItems}
        setView={setView}
      />
    );
  } else if (view === 'leaderboard') {
    content = (
      <LeaderboardView
        loc={loc}
        isAdmin={isAdmin}
        title={
          adminTeamFilter === 'all'
            ? loc.filter_all
            : (adminTeamFilter.startsWith('scen:')
                ? scenarios.find(s => s.id === adminTeamFilter.split(':')[1])?.name
                : teamsList.find(t => t.id === parseInt(adminTeamFilter.split(':')[1]))?.name) || ''
        }
        leaderboardResults={leaderboardResults}
        exportToCSV={exportToCSV}
        isRefreshing={isRefreshing}
        setIsRefreshing={setIsRefreshing}
        getResultsAction={getResultsAction}
        setAllResults={setAllResults}
        setSelectedUserDetail={setSelectedUserDetail}
        setShowDeltas={setShowDeltas}
        setPrevView={setPrevView}
        setView={setView}
        triggerModal={triggerModal}
      />
    );
  } else if (view === 'user-detail' && selectedUserDetail) {
    content = (
      <UserDetailView
        selectedUserDetail={selectedUserDetail}
        staticItems={staticItems}
        showDeltas={showDeltas}
        prevView={prevView}
        setView={setView}
        loc={loc}
      />
    );
  } else if (view === 'admin') {
    <AdminView
      loc={loc}
      availableLangs={availableLangs}
      currentLangId={currentLangId}
      setCurrentLangId={setCurrentLangId}
      teamsList={teamsList}
      scenarios={scenarios}
      allResults={allResults} // Передаем ВСЕ результаты для фильтрации
      adminTeamFilter={adminTeamFilter}
      setAdminTeamFilter={setAdminTeamFilter}
      updateTeamStatusAction={updateTeamStatusAction}
      updateCommanderStatusAction={updateCommanderStatusAction}
      getTeamsAction={getTeamsAction}
      setTeamsList={setTeamsList}
      handleDeleteTeam={handleDeleteTeam}
      handleAddTeam={handleAddTeam}
      getResultsAction={getResultsAction}
      setAllResults={setAllResults}
      handleWipeEverything={handleWipeEverything}
      handleDeleteTeamResults={handleDeleteTeamResults}
      handleDeleteResult={handleDeleteResult}
      handleAddSinglePlayer={handleAddSinglePlayer}
      isRefreshing={isRefreshing}
      setIsRefreshing={setIsRefreshing}
      isAutoRefresh={isAutoRefresh}
      setIsAutoRefresh={setIsAutoRefresh}
      newTeamName={newTeamName}
      setNewTeamName={setNewTeamName}
      selectedScenarioForNewTeam={selectedScenarioForNewTeam}
      setSelectedScenarioForNewTeam={setSelectedScenarioForNewTeam}
      setShareData={setShareData}
      setSelectedUserDetail={setSelectedUserDetail}
      setPrevView={setPrevView}
      setView={setView}
      triggerModal={triggerModal}
    />;
  }
  return (
    <CRTWrapper>
      {content}
      {/* 1. ANALYSIS ANIMATION LAYER */}
      {isAnalyzing && (
        <AnalysisSequence
          onComplete={() => {
            setIsAnalyzing(false); // Hide animation
            setView('discussion-list'); // Show results
          }}
        />
      )}

      {/* 2. MODAL LAYER */}
      <RetroModal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        value={modal.value}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false, mode: ModalMode.IDLE }))}
        onConfirm={() => {
          switch (modal.mode) {
            case ModalMode.ADMIN_AUTH:
              executeAdminAuth();
              break;
            case ModalMode.ADD_TEAM:
              executeAddTeam();
              break;
            case ModalMode.ADD_PLAYER:
              executeAddSinglePlayer();
              break;
            // For all alerts and confirmations (where mode === ModalMode.IDLE)
            default:
              modal.action(); // It simply closes the window or performs a simple action
              break;
          }
        }}
        onChange={val => setModal(prev => ({ ...prev, value: val }))}
        loc={loc}
      />

      {/* QR ACCESS MODAL */}
      {shareData && (
        <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm border-4 border-[#00ff41] bg-black p-6 shadow-[0_0_50px_rgba(0,255,65,0.4)] text-center relative">
            <button onClick={() => setShareData(null)} className="absolute top-2 right-2 text-[#00ff41]/50 hover:text-[#00ff41]">
              <X size={20} />
            </button>

            <h3 className="text-[#00ff41] font-black uppercase mb-6 italic border-b border-[#00ff41]/30 pb-2">
              {loc.modal_msg_qr}
              {shareData.name}
            </h3>

            {/* QR CODE CANVAS */}
            <div className="bg-[#00ff41] p-3 inline-block mb-6 shadow-[0_0_20px_rgba(0,255,65,0.3)] overflow-hidden">
              <QRCodeCanvas
                id="qr-code-canvas"
                value={shareData.url}
                size={1000} // Big size for saving as image
                level={'H'}
                bgColor={'#00ff41'}
                fgColor={'#000000'}
                includeMargin={false}
                style={{ width: '200px', height: '200px' }} // And we'll show 200px on the screen
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-[#001100] border border-[#00ff41]/30 p-2 overflow-hidden">
                <span className="text-[9px] text-[#00ff41] truncate flex-1 font-mono opacity-70">{shareData.url}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareData.url);
                  }}
                  className="text-[#00ff41] hover:text-white">
                  <Copy size={16} />
                </button>
              </div>

              <button
                onClick={downloadQRCode}
                className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-xs hover:bg-white transition-colors flex items-center justify-center gap-2">
                <Download size={16} /> {loc.admin_msg_qrsave} (PNG)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </CRTWrapper>
  );
}
