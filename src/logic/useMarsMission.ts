import { useState, useEffect, useRef } from 'react';
import { GameResult, Team, SurvivalItem, ScoreEvaluation, Language, ModalMode, ModalType, Localization, PRIMARY_LANG } from '.';
import { parseStoryXml } from '../utils/xmlParser';

// SERVER ACTIONS IMPORT
import {
  getTeamsAction,
  getResultsAction,
  saveResultAction,
  deleteTeamAction,
  deleteResultAction,
  deleteAllResultsAction,
  deleteResultsByTeamAction,
  updateCommanderStatusAction,
  checkCommanderStatusAction,
  addTeamWithPlayersAction,
  updatePlayerResultAction,
  addSinglePlayerAction,
  wipeTeamsByStatusAction,
  updateTeamArchiveStatusAction,
} from '../app/actions';

export const useMarsMission = (ADMIN_PASSWORD: string) => {
  //                                                       -----   STATE MANAGEMENT   -----

  const [view, setView] = useState<'standby' | 'login' | 'story' | 'game' | 'results' | 'admin' | 'leaderboard' | 'user-detail' | 'discussion-list'>(
    'standby'
  );
  const [prevView, setPrevView] = useState<'leaderboard' | 'admin' | 'results' | 'discussion-list'>('leaderboard');
  const [isCopied, setIsCopied] = useState(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  //                                                -----   ALL useEffect (Init, Auto-sync, ...)   -----

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
        const teamToken = params.get('team_token');
        const playerToken = params.get('player_token');
        const urlLang = params.get('lang');

        // Language set
        if (urlLang) setCurrentLangId(urlLang);
        // BRANCH A: Team link
        if (teamToken) {
          const team = teams.find(t => t.access_token === teamToken && !t.is_archived);
          if (team) {
            if (team.is_unlocked) {
              setTeamId(team.id);
              setView('leaderboard');
              setPrevView('leaderboard'); // We set prevView so that the “Back” button doesn't break
            } else {
              setTeamId(team.id);
              setView('login');
            }
          } else {
            setView('standby');
          }
        }
        // BRANCH B: Personal link
        else if (playerToken) {
          const player = results.find(r => r.access_token === playerToken);
          const team = teams.find(t => t.id === player?.team_id);

          if (player && team && !team.is_archived) {
            setTeamId(player.team_id);
            setUsername(player.username);

            if (player.score === -1) {
              setView('login'); // haven't played it yet
            } else if (!team.is_unlocked) {
              setView('discussion-list'); // played it; let's talk about it
            } else {
              setView('leaderboard'); // Everyone has finished
            }
          } else {
            setView('standby');
          }
        }
        // BRANCH C: No parameters
        else {
          setView('standby');
        }

        setIsInitialized(true);
        console.log('SYSTEM: Ready.');
      } catch (error) {
        setView('standby');
        setIsInitialized(true);
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

  const getEffectiveResults = () => {
    // CHECK: If this is an admin (based on the system flag), use filters
    if (isSystemAdmin) {
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
    }

    // If this is a player (not an admin)
    return allResults.filter(r => r.team_id === teamId);
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

  /**
   * SMART AUTO-REFRESH (Admin Only)
   * Works on Admin, Leaderboard, and Discussion views for the administrator.
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Condition: Only for admins on authorized screens
    const isAllowedView = view === 'admin' || view === 'leaderboard' || view === 'discussion-list';

    if (isSystemAdmin && isAllowedView && isAutoRefresh) {
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

  // Admin login password check
  const openAdminLogin = () => {
    triggerModal('prompt', ModalMode.ADMIN_AUTH, loc.msg_modal_admincode || 'Inserire Codice Autorizzazione');
  };

  //                                                                  -----   LOGIC HANDLERS   -----

  //  Switch modal window
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

  const handleStart = () => {
    if (!username) {
      return triggerModal('alert', ModalMode.IDLE, loc.msg_modal_name);
    }
    setView('story');
  };

  // finish game handler
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
    if (modal.value.toLocaleLowerCase() === ADMIN_PASSWORD.toLocaleLowerCase()) {
      setIsSystemAdmin(true);
      setUsername(''); // Clearing name var so we won't be considered a player
      setTeamId(0); // Clearing team
      setModal(prev => ({ ...prev, isOpen: false, value: '' }));
      setView('admin');
    } else {
      triggerModal('alert', ModalMode.IDLE, loc.msg_modal_wrongpass);
    }
  };

  const handleLogout = () => {
    setIsSystemAdmin(false);
    setUsername('');
    setTeamId(0);
    setView('login');
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
    // Select a message based on the current view
    const message = showArchivedTeams ? loc.msg_confirm_wipe_archive : loc.msg_confirm_wipe_active;

    triggerModal('confirm', ModalMode.IDLE, message, async () => {
      try {
        // Pass the current archive status to the action
        await wipeTeamsByStatusAction(showArchivedTeams);
        // Updating data locally
        const [freshTeams, freshResults] = await Promise.all([getTeamsAction(), getResultsAction()]);
        setTeamsList(freshTeams);
        setAllResults(freshResults);
        setAdminTeamFilter('all');

        setModal(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error(error);
      }
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

  // Add selected team to Archive
  const [showArchivedTeams, setShowArchivedTeams] = useState(false);

  const handleToggleArchive = (teamId: number, currentStatus: boolean) => {
    const teamName = teamsList.find(t => t.id === teamId)?.name || '';
    // Select the message depending on whether you are archiving or restoring it
    const message = currentStatus
      ? `${loc.msg_confirm_restore || "Ripristinare l'unità"} [${teamName}]?`
      : `${loc.msg_confirm_archive || "Archiviare l'unità"} [${teamName}]? 
       ${loc.msg_archive_hint || 'Verrà nascosta dal login giocatori.'}`;

    triggerModal('confirm', ModalMode.IDLE, message, async () => {
      try {
        await updateTeamArchiveStatusAction(teamId, !currentStatus);
        // Updating the list of commands
        const freshTeams = await getTeamsAction();
        setTeamsList(freshTeams);
        // Modal window close
        setModal(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error('Archive toggle failed:', error);
      }
    });
  };

  useEffect(() => {
    // When the administrator switches between Active and Archived views, we reset the team filter to "all"
    setAdminTeamFilter('all');
  }, [showArchivedTeams]);

  //                                                                --- FINAL RETURN ---
  return {
    // --- 1. NAVIGATION & ROUTING ---
    view,
    setView,
    prevView,
    setPrevView,
    openAdminLogin,
    isInitialized,

    // --- 2. USER & SESSION INFO ---
    username,
    setUsername,
    teamId,
    setTeamId,
    currentScore,
    setCurrentScore,
    isAnalyzing,
    setIsAnalyzing,

    // --- 3. MISSION CONTENT (XML DATA) ---
    story,
    setStory,
    items,
    setItems,
    staticItems,
    setStaticItems,
    evaluations,
    setEvaluations,
    scenarios,
    setScenarios,

    // --- 4. DATABASE COLLECTIONS ---
    allResults,
    setAllResults,
    teamsList,
    setTeamsList,

    // --- 5. LOCALIZATION ---
    loc,
    availableLangs,
    currentLangId,
    setCurrentLangId,

    // --- 6. UI & MODAL STATES ---
    modal,
    setModal,
    triggerModal,
    shareData,
    setShareData,
    showDeltas,
    setShowDeltas,
    isRefreshing,
    setIsRefreshing,
    isAutoRefresh,
    setIsAutoRefresh,
    setIsCopied,
    isCopied,

    // --- 7. ADMIN FORM DATA ---
    newTeamName,
    setNewTeamName,
    adminTeamFilter,
    setAdminTeamFilter,
    selectedScenarioForNewTeam,
    setSelectedScenarioForNewTeam,

    // --- 8. COMPUTED / DERIVED DATA (Calculated on the fly) ---
    discussionResults,
    leaderboardResults,
    currentTeamName: teamsList.find(t => t.id === teamId)?.name || 'Anonimo',
    isAdmin: isSystemAdmin,

    // --- 9. ACTION HANDLERS ---
    handleStart,
    finishGame,
    executeAdminAuth,
    handleLogout,
    handleDeleteTeam,
    handleAddTeam,
    executeAddTeam,
    handleDeleteResult,
    handleDeleteAllResults,
    handleDeleteTeamResults,
    handleAddSinglePlayer,
    executeAddSinglePlayer,
    handleBecomeCommander,
    handleWipeEverything,
    handleToggleArchive,

    setSelectedUserDetail,
    getScoreMessage,
    selectedUserDetail,
    showArchivedTeams,
    setShowArchivedTeams,
  };
};
