"use client";
import React, { useState, useEffect } from "react";

import {
  Reorder,
  AnimatePresence,
  motion,
  useDragControls,
} from "framer-motion";

import {
  Save,
  ChevronRight,
  Users,
  Trash2,
  RefreshCcw,
  ArrowLeft,
  GripVertical,
  Info,
  FileText,
  MessageSquare,
  EyeOff,
} from "lucide-react";

/**
 * SERVER ACTIONS IMPORT
 * These functions bridge the Client-side UI with the Server-side Database (Postgres).
 */
import {
  getTeamsAction,
  saveResultAction,
  getResultsAction,
  addTeamAction,
  deleteTeamAction,
  deleteResultAction,
  deleteAllResultsAction,
  updateTeamStatusAction,
  checkTeamStatusAction,
  deleteResultsByTeamAction,
  updateCommanderStatusAction,
  checkCommanderStatusAction,
} from "./actions";

import { Team, GameResult } from "../../lib/db";

// --- INTERFACES & TYPES ---
interface SurvivalItem {
  id: string;
  name: string;
  photo: string;
  idealPosition: number;
  description: string;
}

interface ScoreEvaluation {
  threshold: number;
  message: string;
}

interface UserResult {
  username: string;
  team: string;
  score: number;
  selections: string[];
}

// --- CONSTANTS FOR ADMIN MODE ---
const ADMIN_PASSWORD = "adm"; // Password to prevent players from seeing game results
const ADMIN_USER = "admin";

// --- STYLES ---
const BUTTON_STYLES = {
  primary:
    "w-full bg-[#00ff41] text-black py-4 font-black uppercase text-xl hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.5)]",
  secondary:
    "border-2 border-[#00ff41] py-3 hover:bg-[#00ff41] hover:text-black uppercase font-bold transition-all",
};

// --- UI COMPONENTS ---

/**
 * Visual wrapper simulating a retro CRT monitor.
 * Includes scanlines and glowing border.
 */
const CRTWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0a0a0a] text-[#00ff41] font-mono p-4 md:p-8 relative overflow-hidden selection:bg-[#00ff41] selection:text-black">
    <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] opacity-30"></div>
    <div className="max-w-4xl mx-auto border-4 border-[#00ff41] p-6 shadow-[0_0_25px_rgba(0,255,65,0.2)] bg-[#0d0d0d] relative z-10">
      {children}
    </div>
  </div>
);

const Header = ({ title }: { title: string }) => (
  <h1 className="text-2xl md:text-4xl font-black text-center mb-8 uppercase tracking-tighter italic border-b-2 border-[#00ff41] pb-4">
    {title}
  </h1>
);

/**
 * Item component for the Drag & Drop list.
 * Restricted to drag only via the GripVertical handle for better mobile UX.
 */
const DraggableItem = ({
  item,
  index,
}: {
  item: SurvivalItem;
  index: number;
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={controls}
      className="group bg-[#111] border-2 border-[#00ff41]/30 p-3 flex items-center gap-4 hover:border-[#00ff41]/60 transition-colors"
      style={{ touchAction: "pan-y" }}
    >
      {/* 1. THE DRAG HANDLE */}
      <div
        className="cursor-grab active:cursor-grabbing p-2 text-[#00ff41]/30 hover:text-[#00ff41] transition-colors"
        // Start dragging only when touching this handle ---
        onPointerDown={(e) => controls.start(e)}
        style={{ touchAction: "none" }}
      >
        <GripVertical size={20} />
      </div>
      {/* 2. INDEX NUMBER */}
      <span className="text-xl font-black w-8 text-[#00ff41]/40 group-hover:text-[#00ff41]">
        {index + 1}
      </span>
      {/* 3. ITEM PHOTO */}
      <div className="w-20 h-20 border border-[#00ff41]/20 overflow-hidden bg-black shrink-0">
        <img
          src={`/img/${item.photo}`}
          alt={item.name}
          draggable="false"
          className="w-full h-full object-cover opacity-80"
        />
      </div>
      {/* 4. ITEM NAME */}
      <div className="flex-1">
        <div className="uppercase font-bold text-xs leading-tight">
          {item.name}
        </div>
      </div>
    </Reorder.Item>
  );
};

/**
 * Retro-styled analysis sequence shown after the player submits their order.
 */
const AnalysisSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const phrases = [
    "> INIZIALIZZAZIONE ANALISI...",
    "> CONNESSIONE SATELLITE ARES-1",
    "> SCANSIONE INVENTARIO...",
    "> VALUTAZIONE O2: CRITICO",
    "> CALCOLO TRAIETTORIA...",
    "> ANALISI PRIORITÀ NASA...",
    "> SINCRONIZZAZIONE DATABASE...",
    "> CALCOLO PROBABILITÀ...",
    "> GENERAZIONE RAPPORTO...",
  ];

  useEffect(() => {
    // 1. Progress bar simulation
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 1 : 100));
    }, 40);
    // 2. Typing logs simulation
    phrases.forEach((phrase, index) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, phrase]);
      }, index * 450);
    });
    // 3. Complete after some time
    const timeout = setTimeout(onComplete, 4500);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-200 bg-black text-[#00ff41] font-mono p-6 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-4 md:py-10">
        <div className="flex-1 min-h-0 mb-6 relative">
          <div className="absolute inset-0 overflow-hidden flex flex-col justify-end border-l border-[#00ff41]/20 pl-4">
            <AnimatePresence>
              {logs.slice(-8).map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] md:text-xs leading-tight mb-2 flex gap-2"
                >
                  <span className="opacity-40 shrink-0 hidden xs:inline">
                    [ {new Date().toLocaleTimeString([], { second: "2-digit" })}{" "}
                    s]
                  </span>
                  <span>{log}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* PROGRESS BAR BLOCK (Fixed size)  */}
        <div className="shrink-0 space-y-3 bg-black">
          <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
            <span className="animate-pulse">Analyzing...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-4 border-2 border-[#00ff41] p-0.5 shadow-[0_0_10px_rgba(0,255,65,0.2)]">
            <div
              className="h-full bg-[#00ff41] transition-all duration-100 ease-linear shadow-[0_0_15px_#00ff41]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* DECORATIVE FOOTER */}
        <div className="shrink-0 mt-8 grid grid-cols-3 gap-2 opacity-30 text-[7px] md:text-[8px] uppercase border-t border-[#00ff41]/10 pt-4">
          <div className="animate-pulse">CPU: 98%</div>
          <div className="animate-pulse delay-75">O2: OK</div>
          <div className="animate-pulse delay-150">TMP: -64C</div>
        </div>
      </div>

      {/* A scanning effect designed specifically for this screen */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px] opacity-10"></div>
    </div>
  );
};

/**
 * Universal Modal UI used for Alerts, Confirms, and Admin Prompts.
 * Supports Enter and Escape keys for fast interaction.
 */
const RetroModal = ({
  isOpen,
  type,
  message,
  value,
  onClose,
  onConfirm,
  onChange,
}: {
  isOpen: boolean;
  type: "alert" | "confirm" | "prompt";
  message: string;
  value?: string;
  onClose: () => void;
  onConfirm: () => void;
  onChange?: (val: string) => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md border-4 border-[#00ff41] bg-black p-6 shadow-[0_0_50px_rgba(0,255,65,0.3)] relative"
      >
        {/* Scanline overlay for modal */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] opacity-20"></div>
        <h3 className="text-[#00ff41] font-black uppercase tracking-tighter mb-4 text-xl italic border-b border-[#00ff41]/30 pb-2">
          {type === "confirm"
            ? "> Richiesta Conferma"
            : type === "prompt"
              ? "> Input Richiesto"
              : "> Messaggio Sistema"}
        </h3>

        <p className="text-[#00ff41] mb-6 uppercase text-sm leading-relaxed tracking-wide">
          {message}
        </p>

        {type === "prompt" && (
          <input
            autoFocus
            className="w-full bg-[#001100] border-2 border-[#00ff41] p-2 text-[#00ff41] outline-none mb-6 focus:bg-[#003300] uppercase"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
          />
        )}

        <div className="flex justify-end gap-4">
          {type !== "alert" && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#00ff41]/50 text-[#00ff41]/50 hover:text-[#00ff41] uppercase text-xs font-bold"
            >
              Annulla
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#00ff41] text-black font-black uppercase text-xs hover:bg-white transition-colors"
          >
            {type === "confirm" ? "Conferma" : "Esegui"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN APPLICATION LOGIC ---
export default function MarsSurvivalGame() {
  /**
   * STATE MANAGEMENT
   */
  const [view, setView] = useState<
    | "login"
    | "story"
    | "game"
    | "results"
    | "admin"
    | "leaderboard"
    | "user-detail"
    | "discussion-list"
  >("login");

  // Remember where to go back from 'user-detail' view
  const [prevView, setPrevView] = useState<
    "leaderboard" | "admin" | "results" | "discussion-list"
  >("leaderboard");

  // Game Content from XML and scenarios
  const [story, setStory] = useState({ title: "Caricamento...", plot: "" });
  const [items, setItems] = useState<SurvivalItem[]>([]);
  const [staticItems, setStaticItems] = useState<SurvivalItem[]>([]);
  const [evaluations, setEvaluations] = useState<ScoreEvaluation[]>([]);
  //List of all available scripts from JSON
  const [scenarios, setScenarios] = useState<
    { id: string; file: string; name: string }[]
  >([]);
  //A new state for storing the selected script in the admin panel
  const [selectedScenarioForNewTeam, setSelectedScenarioForNewTeam] =
    useState("mars_it");

  // Database Data
  const [username, setUsername] = useState("");
  const [allResults, setAllResults] = useState<GameResult[]>([]);
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<number>(0);

  // Scoring & UI Toggles
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<GameResult | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDeltas, setShowDeltas] = useState<boolean>(true);
  const [adminTeamFilter, setAdminTeamFilter] = useState<number>(0);

  // Computed helper
  const currentTeamName =
    teamsList.find((t) => t.id === teamId)?.name || "Anonimo";

  // Global Modal System
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm" | "prompt";
    message: string;
    value: string;
    action: () => void;
  }>({
    isOpen: false,
    type: "alert",
    message: "",
    value: "",
    action: () => {},
  });

  const triggerModal = (
    type: "alert" | "confirm" | "prompt",
    message: string,
    action?: () => void,
  ) => {
    setModal({
      isOpen: true,
      type,
      message,
      value: "",
      action:
        action || (() => setModal((prev) => ({ ...prev, isOpen: false }))),
    });
  };

  /**
   * INITIALIZATION
   * This synchronizes both the static XML story content
   * and the dynamic Database records (Teams & Results).
   */
  useEffect(() => {
    async function initializeMission() {
      console.log("SYSTEM: Initializing synchronization sequence...");

      try {
        // --- STEP 1: LOAD & PARSE XML CONTENT ---
        const response = await fetch("/data/story.xml");
        if (!response.ok)
          throw new Error("Could not find story.xml in /public");

        const xmlString = await response.text();
        const parsedData = parseStoryXml(xmlString);

        // Update story and items from XML
        setStory(parsedData.story);
        setStaticItems(parsedData.items);
        setEvaluations(parsedData.evaluations);

        // Prepare the game items (shuffle logic)
        // We use the freshly parsed data here instead of old INITIAL_ITEMS
        setItems([...parsedData.items].sort(() => Math.random() - 0.5));

        // --- STEP 2: FETCH DATABASE RECORDS ---
        // We run these in parallel to speed up the initialization
        const [teams, results] = await Promise.all([
          getTeamsAction(),
          getResultsAction(),
        ]);

        setTeamsList(teams);
        setAllResults(results);

        console.log(
          "SYSTEM: Synchronization complete. All data modules loaded.",
        );
      } catch (error) {
        console.error("SYSTEM CRITICAL ERROR:", error);
        // Show error message to user via our custom Modal
        setModal({
          isOpen: true,
          type: "alert",
          message:
            "ERRORE CRITICO: Impossibile sincronizzare i dati con la base. Controllare la connessione.",
          value: "",
          action: () => setModal((prev) => ({ ...prev, isOpen: false })),
        });
      }
    }
    // Launch the sequence
    initializeMission();
  }, []); // Run only once on mount

  /**
   * AUTO-SYNC
   * Refreshes results whenever the user enters the Leaderboard or Admin panel.
   */
  useEffect(() => {
    if (
      view === "leaderboard" ||
      view === "admin" ||
      view === "discussion-list"
    ) {
      async function syncData() {
        try {
          console.log(`SYSTEM: Auto-syncing data for view [${view}]...`);
          const freshResults = await getResultsAction();
          setAllResults(freshResults);

          // If we are on the leaderboard, also refresh teams to catch status changes (is_unlocked)
          if (view === "leaderboard") {
            const freshTeams = await getTeamsAction();
            setTeamsList(freshTeams);
          }
        } catch (error) {
          console.error("SYSTEM ERROR: Auto-sync failed", error);
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
    //  First we find the command and the config
    const selectedTeam = teamsList.find((t) => t.id === teamId);
    const foundConfig = scenarios.find(
      (s) => s.id === selectedTeam?.current_scenario,
    );

    //  We are checking - If we find something, we move forward.
    if (teamId !== 0 && foundConfig) {
      const scenarioFile = foundConfig.file;
      const scenarioName = foundConfig.name;

      const loadSpecificScenario = async () => {
        try {
          console.log(`SYSTEM: Loading scenario [${scenarioName}]...`);
          const response = await fetch(`/data/${scenarioFile}`);

          if (!response.ok) throw new Error("XML not found");

          const xmlString = await response.text();
          const parsedData = parseStoryXml(xmlString);

          setStory(parsedData.story);
          setStaticItems(parsedData.items);
          setEvaluations(parsedData.evaluations);
          setItems([...parsedData.items].sort(() => Math.random() - 0.5));
        } catch (err) {
          console.error("Failed to load scenario XML:", err);
        }
      };

      loadSpecificScenario();
    }
  }, [teamId, scenarios, teamsList]);

  useEffect(() => {
    async function init() {
      // Load scenario manifest
      const res = await fetch("/data/scenarios.json");
      const manifest = await res.json();
      setScenarios(manifest);

      // Load DB records
      const [teams, results] = await Promise.all([
        getTeamsAction(),
        getResultsAction(),
      ]);
      setTeamsList(teams);
      setAllResults(results);
    }
    init();
  }, []);

  /**
   * XML PARSER
   * Converts XML string from public/story.xml into JavaScript objects
   */
  const parseStoryXml = (xmlString: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const title = xmlDoc.getElementsByTagName("Title")[0]?.textContent || "";
    const plot = xmlDoc.getElementsByTagName("Plot")[0]?.textContent || "";
    const itemNodes = xmlDoc.getElementsByTagName("Item");
    const items: SurvivalItem[] = [];

    for (let i = 0; i < itemNodes.length; i++) {
      const node = itemNodes[i];
      items.push({
        id: node.getAttribute("id") || "",
        name: node.getElementsByTagName("Name")[0]?.textContent || "",
        photo: node.getElementsByTagName("Photo")[0]?.textContent || "",
        idealPosition: parseInt(
          node.getElementsByTagName("Position")[0]?.textContent || "15",
        ),
        description:
          node.getElementsByTagName("Description")[0]?.textContent || "",
      });
    }

    // Parsing ranks
    const evalNodes = xmlDoc.getElementsByTagName("Rank");
    const evaluations: ScoreEvaluation[] = [];
    for (let i = 0; i < evalNodes.length; i++) {
      evaluations.push({
        threshold: parseInt(evalNodes[i].getAttribute("threshold") || "999"),
        message: evalNodes[i].textContent || "",
      });
    }
    return { story: { title, plot }, evaluations, items };
  };

  /**
   * LOGIC HANDLERS
   */
  const handleStart = () => {
    if (!username) {
      return triggerModal(
        "alert",
        "Identificazione fallita. Inserire un nome.",
      );
    }
    // ADMIN CHECK
    if (username.toLowerCase() === ADMIN_USER) {
      setModal({
        isOpen: true,
        type: "prompt",
        message:
          "ACCESSO RISERVATO: Inserire il Codice di Autorizzazione dell'Ufficiale di Comando.",
        value: "",
        action: () => {},
      });
      return;
    }
    if (teamId === 0) {
      return triggerModal("alert", "Selezionare una squadra per procedere.");
    }
    setView("story");
  };

  const finishGame = async () => {
    let totalScore = 0;
    items.forEach((item, index) => {
      const ideal = staticItems.find((si) => si.id === item.id);
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
      selections: items.map((i) => i.id),
    };

    try {
      await saveResultAction(resultData);
      // Updating the main list in the background
      const updatedResults = await getResultsAction();
      setAllResults(updatedResults);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const getScoreMessage = (s: number) => {
    // If the data hasn't loaded yet
    if (evaluations.length === 0) return "Analisi in corso...";
    // Sort the scores in ascending order by threshold
    const sortedEvals = [...evaluations].sort(
      (a, b) => a.threshold - b.threshold,
    );
    // Find the first grade whose threshold is greater than or equal to the score obtained
    const result = sortedEvals.find((e) => s <= e.threshold);
    // If nothing is found (although 999 should cover everything), return the last message
    return result
      ? result.message
      : evaluations[evaluations.length - 1].message;
  };

  /**
   * ADMIN & DATABASE HANDLERS
   */

  // Logic for deleting a team
  const handleDeleteTeam = (id: number) => {
    setModal({
      isOpen: true,
      type: "confirm",
      message:
        "ATTENZIONE: L'eliminazione del team rimuoverà tutti i record associati. Procedere?",
      value: "",
      action: async () => {
        await deleteTeamAction(id);
        setTeamsList(await getTeamsAction());
        setAllResults(await getResultsAction());
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Logic for adding a team
  const handleAddTeam = () => {
    setModal({
      isOpen: true,
      type: "prompt",
      message: "Inserire nome della nuova unità coloniale:",
      value: "",
      action: () => {}, // Action for prompt is handled by executeAddTeam
    });
  };

  const executeAddTeam = async () => {
    if (modal.value.trim()) {
      // We pass the name and selected scenario
      await addTeamAction(modal.value, selectedScenarioForNewTeam);
      setTeamsList(await getTeamsAction());
      setModal((prev) => ({ ...prev, isOpen: false, value: "" }));
    }
  };

  const executeAdminAuth = () => {
    if (modal.value.toLowerCase() === ADMIN_PASSWORD) {
      // Pass
      setModal((prev) => ({ ...prev, isOpen: false, value: "" }));
      setView("admin");
    } else {
      // Wrong password
      triggerModal(
        "alert",
        "CODICE ERRATO: Accesso negato. Il tentativo è stato registrato.",
      );
    }
  };

  // Delete a specific player result
  const handleDeleteResult = (id: number) => {
    setModal({
      isOpen: true,
      type: "confirm",
      message:
        "ATTENZIONE: Eliminare definitivamente questo record di missione? L'azione è irreversibile.",
      value: "",
      action: async () => {
        try {
          // 1. Call the server action to delete from DB
          await deleteResultAction(id);
          // 2. Refresh the local results list from the DB
          const updatedResults = await getResultsAction();
          setAllResults(updatedResults);
          // 3. Close the modal
          setModal((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Failed to delete result:", error);
          setModal((prev) => ({
            ...prev,
            type: "alert",
            message: "ERRORE: Impossibile eliminare il record.",
          }));
        }
      },
    });
  };

  // Delete all result
  const handleDeleteAllResults = () => {
    setModal({
      isOpen: true,
      type: "confirm",
      message:
        "PERICOLO: Sei sicuro di voler cancellare TUTTI i risultati dal database? Questa operazione non può essere annullata.",
      value: "",
      action: async () => {
        await deleteAllResultsAction();
        setAllResults(await getResultsAction());
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete all results for one team
  const handleDeleteTeamResults = (teamId: number) => {
    const teamName = teamsList.find((t) => t.id === teamId)?.name || "Unità";
    setModal({
      isOpen: true,
      type: "confirm",
      message: `ATTENZIONE: Eliminare TUTTI i record per il team [${teamName}]? L'azione è irreversibile.`,
      value: "",
      action: async () => {
        await deleteResultsByTeamAction(teamId);
        setAllResults(await getResultsAction());
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Action for team mamber becoming Commander
  const handleBecomeCommander = async () => {
    triggerModal(
      "confirm",
      "SEI SICURO? Solo un membro può assumere il comando. Dovrai rifare il test per conto di tutta la squadra.",
      async () => {
        // We check the database to see if the spot is taken
        const alreadyHas = await checkCommanderStatusAction(teamId);
        if (alreadyHas) {
          setModal((prev) => ({ ...prev, isOpen: false }));
          triggerModal(
            "alert",
            "ERRORE: Un comandante è già stato assegnato a questa unità.",
          );
          return;
        }

        // Set a flag in the database
        await updateCommanderStatusAction(teamId, true);

        // Change the name locally and restart the game
        setUsername("Commander");
        setItems([...staticItems].sort(() => Math.random() - 0.5)); // Mix again
        setView("game");
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    );
  };

  /**
   * VIEW ENGINE
   * Determines which screen to render into the CRTWrapper.
   */
  let content;
  if (view === "login") {
    content = (
      <>
        <Header title="Mars Mission Login" />
        <div className="flex flex-col gap-6 max-w-sm mx-auto py-12">
          <div className="space-y-2">
            <label className="text-xs uppercase">
              Identificativo Operatore:
            </label>
            <input
              className="w-full bg-black border-2 border-[#00ff41] p-3 outline-none focus:bg-[#003300] transition-colors"
              placeholder="Nome..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              // --- Login with Enter key ---
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase">Unità di Assegnazione:</label>
            <select
              className="w-full bg-black border-2 border-[#00ff41] p-3 outline-none appearance-none cursor-pointer"
              value={teamId}
              onChange={(e) => setTeamId(Number(e.target.value))}
              // --- Login with Enter key ---
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            >
              <option value={0}>Seleziona Team...</option>
              {teamsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleStart}
            className="mt-4 border-4 border-[#00ff41] py-4 hover:bg-[#00ff41] hover:text-black transition-all font-black uppercase text-xl"
          >
            Inizializzare Missione
          </button>
        </div>
      </>
    );
  } else if (view === "story") {
    content = (
      <>
        <Header title={story.title} />
        <div className="space-y-6 text-lg leading-relaxed">
          <p className="bg-[#003300] p-4 border-l-8 border-[#00ff41]">
            {story.plot}
          </p>
          <div className="p-4 border border-[#00ff41] border-dashed">
            <h3 className="font-bold mb-2">PROTOCOLLO:</h3>
            <ul className="list-disc list-inside text-sm space-y-1 opacity-80">
              <li>
                Trascina gli oggetti per stabilire l'ordine di importanza.
              </li>
              <li>Posizione 1 = Vitale, Posizione 15 = Inutile.</li>
            </ul>
          </div>
          <button
            onClick={() => setView("game")}
            className="w-full flex items-center justify-center gap-4 border-2 border-[#00ff41] py-4 hover:bg-[#00ff41] hover:text-black font-bold uppercase"
          >
            Accedi all'Inventario Cargo <ChevronRight />
          </button>
        </div>
      </>
    );
  } else if (view === "game") {
    content = (
      <>
        <div className="flex justify-between items-end mb-6">
          <div className="text-xs">
            OPERATORE: {username}
            <br />
            TEAM: {currentTeamName}
          </div>
          <h2 className="text-xl font-bold uppercase tracking-widest">
            Configurazione Inventario
          </h2>
        </div>

        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className="space-y-2 select-none" // select-none prevents text selection during drag
        >
          {items.map((item, index) => (
            <DraggableItem key={item.id} item={item} index={index} />
          ))}
        </Reorder.Group>

        <button
          onClick={finishGame}
          className="w-full mt-8 bg-[#00ff41] text-black py-4 font-black uppercase text-xl hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.5)]"
        >
          Invia Rapporto alla Base
        </button>
      </>
    );
  } else if (view === "discussion-list") {
    const isAdmin = username.toLowerCase() === "admin";
    const discussionResults = allResults
      .filter((r) => r.team_id === (isAdmin ? adminTeamFilter : teamId))
      .sort((a, b) => {
        // 1. Commander is always first
        if (a.username === "Commander") return -1;
        if (b.username === "Commander") return 1;
        // 2.  We sort all the rest alphabetically
        return a.username.localeCompare(b.username);
      });

    const isCommander = username === "Commander";
    const currentTeam = teamsList.find(
      (t) => t.id === (isAdmin ? adminTeamFilter : teamId),
    );

    content = (
      <>
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#00ff41] pb-2 text-[#00ff41]">
          {!isAdmin && (
            <button
              onClick={() => setView("login")}
              className="text-[10px] uppercase border border-[#00ff41] px-2 py-1 hover:bg-[#00ff41] hover:text-black"
            >
              Logout
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setView("admin")}
              className="text-xs flex items-center gap-1 hover:underline"
            >
              <ArrowLeft size={14} /> Admin
            </button>
          )}

          <h2 className="text-lg font-bold uppercase italic tracking-tighter">
            Resoconto: {currentTeam?.name}
          </h2>
          <RefreshCcw
            size={18}
            className="cursor-pointer"
            onClick={async () => setAllResults(await getResultsAction())}
          />
        </div>

        <div className="space-y-2 mb-8">
          {discussionResults.map((res) => (
            <div
              key={res.id}
              className={`flex justify-between items-center p-3 border ${
                res.username === "Commander"
                  ? "bg-[#38180670] border-amber-500/30"
                  : "bg-[#00ff41]/10 border-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.2)]"
              }`}
            >
              <div className="flex items-center gap-3">
                {res.username === "Commander" && (
                  <div className="bg-amber-500 text-black text-[10px] px-1 font-black uppercase">
                    Final Order
                  </div>
                )}
                <span
                  className={`font-bold uppercase ${res.username === "Commander" ? "text-amber-500" : "text-[#00ff41]"}`}
                >
                  {res.username}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedUserDetail(res);
                  setShowDeltas(false);
                  setPrevView("discussion-list");
                  setView("user-detail");
                }}
                className={`${res.username === "Commander" ? "bg-amber-500" : "bg-[#00ff41] "} text-black px-4 py-1 text-[10px] font-black uppercase`}
              >
                Analizza
              </button>
            </div>
          ))}
        </div>

        {/* --- BOTTOM BUTTON PANEL  --- */}
        <div className="space-y-4">
          {/* If it's an admin or a commander — the unlock button */}
          {isAdmin || isCommander ? (
            <button
              onClick={async () => {
                const targetId = isAdmin ? adminTeamFilter : teamId;
                if (targetId === 0)
                  return triggerModal("alert", "Seleziona un team.");
                // Unlock the results in the database
                await updateTeamStatusAction(targetId, true);
                //  Updating the list of commands locally
                const freshTeams = await getTeamsAction();
                setTeamsList(freshTeams);
                //  CHECK: If it's the Commander, send him directly to the results
                if (username === "Commander") {
                  setView("results");
                } else {
                  // If it's an admin, we just display the confirmation and stay where we are
                  triggerModal(
                    "alert",
                    "MISSION COMPLETE: I risultati finali sono ora accessibili per tutta la squadra.",
                  );
                }
              }}
              className={BUTTON_STYLES.primary}
            >
              Sblocca Risultati NASA
            </button>
          ) : (
            /* For a regular player, there are two buttons: “Request Results” and “Become Commander” */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={async () => {
                  const unlocked = await checkTeamStatusAction(teamId);
                  if (unlocked) setView("results");
                  else
                    triggerModal(
                      "alert",
                      "ACCESSO NEGATO: In attesa dell'ordine finale del Comandante.",
                    );
                }}
                className="border-2 border-[#00ff41] text-[#00ff41] py-4 font-black uppercase text-sm hover:bg-[#00ff41] hover:text-black transition-all"
              >
                Richiedi Risultati NASA
              </button>

              {/* We display the “Become Commander” button only if it isn't already there */}
              {!currentTeam?.has_commander && (
                <button
                  onClick={handleBecomeCommander}
                  className="border-2 border-amber-500 text-amber-500 py-4 font-black uppercase text-sm hover:bg-amber-500 hover:text-black transition-all"
                >
                  Assumi il Comando
                </button>
              )}
            </div>
          )}
        </div>
      </>
    );
  } else if (view === "results") {
    content = (
      <>
        <Header title="Analisi Sopravvivenza" />
        {/* PLAYER INFO BAR */}
        <div className="text-center mb-4">
          <div className="inline-block border border-[#00ff41] px-4 py-1 text-[14px] uppercase tracking-[0.2em] bg-[#00ff41]/10">
            Operatore: <span className="text-white">{username}</span> | Team:{" "}
            <span className="text-white">{currentTeamName}</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-6xl font-black mb-2">{currentScore}</div>
          <div className="text-sm uppercase tracking-[0.3em] mb-0 opacity-70">
            Punti di Deviazione
          </div>
          <div className="text-xs text-white/80 italic mb-4">
            (Meno è meglio)
          </div>
          <p className="text-xl italic bg-[#00ff41] text-black p-3 font-bold uppercase">
            {getScoreMessage(currentScore)}
          </p>
        </div>

        <div className="grid gap-4 mb-8 border border-[#00ff41]/30 p-4 bg-black/50">
          {[...staticItems] // Create a copy to avoid mutating state
            .sort((a, b) => a.idealPosition - b.idealPosition)
            .map((item) => (
              <div
                key={item.id}
                className="text-xs border-b border-[#00ff41]/20 pb-4 last:border-0"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 border border-[#00ff41]/30 shrink-0">
                    <img
                      src={`/img/${item.photo}`}
                      alt={item.name}
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[#00ff41] font-bold uppercase block mb-1">
                      {item.idealPosition}. {item.name}
                    </span>
                    <p className="opacity-70 italic leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => setView("leaderboard")}
            className="flex-1 border-2 border-[#00ff41] py-3 hover:bg-[#00ff41] hover:text-black uppercase font-bold"
          >
            Classifica Team
          </button>
        </div>
      </>
    );
  } else if (view === "leaderboard") {
    const isAdmin = username.toLowerCase() === "admin";
    // If an admin logs in and has a filter selected in the admin panel, we display only that filter.
    // If there is no filter (0) or the user is not an admin, the standard logic applies.
    const effectiveTeamId = isAdmin ? adminTeamFilter : teamId;

    const filteredResults =
      isAdmin && effectiveTeamId === 0
        ? allResults
        : allResults.filter((res) => res.team_id === effectiveTeamId);

    content = (
      <>
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#00ff41] pb-2">
          <button
            onClick={() => {
              if (isAdmin) {
                setView("admin");
              } else {
                setView("results");
              }
            }}
            className="text-xs flex items-center gap-1 hover:underline text-[#00ff41]"
          >
            <ArrowLeft size={14} />
            {isAdmin ? "Admin" : "Risultati"}
          </button>
          <h2 className="text-xl font-bold uppercase">Status Coloni</h2>
          <button
            onClick={async () => {
              // 1. Fetch fresh data from the Database
              const freshResults = await getResultsAction();
              // 2. Update the state (this will trigger a re-render)
              setAllResults(freshResults);
            }}
            className="p-2 hover:rotate-180 transition-transform duration-500 border border-[#00ff41]/30 rounded-full"
            title="Sincronizza con il Database"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
        <div className="space-y-2">
          {/* TABLE HEADERS - Adjusted for mobile grid */}
          <div className="grid grid-cols-[1.5fr_1fr_45px_35px] md:grid-cols-4 text-[10px] uppercase opacity-50 px-4 mb-2">
            <span>Nome</span>
            <span>Team</span>
            <span className="text-right">Pts</span>
            <span className="text-right md:pr-2">Info</span>
          </div>

          {filteredResults
            .sort((a, b) => a.score - b.score)
            .map((res) => {
              const isCommEntry = res.username === "Commander";
              return (
                <div
                  key={res.id}
                  // Responsive grid: wider for name, narrow for score/action
                  // Amber color for Commander
                  className={`grid grid-cols-[1.5fr_1fr_45px_35px] md:grid-cols-4 items-center p-3 md:p-4 border transition-colors gap-2 ${
                    isCommEntry
                      ? "bg-amber-500/10 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      : "bg-[#111] border-[#00ff41]/20 hover:border-[#00ff41]"
                  }`}
                >
                  {/* NAME: Allow wrapping and multi-line for long names. Amber color for Commander */}
                  <span
                    className={`font-bold text-xs md:text-sm leading-tight wrap-break-word pr-2 ${
                      isCommEntry ? "text-amber-500" : ""
                    }`}
                  >
                    {res.username}
                  </span>

                  {/* TEAM: Small and truncated to save space. Amber color for Commander */}
                  <span
                    className={`text-[10px] md:text-xs truncate uppercase ${
                      isCommEntry ? "text-amber-500 opacity-100" : "opacity-70"
                    }`}
                  >
                    {res.team_name}
                  </span>

                  {/* SCORE: The commander can also be highlighted in orange */}
                  <span
                    className={`text-right font-black text-xs md:text-base ${
                      isCommEntry ? "text-amber-500" : "text-[#00ff41]"
                    }`}
                  >
                    {res.score}
                  </span>

                  {/* ACTION: Icon instead of text on mobile */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedUserDetail(res);
                        setShowDeltas(true); // Включаем баллы
                        setPrevView("leaderboard");
                        setView("user-detail");
                      }}
                      // The button also turns orange for the Commander
                      className={`p-1 ${isCommEntry ? "text-amber-500" : "text-[#00ff41] hover:text-white"}`}
                      title="Dettagli"
                    >
                      {/* Desktop: Text | Mobile: Icon */}
                      <span className="hidden md:inline text-[10px] underline uppercase">
                        Dettagli
                      </span>
                      <span className="md:hidden">
                        <ChevronRight size={18} />
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {!isAdmin && (
          <div className="mt-8 pt-6 border-t-2 border-[#00ff41]/30">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#00ff41] text-black py-4 font-black uppercase text-xl hover:bg-white transition-colors flex items-center justify-center gap-3"
            >
              <RefreshCcw size={24} />
              Inizia Nuova Missione
            </button>
            <p className="text-[10px] text-center mt-4 opacity-50 uppercase tracking-widest">
              Attenzione: il riavvio resetterà la sessione corrente
            </p>
          </div>
        )}
      </>
    );
  } else if (view === "user-detail" && selectedUserDetail) {
    content = (
      <>
        <div className="mb-6">
          <button
            // We use prevView state to decide where to go back
            onClick={() => setView(prevView)}
            className="text-xs flex items-center gap-1 hover:underline mb-4"
          >
            <ArrowLeft size={14} /> Torna a{" "}
            {prevView === "admin" ? "Amministrazione" : "Classifica"}
          </button>

          <div className="mb-8">
            <div className="text-center mb-4">
              <div className="inline-block border border-[#00ff41] px-4 py-1 text-[14px] uppercase tracking-[0.2em] bg-[#00ff41]/10">
                Operatore:{" "}
                <span className="text-white">
                  {selectedUserDetail.username}
                </span>{" "}
                | Team:{" "}
                <span className="text-white">
                  {selectedUserDetail.team_name}
                </span>
              </div>
            </div>

            <div className="mt-2 flex justify-center " >
              {showDeltas ? (
                <div className="text-sm font-black uppercase tracking-tight text-[#00ff41] flex items-baseline gap-2">
                  <span>Punteggio NASA:</span>
                  <span className="text-2xl underline decoration-double">
                    {selectedUserDetail.score}
                  </span>
                </div>
              ) : (
                <div className="inline-block text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-1 border border-amber-500/30 uppercase tracking-widest animate-pulse">
                  Status: Risultati Secretati
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="space-y-1">
          {selectedUserDetail.selections.map((itemId: string, idx: number) => {
            const item = staticItems.find((i) => i.id === itemId);
            const diff = Math.abs(idx + 1 - (item?.idealPosition || 0));

            return (
              <div
                key={itemId}
                // flex justify-between pushes children to opposite ends
                // items-start ensures alignment even if name wraps to 2 lines
                className="flex justify-between items-start gap-3 p-3 border-b border-[#00ff41]/10 bg-black/20"
              >
                {/* LEFT SIDE: Index and Name (Flexible) */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] opacity-40 font-mono mr-2">
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <span className="uppercase font-bold text-[11px] leading-tight wrap-break-word">
                    {item?.name}
                  </span>
                </div>

                {/* RIGHT SIDE: NASA Info and Delta (Fixed width, pinned to right) */}
                <div className="shrink-0 text-right font-mono flex flex-col items-end">
                  {/* Condition: display deltas only if showDeltas === true */}
                  {showDeltas ? (
                    <>
                      <div className="text-[9px] opacity-50 uppercase italic leading-none mb-1">
                        NASA: {item?.idealPosition}
                      </div>
                      <div
                        className={`text-sm font-black leading-none ${diff === 0 ? "text-green-400" : "text-amber-500"}`}
                      >
                        Δ {diff}
                      </div>
                    </>
                  ) : (
                    <div
                      className="flex flex-col items-center gap-1 text-amber-500 opacity-80"
                      title="In fase di discussione - Punteggio nascosto"
                    >
                      <MessageSquare size={22} className="animate-pulse" />
                      <span className="text-[7px] uppercase font-black tracking-tighter">
                        Esame
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  } else if (view === "admin") {
    const filteredAdminResults = (
      adminTeamFilter === 0
        ? allResults
        : allResults.filter((r) => r.team_id === adminTeamFilter)
    ).sort((a, b) => {
      //  Convert dates to timestamps for comparison
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      // Sort by: largest to smallest (freshest first)
      return dateB - dateA;
    });

    // Logic for discussion filter
    const discussionResults = allResults
      .filter((r) => adminTeamFilter === 0 || r.team_id === adminTeamFilter)
      .sort((a, b) => a.username.localeCompare(b.username));

    content = (
      <>
        <div className="flex justify-between items-center mb-8 border-b-4 border-[#00ff41] pb-2">
          <h2 className="text-2xl font-black italic uppercase bg-[#00ff41] text-black px-2">
            Admin Terminal
          </h2>
          <button
            onClick={() => setView("login")}
            className="text-xs underline"
          >
            LOGOUT
          </button>
        </div>

        <div className="space-y-8">
          {/* Teams Management */}
          <div className="border-2 border-[#00ff41]/30 p-6 bg-[#111]/30">
            <h3 className="font-bold uppercase flex items-center gap-2 mb-4 border-b border-[#00ff41]/10 pb-2">
              <Users size={18} /> Gestione Unità
            </h3>
            <div className="max-h-80 overflow-y-auto pr-2 pt-4 custom-scrollbar relative">
              <div className="flex flex-col gap-2 mb-4">
                {teamsList
                  .sort((a, b) => a.id - b.id)
                  .map((t) => {
                    // Find the script name for this command
                    const scenarioName =
                      scenarios.find((s) => s.id === t.current_scenario)
                        ?.name || "Default";
                    return (
                      <div
                        key={t.id}
                        className="flex justify-between items-center bg-[#0a0a0a] border border-[#00ff41]/20 p-2 hover:border-[#00ff41]/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {/* CHECKBOX 1: Unlock Results  */}
                          <div className="relative group/check1">
                            <input
                              type="checkbox"
                              checked={t.is_unlocked}
                              onChange={async () => {
                                await updateTeamStatusAction(
                                  t.id,
                                  !t.is_unlocked,
                                );
                                setTeamsList(await getTeamsAction());
                              }}
                              className="appearance-none w-5 h-5 border-2 border-[#00ff41]/40 bg-black checked:bg-[#00ff41] checked:border-[#00ff41] cursor-pointer relative shrink-0"
                            />
                            {/* Custom Tooltip for Checkbox 1 */}
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/check1:block group-active/check1:block z-50 pointer-events-none">
                              <div className="bg-[#00ff41] text-black text-[7px] font-black uppercase px-2 py-0.5 whitespace-nowrap shadow-[0_0_10px_#00ff41]">
                                Sblocca Risultati
                              </div>
                              <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-[#00ff41] ml-1"></div>
                            </div>
                          </div>

                          {/* CHECKBOX 2: Commander Assigned */}
                          <div className="relative group/check2">
                            <input
                              type="checkbox"
                              checked={t.has_commander}
                              onChange={async () => {
                                await updateCommanderStatusAction(
                                  t.id,
                                  !t.has_commander,
                                );
                                setTeamsList(await getTeamsAction());
                              }}
                              className="appearance-none w-5 h-5 border-2 border-amber-500/40 bg-black checked:bg-amber-500 checked:border-amber-500 cursor-pointer relative shrink-0"
                            />
                            {/* Custom Tooltip for Checkbox 2 */}
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/check2:block group-active/check2:block z-50 pointer-events-none">
                              <div className="bg-amber-500 text-black text-[7px] font-black uppercase px-2 py-0.5 whitespace-nowrap shadow-[0_0_10px_#f59e0b]">
                                Status Comandante
                              </div>
                              <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-amber-500 ml-1"></div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-25 md:max-w-50">
                            {t.name}
                          </span>
                        </div>

                        {/* Action icons*/}
                        <div className="flex items-center gap-2">
                          {/* (Tooltip) */}
                          <div className="relative group/tooltip flex items-center">
                            {/* The icon that is hovered over or clicked */}
                            <FileText
                              size={14}
                              className="text-[#00ff41]/40 hover:text-[#00ff41] cursor-help transition-colors"
                            />
                            {/* The tooltip window itself */}
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block group-active/tooltip:block z-50">
                              <div className="bg-[#00ff41] text-black text-[9px] font-black uppercase px-2 py-1 whitespace-nowrap shadow-[0_0_10px_#00ff41]">
                                Scenario: {scenarioName}
                              </div>
                              {/* A small triangular arrow */}
                              <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-[#00ff41] ml-auto mr-1"></div>
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteTeam(t.id!)}
                            className="text-red-500/50 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/*Add Team area */}
            <div className="flex flex-col sm:flex-row gap-2 border-t border-[#00ff41]/20 pt-4">
              <select
                className="flex-1 bg-black text-[#00ff41] text-xs border border-[#00ff41]/40 p-2 outline-none cursor-pointer min-h-9.5"
                value={selectedScenarioForNewTeam}
                onChange={(e) => setSelectedScenarioForNewTeam(e.target.value)}
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id} className="bg-black">
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddTeam}
                className="whitespace-nowrap border-2 border-dashed border-[#00ff41]/30 px-4 py-2 text-[10px] uppercase font-bold hover:bg-[#00ff41]/10 transition-colors sm:w-auto w-full"
              >
                + CREA SQUADRA
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-4 border-2 border-[#00ff41]/30 p-6 bg-[#111]/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#00ff41]/30 pb-2 gap-4">
            <h3 className="font-bold uppercase flex items-center gap-2 text-[#00ff41]">
              <Save size={18} /> Registro Risultati
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              {/* REFRESH Result DATA */}
              <button
                onClick={async () => {
                  // Fetch fresh data from the Database
                  const freshResults = await getResultsAction();
                  // Update the global results state
                  setAllResults(freshResults);
                }}
                className="text-[10px] border border-[#00ff41] px-2 py-1 text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-colors uppercase font-bold flex items-center gap-2 group"
                title="Sincronizza con il Database"
              >
                <RefreshCcw
                  size={12}
                  className="group-hover:rotate-180 transition-transform duration-500"
                />
                Refresh
              </button>

              {/* DELETE data BUTTON */}
              {adminTeamFilter === 0 ? (
                <button
                  onClick={handleDeleteAllResults}
                  className="text-[10px] border border-red-600 px-2 py-1 text-red-500 hover:bg-red-600 hover:text-white transition-colors uppercase font-bold"
                >
                  Clear All Database
                </button>
              ) : (
                <button
                  onClick={() => handleDeleteTeamResults(adminTeamFilter)}
                  className="text-[10px] border border-amber-600 px-2 py-1 text-amber-500 hover:bg-amber-600 hover:text-white transition-colors uppercase font-bold"
                >
                  Clear {teamsList.find((t) => t.id === adminTeamFilter)?.name}{" "}
                  Records
                </button>
              )}

              {/* TEAM FILTER FOR ADMIN */}
              <div className="flex items-center gap-2 bg-black border border-[#00ff41]/50 p-1">
                <span className="text-[10px] px-2 opacity-50 uppercase italic font-bold">
                  Filtra per Team:
                </span>
                <select
                  className="bg-transparent text-[#00ff41] text-xs outline-none cursor-pointer uppercase font-bold"
                  value={adminTeamFilter}
                  onChange={(e) => setAdminTeamFilter(Number(e.target.value))}
                >
                  <option value={0}>Tutti i Team</option>
                  {teamsList.map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                      className="bg-black text-[#00ff41]"
                    >
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-2 md:mx-0">
            <table className="w-full text-left border-collapse min-w-300px">
              <thead>
                <tr className="bg-[#00ff41] text-black uppercase text-[9px] md:text-[10px] font-black">
                  <th className="p-2 border border-black w-50px md:w-auto">
                    Data
                  </th>
                  <th className="p-2 border border-black">User</th>
                  <th className="p-2 border border-black hidden sm:table-cell">
                    Team
                  </th>
                  <th className="p-2 border border-black text-right w-40px">
                    Pts
                  </th>
                  <th className="p-2 border border-black text-center w-80px">
                    Cmd
                  </th>
                </tr>
              </thead>
              <tbody className="text-[10px] md:text-[11px] uppercase">
                {filteredAdminResults.length > 0 ? (
                  filteredAdminResults.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#00ff41]/10 hover:bg-[#00ff41]/5"
                    >
                      {/* DATE: Short format for mobile */}
                      <td className="p-2 opacity-60 whitespace-nowrap">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString([], {
                              day: "2-digit",
                              month: "2-digit",
                            })
                          : "N/A"}
                        <span className="hidden md:inline">
                          {r.created_at &&
                            `/${new Date(r.created_at).getFullYear().toString().slice(-2)}`}
                        </span>
                      </td>

                      {/* USERNAME: Wraps if long */}
                      <td className="p-2 font-bold wrap-break-word max-w-80px md:max-w-none">
                        {r.username}
                      </td>

                      {/* TEAM: Hidden on very small screens, visible on tablets/desktop */}
                      <td className="p-2 italic opacity-80 truncate hidden sm:table-cell">
                        {r.team_name}
                      </td>

                      {/* SCORE */}
                      <td className="p-2 font-black text-[#00ff41] text-right">
                        {r.score}
                      </td>

                      {/* ACTIONS: Icons for mobile, Text+Icons for desktop */}
                      <td className="p-2">
                        <div className="flex justify-center gap-2 md:gap-4">
                          <button
                            onClick={() => {
                              setSelectedUserDetail(r);
                              setPrevView("admin");
                              setView("user-detail");
                            }}
                            className="text-[#00ff41] hover:text-white transition-colors p-1"
                            title="Dettagli"
                          >
                            <Info size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteResult(r.id!)}
                            className="text-red-500 hover:text-white transition-colors p-1"
                            title="Elimina"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center opacity-50 italic"
                    >
                      Nessun dato.
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
              setPrevView("admin");
              setView("leaderboard");
            }}
            className="border-2 border-[#00ff41] py-3 hover:bg-[#00ff41] hover:text-black uppercase font-bold text-xs"
          >
            1. Registro Risultati (Con Punteggi)
          </button>

          <button
            onClick={() => {
              if (adminTeamFilter === 0) {
                triggerModal(
                  "alert",
                  "Selezionare una squadra per avviare la discussione.",
                );
              } else {
                setPrevView("admin");
                setView("discussion-list");
              }
            }}
            className="border-2 border-amber-500 py-3 text-amber-500 hover:bg-amber-500 hover:text-black uppercase font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            2. Avvia Modalità Discussione (Senza Punteggi)
          </button>
        </div>
      </>
    );
  }
  return (
    <CRTWrapper>
      {content}
      {/* 1. ANALYSIS ANIMATION LAYER */}
      {isAnalyzing && (
        <AnalysisSequence
          onComplete={() => {
            setIsAnalyzing(false); // Hide animation
            setView("discussion-list"); // Show results
          }}
        />
      )}

      {/* 2. MODAL LAYER */}
      <RetroModal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        value={modal.value}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (modal.type === "prompt") {
            // If you see an authorization message, check your password
            if (modal.message.includes("Autorizzazione")) {
              executeAdminAuth();
            } else {
              // Otherwise, this involves adding a new command
              executeAddTeam();
            }
          } else {
            // If it's a “confirm” or “alert,” just trigger the action
            modal.action();
          }
        }}
        onChange={(val) => setModal((prev) => ({ ...prev, value: val }))}
      />
    </CRTWrapper>
  );
}
