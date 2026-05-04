"use client";
import React, { useState, useEffect, useRef } from "react";

import { QRCodeCanvas } from "qrcode.react";

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
  CircleSlash,
  MessageSquare,
  Globe,
  QrCode,
  Copy,
  Download,
  X,
  LockOpen,
  UserCheck,
  UserPlus,
} from "lucide-react";

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
  checkTeamStatusAction,
  deleteResultsByTeamAction,
  updateCommanderStatusAction,
  checkCommanderStatusAction,
  addTeamWithPlayersAction,
  updatePlayerResultAction,
  addSinglePlayerAction,
  wipeEntireDatabaseAction,
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

// UI Localization
interface Language {
  id: string;
  name: string;
  file: string;
}

interface Localization {
  [key: string]: string; // Allows loc.any_key_name
}

// --- CONSTANTS FOR ADMIN MODE ---
const ADMIN_PASSWORD = "adm"; // Password to prevent players from seeing game results
const ADMIN_USER = "admin";

// --- CONSTANTS FOR primary Language ---
const PRIMARY_LANG = "it";

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
      }, index * 300);
    });
    // 3. Complete after some time
    const timeout = setTimeout(onComplete, 3000);
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
  loc,
}: {
  isOpen: boolean;
  type: "alert" | "confirm" | "prompt" | "prompt-area";
  message: string;
  value?: string;
  onClose: () => void;
  onConfirm: () => void;
  onChange?: (val: string) => void;
  loc: any; // for localization
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
            ? `> ${loc.modal_title_confirm || "Richiesta Conferma"}`
            : type === "prompt" || type === "prompt-area"
              ? `> ${loc.modal_title_input || "Input Richiesto"}`
              : `> ${loc.modal_title_system || "Messaggio Sistema"}`}
        </h3>

        <p className="text-[#00ff41] mb-6 uppercase text-sm leading-relaxed tracking-wide">
          {message}
        </p>

        {type === "prompt-area" ? (
          <textarea
            autoFocus
            className="w-full h-40 bg-[#001100] border-2 border-[#00ff41] p-2 text-[#00ff41] outline-none mb-6 focus:bg-[#003300] uppercase font-mono text-xs"
            placeholder="Inserire un nome per riga..."
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : type === "prompt" ? (
          <input
            autoFocus
            className="w-full bg-[#001100] border-2 border-[#00ff41] p-2 text-[#00ff41] outline-none mb-6 focus:bg-[#003300] uppercase font-mono"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
          />
        ) : null}

        <div className="flex justify-end gap-4">
          {type !== "alert" && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#00ff41]/50 text-[#00ff41]/50 hover:text-[#00ff41] uppercase text-xs font-bold"
            >
              {loc.msg_modal_cancel || "Annulla"}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#00ff41] text-black font-black uppercase text-xs hover:bg-white transition-colors"
          >
            {type === "confirm"
              ? loc.msg_modal_confirm || "Conferma"
              : loc.msg_modal_exit || "Esegui"}
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
  const [story, setStory] = useState({
    title: "Loading...",
    plot: "",
    logo: "login_page.png",
  });
  const [items, setItems] = useState<SurvivalItem[]>([]);
  const [staticItems, setStaticItems] = useState<SurvivalItem[]>([]);
  const [evaluations, setEvaluations] = useState<ScoreEvaluation[]>([]);
  //List of all available scripts from JSON
  const [scenarios, setScenarios] = useState<
    { id: string; file: string; name: string; language: string }[]
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
  const [adminTeamFilter, setAdminTeamFilter] = useState<string>("all");
  const [newTeamName, setNewTeamName] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  //QrCode
  const [shareData, setShareData] = useState<{
    name: string;
    url: string;
  } | null>(null);

  // --- LOCALIZATION STATES ---
  const [availableLangs, setAvailableLangs] = useState<Language[]>([]);
  const [currentLangId, setCurrentLangId] = useState<string>(PRIMARY_LANG); // Default
  const [loc, setLoc] = useState<Localization>({}); // The current dictionary

  // Computed helper
  const currentTeamName =
    teamsList.find((t) => t.id === teamId)?.name || "NASA";

  // Auto Refresh timer component:
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const resultsSnapshotRef = useRef<GameResult[]>([]);

  // Global Modal System
  type ModalType = "alert" | "confirm" | "prompt" | "prompt-area";
  enum ModalMode {
    IDLE = "IDLE",
    ADMIN_AUTH = "ADMIN_AUTH",
    ADD_TEAM = "ADD_TEAM",
    ADD_PLAYER = "ADD_PLAYER",
  }

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    mode: ModalMode;
    message: string;
    value: string;
    action: () => void;
  }>({
    isOpen: false,
    type: "alert",
    mode: ModalMode.IDLE,
    message: "",
    value: "",
    action: () => {},
  });

  const triggerModal = (
    type: ModalType,
    mode: ModalMode,
    message: string,
    action?: () => void,
  ) => {
    setModal({
      isOpen: true,
      type,
      mode,
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
    async function initializeSystem() {
      console.log("SYSTEM: Initializing...");
      try {
        // 1. We load everything we need from the files and the database at the same time
        const [resScen, resLang, teams, results] = await Promise.all([
          fetch("/data/scenarios.json").then((r) => r.json()),
          fetch("/languages/localization.json").then((r) => r.json()),
          getTeamsAction(),
          getResultsAction(),
        ]);

        setScenarios(resScen);
        setAvailableLangs(resLang);
        setTeamsList(teams);
        setAllResults(results);

        // 2. Processing URL parameters
        const params = new URLSearchParams(window.location.search);
        const teamFromUrl = params.get("team");
        const userFromUrl = params.get("user");
        const langFromUrl = params.get("lang");

        // Language set
        if (langFromUrl) {
          console.log("SYSTEM: Setting language from URL:", langFromUrl);
        }

        //  Let's set the command
        if (teamFromUrl) {
          setTeamId(Number(teamFromUrl));
        }

        if (userFromUrl) {
          setUsername(userFromUrl);
          // Processing URL parameters
          const player = results.find(
            (r) => r.username === userFromUrl && r.score === -1,
          );
          if (player) setTeamId(player.team_id);
        }

        console.log("SYSTEM: Ready.");
      } catch (error) {
        console.error("CRITICAL ERROR:", error);
        triggerModal("alert", ModalMode.IDLE, loc.msg_modal_sinx);
      }
    }
    initializeSystem();
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
    // 1. DETERMINE THE TARGET COMMAND ID
    // If we're viewing a player's details, we use their team. If not, we use the player's current team.
    const targetTeamId =
      selectedUserDetail &&
      (view === "user-detail" || view === "discussion-list")
        ? selectedUserDetail.team_id
        : teamId;

    // 2. Search for a team in the list
    const targetTeam = teamsList.find((t) => t.id === targetTeamId);

    // 3. We're looking for a script configuration for this command
    const foundConfig = scenarios.find(
      (s) => s.id === targetTeam?.current_scenario,
    );

    if (targetTeamId !== 0 && foundConfig) {
      const scenarioFile = foundConfig.file;
      const scenarioName = foundConfig.name;

      const loadSpecificScenario = async () => {
        try {
          console.log(`SYSTEM: Syncing mission data for [${scenarioName}]...`);
          const response = await fetch(`/data/${scenarioFile}`);
          if (!response.ok) throw new Error("Scenario XML not found");

          const xmlString = await response.text();
          const parsedData = parseStoryXml(xmlString);

          // We'll sync all the data from the XML
          setCurrentLangId(parsedData.story.language);
          setStory(parsedData.story);
          setStaticItems(parsedData.items);
          setEvaluations(parsedData.evaluations);

          // only if we're in game mode
          if (view === "game" || view === "login") {
            setItems([...parsedData.items].sort(() => Math.random() - 0.5));
          }
        } catch (err) {
          console.error("Failed to load scenario XML:", err);
        }
      };

      loadSpecificScenario();
    }
    // selectedUserDetail for the XML loads when any player is clicked
  }, [teamId, selectedUserDetail, view, scenarios, teamsList]);

  useEffect(() => {
    async function init() {
      // Load scenario manifest
      const res = await fetch("/data/scenarios.json");
      if (!res.ok) throw new Error("Manifest not found");
      const manifest = await res.json();
      setScenarios(manifest);

      // LOADING THE LIST OF LANGUAGES
      const resLang = await fetch("/languages/localization.json");
      const langManifest = await resLang.json();
      setAvailableLangs(langManifest);

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

  // --- EFFECT: DICTIONARY LOADER ---
  // Triggers every time currentLangId changes
  useEffect(() => {
    async function loadDictionary() {
      try {
        const response = await fetch(`/languages/${currentLangId}.json`);
        const data = await response.json();
        setLoc(data); // We are updating all the text in the interface
      } catch (e) {
        console.error("Lang Load Error", e);
      }
    }
    loadDictionary();
  }, [currentLangId]);

  /**
   * XML PARSER
   * Converts XML string from public/story.xml into JavaScript objects
   */
  const parseStoryXml = (xmlString: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const title = xmlDoc.getElementsByTagName("Title")[0]?.textContent || "";
    const plot = xmlDoc.getElementsByTagName("Plot")[0]?.textContent || "";
    const logo =
      xmlDoc.getElementsByTagName("Logo")[0]?.textContent || "login_page.png";
    const scenarioLang =
      xmlDoc.getElementsByTagName("Language")[0]?.textContent || PRIMARY_LANG;
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
    return {
      story: { title, plot, language: scenarioLang, logo },
      evaluations,
      items,
    };
  };

  /**
   * UNIVERSAL DATA FILTERING LOGIC
   * Filters results based on "all", "scen:id", or "team:id"
   */
  const isAdmin = username.toLowerCase() === "admin";

  const getEffectiveResults = () => {
    // 1. If it's a regular PLAYER, we always show only their team
    if (!isAdmin) {
      return allResults.filter((r) => r.team_id === teamId);
    }

    // 2. If this is ADMIN, we'll follow your algorithm for strings
    if (adminTeamFilter === "all") return allResults;

    if (adminTeamFilter.startsWith("scen:")) {
      const targetScenId = adminTeamFilter.split(":")[1];
      return allResults.filter((r) => {
        const team = teamsList.find((t) => t.id === r.team_id);
        return team?.current_scenario === targetScenId;
      });
    }

    if (adminTeamFilter.startsWith("team:")) {
      const targetTeamId = parseInt(adminTeamFilter.split(":")[1]);
      return allResults.filter((r) => r.team_id === targetTeamId);
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
    if (a.username === "Commander") return -1;
    if (b.username === "Commander") return 1;
    return a.username.localeCompare(b.username);
  });

  // For the leaderboard (sorted by Commander -> Points)
  const leaderboardResults = getEffectiveResults().sort((a, b) => {
    if (a.username === "Commander") return -1;
    if (b.username === "Commander") return 1;
    return a.score - b.score;
  });

  // Audio playback function
  const playBeep = () => {
    const audio = new Audio("/sounds/soft_beep.wav");
    audio.volume = 0.4; // Не слишком громко
    audio
      .play()
      .catch((e) => console.log("Audio play blocked by browser policy"));
  };

  // Saving QrCode
  const downloadQRCode = () => {
    const canvas = document.getElementById(
      "qr-code-canvas",
    ) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `ARES_ACCESS_${shareData?.name.toUpperCase()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  /**
   * SMART AUTO-REFRESH (Admin Only)
   * Works on Admin, Leaderboard, and Discussion views for the administrator.
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isAdmin = username.toLowerCase() === "admin";

    // Condition: Only for admins on authorized screens
    const isAllowedView =
      view === "admin" || view === "leaderboard" || view === "discussion-list";

    if (isAdmin && isAllowedView && isAutoRefresh) {
      interval = setInterval(async () => {
        if (document.hidden) return;

        try {
          console.log(`SYSTEM: Auto-sync active for [${view}]...`);

          const [freshResults, freshTeams] = await Promise.all([
            getResultsAction(),
            getTeamsAction(),
          ]);

          // --- LOGIC OF THE AUDIO SIGNAL (Using Snapshot Ref)
          const prevResults = resultsSnapshotRef.current;

          // 1. Checking for new players
          const hasNewEntries = freshResults.length > prevResults.length;

          // 2. Check for completed games
          const prevPendingCount = prevResults.filter(
            (r) => r.score === -1,
          ).length;
          const newPendingCount = freshResults.filter(
            (r) => r.score === -1,
          ).length;
          const hasNewFinishes = newPendingCount < prevPendingCount;

          if (hasNewEntries || hasNewFinishes) {
            console.log("SYSTEM: New telemetry received!");
            playBeep();
          }

          // Updating statuses
          setAllResults(freshResults);
          setTeamsList(freshTeams);
        } catch (error) {
          console.error("Auto-sync error:", error);
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
      return triggerModal("alert", ModalMode.IDLE, loc.msg_modal_name);
    }
    // ADMIN CHECK
    if (username.toLowerCase() === ADMIN_USER) {
      setModal({
        isOpen: true,
        type: "prompt",
        mode: ModalMode.ADMIN_AUTH,
        message: loc.msg_modal_admincode,
        value: "",
        action: () => {},
      });
      return;
    }
    if (teamId === 0) {
      return triggerModal("alert", ModalMode.IDLE, loc.msg_modal_team);
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
    //Save rusult to DB
    try {
      if (username === "Commander") {
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
      console.error("Failed to save result:", error);
      triggerModal("alert", ModalMode.IDLE, loc.msg_modal_saveerror);
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
      mode: ModalMode.IDLE,
      message: loc.msg_modal_teamdelete,
      value: "",
      action: async () => {
        await deleteTeamAction(id);
        setTeamsList(await getTeamsAction());
        setAllResults(await getResultsAction());
        setAdminTeamFilter("all");
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Logic for adding a team
  const handleAddTeam = () => {
    if (!newTeamName.trim()) {
      return triggerModal("alert", ModalMode.IDLE, loc.msg_modal_teamname);
    }
    setModal({
      isOpen: true,
      type: "prompt-area",
      mode: ModalMode.ADD_TEAM,
      message: `${loc.msg_modal_new} [${newTeamName.toUpperCase()}]`,
      value: "",
      action: () => {},
    });
  };

  const executeAddTeam = async () => {
    // Parsing player names from a TextArea
    const playerNames = modal.value
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

    if (playerNames.length === 0) {
      return triggerModal("alert", ModalMode.IDLE, loc.msg_modal_teamcrea);
    }

    try {
      //  We use `newTeamName` and `selectedScenarioForNewTeam` from  states
      await addTeamWithPlayersAction(
        newTeamName.trim(),
        selectedScenarioForNewTeam,
        playerNames,
      );

      // Updating data
      setTeamsList(await getTeamsAction());
      setAllResults(await getResultsAction());

      // Clean the form and close the modal window
      setNewTeamName("");
      setModal((prev) => ({ ...prev, isOpen: false, value: "" }));
    } catch (error) {
      console.error(error);
      triggerModal("alert", ModalMode.IDLE, loc.msg_modal_saveerror);
    }
  };

  const executeAdminAuth = () => {
    if (modal.value.toLowerCase() === ADMIN_PASSWORD) {
      // Pass
      setModal((prev) => ({ ...prev, isOpen: false, value: "" }));
      setView("admin");
    } else {
      // Wrong password
      triggerModal("alert", ModalMode.IDLE, loc.msg_modal_wrongpass);
    }
  };

  // Delete a specific player result
  const handleDeleteResult = (id: number) => {
    setModal({
      isOpen: true,
      type: "confirm",
      mode: ModalMode.IDLE,
      message: loc.msg_modal_recorddel,
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
      type: "confirm",
      mode: ModalMode.IDLE,
      message: loc.msg_modal_cleardb,
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
    const teamName = teamsList.find((t) => t.id === teamId)?.name;
    triggerModal(
      "confirm",
      ModalMode.IDLE,
      `${loc.msg_confirm_clear_team || "Cancellare tutti i record di"} [${teamName}]?`,
      async () => {
        try {
          await deleteResultsByTeamAction(teamId); // Экшен тоже ждет число
          setAllResults(await getResultsAction());
          setModal((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error(error);
        }
      },
    );
  };

  // Action for team member becoming Commander
  const handleBecomeCommander = async () => {
    // 1. CHECK: Have all the players on the team finished the test?
    // We're looking for players on your team with a score of -1 in the overall results list
    const missingPlayers = allResults.filter(
      (r) => r.team_id === teamId && r.score === -1,
    );

    if (missingPlayers.length > 0) {
      // If there is even one person who hasn't finished, we stop the process
      const names = missingPlayers.map((p) => p.username).join(", ");

      return triggerModal(
        "alert",
        ModalMode.IDLE,
        `${loc.msg_team_not_ready}: 
       ${loc.msg_waiting_for}: ${names}`,
      );
    }
    // 2. If everyone is ready, let's show the standard confirmation procedure
    triggerModal(
      "confirm",
      ModalMode.IDLE,
      loc.msg_modal_commander,
      async () => {
        //  Check the database to see if the slot is available
        const alreadyHas = await checkCommanderStatusAction(teamId);
        if (alreadyHas) {
          setModal((prev) => ({ ...prev, isOpen: false }));
          triggerModal("alert", ModalMode.IDLE, loc.msg_modal_commError);
          return;
        }

        await updateCommanderStatusAction(teamId, true);
        setUsername("Commander");

        // We're shuffling the items for the final team score
        setItems([...staticItems].sort(() => Math.random() - 0.5));
        setView("game");
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    );
  };

  // Action for adding new member  to existing team
  const handleAddSinglePlayer = () => {
    if (!adminTeamFilter.startsWith("team:")) {
      return triggerModal(
        "alert",
        ModalMode.IDLE,
        loc.msg_err_select_team ||
          "ERRORE: Seleziona una squadra specifica (non l'intero scenario) per aggiungere un colono.",
      );
    }

    const targetTeamId = parseInt(adminTeamFilter.split(":")[1]);
    const teamName = teamsList.find((t) => t.id === targetTeamId)?.name || "";

    setModal({
      isOpen: true,
      type: "prompt",
      mode: ModalMode.ADD_PLAYER,
      message: `${loc.msg_modal_newinit} [${teamName.toUpperCase()}]:`,
      value: "",
      action: () => {},
    });
  };

  // Action for deleting all teams and, consequently, all results
  const handleWipeEverything = () => {
    setModal({
      isOpen: true,
      type: "confirm",
      mode: ModalMode.IDLE,
      message: loc.msg_confirm_wipe_system,
      value: "",
      action: async () => {
        try {
          // 1. Initiate a full deletion
          await wipeEntireDatabaseAction();
          // 2. Мгновенно очищаем локальные списки
          setTeamsList([]);
          setAllResults([]);
          // 3. Set the filter to “all”
          setAdminTeamFilter("all");
          // 4. Closing the modal window
          setModal((prev) => ({ ...prev, isOpen: false }));

          console.log("SYSTEM: Full database wipe complete.");
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  // Function used for save (called from a modal window)
  const executeAddSinglePlayer = async () => {
    if (modal.value.trim() && adminTeamFilter.startsWith("team:")) {
      const targetTeamId = parseInt(adminTeamFilter.split(":")[1]);

      try {
        await addSinglePlayerAction(targetTeamId, modal.value);
        setAllResults(await getResultsAction());
        setModal((prev) => ({ ...prev, isOpen: false, value: "" }));
      } catch (error) {
        console.error("Error adding player:", error);
        triggerModal("alert", ModalMode.IDLE, loc.msg_saveplayer);
      }
    } else {
      triggerModal("alert", ModalMode.IDLE, loc.msg_selectteam);
    }
  };

  // Image block
  const MissionImageBlock = ({
    src,
    isFullWidth,
  }: {
    src: string;
    isFullWidth: boolean;
  }) => (
    <div
      className={`${isFullWidth ? "w-full" : "max-w-md mx-auto"} border border-[#00ff41]/30 bg-black relative overflow-hidden group shadow-[0_0_15px_rgba(0,255,65,0.1)] transition-all duration-700`}
    >
      {/* Corner decorative elements */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff41]"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff41]"></div>

      <img
        src={`/img/${src}`}
        alt="Mission Visual"
        className={`w-full ${isFullWidth ? "h-64 md:h-80" : "h-48"} object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-1000  hover:grayscale-0`}
      />

      {/* Text caption */}
      <div className="absolute bottom-2 left-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-red-600 animate-pulse rounded-full"></div>
        <span className="text-[8px] uppercase tracking-[0.3em] text-[#00ff41]/70 font-black">
          Ares-1 Live Stream
        </span>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
    </div>
  );

  /**
   * VIEW ENGINE
   * Determines which screen to render into the CRTWrapper.
   */
  let content;
  if (view === "login") {
    // 1. Filter the commands that haven't finished yet (is_unlocked === false)
    const activeTeams = teamsList.filter((t) => !t.is_unlocked);
    // 2. Filter players for the SELECTED team who have not yet played (score === -1)
    const availablePlayers = allResults
      .filter((r) => r.team_id === teamId && r.score === -1)
      .sort((a, b) => a.username.localeCompare(b.username));
    content = (
      <>
        <Header title={loc.login_header || "Mission Login"} />
        {/* --- Image block --- */}
        <MissionImageBlock src={"login_page.png"} isFullWidth={false} />
        {/* --- LOGIN FORM--- */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto py-4 ">
          {/* SELECTOR 1: TEAM SELECTION (Grouped by scenarios) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase opacity-50 font-bold tracking-widest">
              {loc.login_team_label || "Seleziona Unità:"}
            </label>
            <select
              className="w-full bg-black border-2 border-[#00ff41] p-3 outline-none cursor-pointer text-sm font-bold uppercase"
              value={teamId}
              onChange={(e) => {
                setTeamId(Number(e.target.value));
                setUsername(""); // Reset the name when changing teams
              }}
            >
              <option value={0}>{loc.login_select_team}</option>
              {scenarios.map((scen) => {
                const teamsInScen = activeTeams.filter(
                  (t) => t.current_scenario === scen.id,
                );
                if (teamsInScen.length === 0) return null;
                return (
                  <optgroup
                    key={scen.id}
                    label={scen.name.toUpperCase()}
                    className="bg-[#002200] text-[#00ff41]"
                  >
                    {teamsInScen.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* SELECTOR 2: PLAYER SELECTION */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase opacity-50 font-bold tracking-widest">
              {loc.login_operator_label || "Identificativo Operatore:"}
            </label>
            <select
              className={`w-full bg-black border-2 p-3 outline-none cursor-pointer text-sm font-bold uppercase transition-all ${
                teamId === 0 && username !== "admin"
                  ? "border-[#00ff41]/20 opacity-50"
                  : "border-[#00ff41]"
              }`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            >
              <option value="">{loc.login_select_prompt}</option>
              {/* ADMIN IS ALWAYS AVAILABLE */}
              <option value="admin" className="text-amber-500 font-black">
                {loc.login_select_admin}
              </option>
              {/* PLAYERS APPEAR ONLY AFTER A TEAM IS SELECTED */}
              {teamId !== 0 && (
                <optgroup label={`${loc.login_select_group}`}>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.username}>
                      {p.username}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <button onClick={handleStart} className={BUTTON_STYLES.primary}>
            {loc.btn_start_main}
          </button>
        </div>
      </>
    );
  } else if (view === "story") {
    content = (
      <>
        <Header title={story.title} />
        <div className="my-6 px-4 md:px-10">
          <MissionImageBlock src={story.logo} isFullWidth={true} />
        </div>
        <div className="space-y-6 text-lg  leading-relaxed">
          <p className="bg-[#003300] p-4 border-l-8 border-[#00ff41]">
            {story.plot}
          </p>
          <div className="p-4 border border-[#00ff41] border-dashed">
            <h3 className="font-bold mb-2">{loc.lb_protocol}:</h3>
            <ul className="list-disc list-inside text-sm space-y-1 opacity-80">
              <li>{loc.lb_instruct_1}</li>
              <li>{loc.lb_instruct_2}</li>
            </ul>
          </div>
          <button
            onClick={() => setView("game")}
            className="w-full flex items-center justify-center gap-4 border-2 border-[#00ff41] py-4 hover:bg-[#00ff41] hover:text-black font-bold uppercase"
          >
            {loc.btn_start_game} <ChevronRight />
          </button>
        </div>
      </>
    );
  } else if (view === "game") {
    content = (
      <>
        <div className="flex justify-between items-end mb-6">
          <div className="text-xs">
            {loc.lb_operator} {username}
            <br />
            {loc.lb_team} {currentTeamName}
          </div>
          <h2 className="text-xl font-bold uppercase tracking-widest">
            {loc.lb_configuration}
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
          {loc.btn_sendreport}
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
          {isAdmin && (
            <button
              onClick={() => setView("admin")}
              className="text-xs flex items-center gap-1 hover:underline"
            >
              <ArrowLeft size={14} /> {loc.btn_admin}
            </button>
          )}

          <h2 className="text-lg font-bold uppercase italic tracking-tighter">
            {loc.btn_report} {currentTeam?.name}
          </h2>
          <motion.div
            // Rotation animation: if isRefreshing = true, rotate 360 degrees
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
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

        <div className="space-y-2 mb-8">
          {leaderboardResults.map((res) => {
            // A commander always gets results. An ordinary player—unless their score is -1.
            const hasResult = res.score !== -1 || res.username === "Commander";
            //  Button color: Amber for the commander, Green for those ready, Red for those waiting
            const btnColorClass =
              res.username === "Commander"
                ? "bg-amber-500"
                : hasResult
                  ? "bg-[#00ff41]"
                  : "bg-red-600 animate-pulse";
            return (
              <div
                key={res.id}
                className={`flex justify-between items-center p-3 border ${
                  res.username === "Commander"
                    ? "bg-[#38180670] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-[#111] border-[#00ff41]/20"
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
                    if (!hasResult) {
                      // If there is no result, display an error message
                      triggerModal(
                        "alert",
                        ModalMode.IDLE,
                        loc.msg_modal_nodata,
                      );
                      return;
                    }
                    // If there's a result, let's move on to the details
                    setSelectedUserDetail(res);
                    setShowDeltas(false);
                    setPrevView("discussion-list");
                    setView("user-detail");
                  }}
                  className={`${btnColorClass} text-black px-4 py-1 text-[10px] font-black uppercase transition-colors`}
                >
                  {loc.btn_analise || "Analizza"}
                </button>
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
                const isAdmin = username.toLowerCase() === "admin";
                let teamIdToUnlock: number = 0;

                if (isAdmin) {
                  if (adminTeamFilter.startsWith("team:")) {
                    teamIdToUnlock = parseInt(adminTeamFilter.split(":")[1]);
                  } else if (adminTeamFilter.startsWith("scen:")) {
                    // Optional: if you want to unlock the entire script
                    return triggerModal(
                      "alert",
                      ModalMode.IDLE,
                      "Seleziona una squadra specifica per sbloccare i risultati.",
                    );
                  }
                } else {
                  teamIdToUnlock = teamId;
                }
                // Security check
                if (teamIdToUnlock === 0)
                  return triggerModal(
                    "alert",
                    ModalMode.IDLE,
                    "Seleziona un team.",
                  );

                // CALL ACTION (Now pass a number)
                await updateTeamStatusAction(teamIdToUnlock, true);

                // Refresh data
                setTeamsList(await getTeamsAction());

                if (username === "Commander") {
                  setView("results");
                } else {
                  triggerModal(
                    "alert",
                    ModalMode.IDLE,
                    loc.msg_modal_missioncomlite,
                  );
                }
              }}
              className={BUTTON_STYLES.primary}
            >
              {loc.btn_unblock}
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
                      ModalMode.IDLE,
                      loc.msg_modal_nocommandr,
                    );
                }}
                className="border-2 border-[#00ff41] text-[#00ff41] py-4 font-black uppercase text-sm hover:bg-[#00ff41] hover:text-black transition-all"
              >
                {loc.btn_request}
              </button>

              {/* We display the “Become Commander” button only if it isn't already there */}
              {!currentTeam?.has_commander && (
                <button
                  onClick={handleBecomeCommander}
                  className="border-2 border-amber-500 text-amber-500 py-4 font-black uppercase text-sm hover:bg-amber-500 hover:text-black transition-all"
                >
                  {loc.btn_commander}
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
        <Header title={loc.result_lb_analis} />
        {/* PLAYER INFO BAR */}
        <div className="text-center mb-4">
          <div className="inline-block border border-[#00ff41] px-4 py-1 text-[14px] uppercase tracking-[0.2em] bg-[#00ff41]/10">
            {loc.lb_operator} <span className="text-white">{username}</span> |{" "}
            {loc.lb_team} <span className="text-white">{currentTeamName}</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-4xl font-black mb-2">{currentScore} (110) </div>
          <div className="text-sm uppercase tracking-[0.3em] mb-0 opacity-70">
            {loc.lb_points}
          </div>
          <div className="text-xs text-white/80 italic mb-4">
            ({loc.lb_explane})
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
            {loc.lb_classific}
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
            {isAdmin ? "Admin" : loc.result_lb_res}
          </button>
          <h2 className="text-xl font-bold uppercase">{loc.lb_statuscol}</h2>

          <motion.div
            // Rotation animation: if isRefreshing = true, rotate 360 degrees
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
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
        <div className="space-y-2">
          {/* TABLE HEADERS - Adjusted for mobile grid */}
          <div className="grid grid-cols-[1.5fr_1fr_45px_35px] md:grid-cols-4 text-[10px] uppercase opacity-50 px-4 mb-2">
            <span>Name</span>
            <span>Team</span>
            <span className="text-right">Pts</span>
            <span className="text-right md:pr-2">Info</span>
          </div>

          {leaderboardResults.map((res) => {
            const isCommEntry = res.username === "Commander";
            // Проверка наличия результата
            const hasResult = res.score !== -1 || isCommEntry;

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
                      if (!hasResult) {
                        triggerModal(
                          "alert",
                          ModalMode.IDLE,
                          loc.msg_no_results || "Rapporto non disponibile.",
                        );
                        return;
                      }
                      setSelectedUserDetail(res);
                      setShowDeltas(true);
                      setPrevView("leaderboard");
                      setView("user-detail");
                    }}
                    className={`p-1 ${isCommEntry ? "text-amber-500" : hasResult ? "text-[#00ff41]" : "text-red-600"}`}
                  >
                    <ChevronRight size={18} />
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
              {loc.result_lb_newmiss}
            </button>
            <p className="text-[10px] text-center mt-4 opacity-50 uppercase tracking-widest">
              {loc.result_lb_atten}
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
            <ArrowLeft size={14} />{" "}
          </button>

          <div className="mb-8">
            <div className="text-center mb-4">
              <div className="inline-block border border-[#00ff41] px-4 py-1 text-[14px] uppercase tracking-[0.2em] bg-[#00ff41]/10">
                {loc.lb_operator}{" "}
                <span className="text-white">
                  {selectedUserDetail.username}
                </span>{" "}
                | {loc.lb_team}{" "}
                <span className="text-white">
                  {selectedUserDetail.team_name}
                </span>
              </div>
            </div>

            <div className="mt-2 flex justify-center ">
              {showDeltas ? (
                <div className="text-sm font-black uppercase tracking-tight text-[#00ff41] flex items-baseline gap-2">
                  <span>{loc.lb_nasapoints}</span>
                  <span className="text-2xl underline decoration-double">
                    {selectedUserDetail.score}
                  </span>
                </div>
              ) : (
                <div className="inline-block text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-1 border border-amber-500/30 uppercase tracking-widest animate-pulse">
                  {loc.lb_status}
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
                        {loc.lb_discussione}
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
    // ---  UNIVERSAL FILTERING LOGIC ---
    const resultsFilteredByMenu = allResults.filter((r) => {
      // If “All Teams” is selected
      if (adminTeamFilter === "all") return true;

      // If a specific scenario (scen:id) is selected
      if (adminTeamFilter.startsWith("scen:")) {
        const targetScenId = adminTeamFilter.split(":")[1];
        // Let's check what scenario this player's team is facing
        const teamOfPlayer = teamsList.find((t) => t.id === r.team_id);
        return teamOfPlayer?.current_scenario === targetScenId;
      }

      // If a specific team (team:id) is selected
      if (adminTeamFilter.startsWith("team:")) {
        const targetTeamId = parseInt(adminTeamFilter.split(":")[1]);
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
    const discussionResults = [...resultsFilteredByMenu].sort((a, b) =>
      a.username.localeCompare(b.username),
    );

    content = (
      <>
        <div className="flex justify-between items-center mb-8 border-b-4 border-[#00ff41] pb-2 ">
          <h2 className="text-2xl font-black italic uppercase bg-[#00ff41] text-black px-2 ">
            {loc.admin_lb_terminal}
          </h2>
          <button
            onClick={() => setView("login")}
            className="text-xs underline pl-3"
          >
            {loc.admin_lb_LOGOUT}
          </button>
        </div>

        {/* Settings Section */}
        <div className="border-2 border-[#00ff41]/30 p-4 bg-[#111]/30 mt-8">
          <h3 className="font-bold uppercase flex items-center gap-2 mb-4 border-b border-[#00ff41]/10 pb-2 text-[#00ff41]">
            <Globe size={18} /> {loc.admin_lb_localiz}
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase opacity-50">
              {loc.admin_lb_lang}
            </label>
            <select
              className="w-full bg-black text-[#00ff41] text-xs border border-[#00ff41]/40 p-2 outline-none appearance-none cursor-pointer"
              value={currentLangId}
              onChange={(e) => setCurrentLangId(e.target.value)}
            >
              {/* CHECK: If the array is empty, display a placeholder */}
              {availableLangs.length === 0 ? (
                <option>{loc.admin_lb_langload}</option>
              ) : (
                availableLangs.map((l) => (
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
                    <th
                      className="p-2 border border-black w-9 text-center cursor-help"
                      title={loc.admin_msg_chkresults}
                    >
                      <LockOpen size={14} className="mx-auto" />
                    </th>

                    {/* Header 2: Commander Status  */}
                    <th
                      className="p-2 border border-black w-9 text-center cursor-help"
                      title={loc.admin_msg_chkcomander}
                    >
                      <UserCheck size={14} className="mx-auto" />
                    </th>

                    <th className="p-2 border border-black overflow-hidden">
                      {loc.admin_lb_teamname}
                    </th>

                    {/* Header 3: Scenario  */}
                    <th className="p-2 border border-black w-15 md:w-60">
                      {loc.admin_lb_scename}
                    </th>

                    <th className="p-2 border border-black w-12 text-center">
                      CMD
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[10px] uppercase">
                  {teamsList
                    .sort((a, b) => a.id - b.id)
                    .map((t) => {
                      const scenarioName =
                        scenarios.find((s) => s.id === t.current_scenario)
                          ?.name || "Default";

                      return (
                        <tr
                          key={t.id}
                          className="border-b border-[#00ff41]/10 hover:bg-[#00ff41]/5 transition-colors"
                        >
                          {/* Checkbox 1: Unlock */}
                          <td className="p-2 text-center">
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
                              className="appearance-none w-4 h-4 border border-[#00ff41]/40 bg-black checked:bg-[#00ff41] cursor-pointer relative"
                            />
                          </td>

                          {/* Checkbox 2: Commander */}
                          <td className="p-2 text-center">
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
                              className="appearance-none w-4 h-4 border border-amber-500/40 bg-black checked:bg-amber-500 cursor-pointer relative"
                            />
                          </td>

                          {/* Team Name */}
                          <td className="p-2 font-bold truncate">{t.name}</td>

                          {/* SCENARIO: Desktop Text, Mobile Left-side Tooltip */}
                          <td className="p-2 opacity-70">
                            <span className="hidden md:block truncate">
                              {scenarioName}
                            </span>
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
                                  const scenario = scenarios.find(
                                    (s) => s.id === t.current_scenario,
                                  );
                                  const url = `${window.location.origin}?team=${t.id}&lang=${scenario?.language || "en"}`;
                                  setShareData({
                                    name: `${t.name}`,
                                    url,
                                  });
                                }}
                                className="text-[#00ff41] hover:text-white transition-colors p-1"
                                title={loc.admin_msg_teamQr}
                              >
                                <QrCode size={14} />
                              </button>

                              {/* Delete Action */}
                              <button
                                onClick={() => handleDeleteTeam(t.id!)}
                                className="text-red-500 hover:text-white transition-colors p-1"
                              >
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
                onChange={(e) => setSelectedScenarioForNewTeam(e.target.value)}
              >
                {scenarios.map((s) => (
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
                onChange={(e) => setNewTeamName(e.target.value)}
              />

              {/* 3. Create button  */}
              <button
                onClick={handleAddTeam}
                className="whitespace-nowrap border-2 border-dashed border-[#00ff41]/30 px-4 py-2 text-[12px] uppercase font-bold hover:bg-[#00ff41]/10 transition-colors sm:w-auto w-full"
              >
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
                    isAutoRefresh
                      ? "border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]"
                      : "border-[#00ff41]/30 text-[#00ff41]/40"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 ${isAutoRefresh ? "bg-[#00ff41] animate-pulse shadow-[0_0_8px_#00ff41]" : "bg-black border border-[#00ff41]/30"}`}
                  ></div>
                  <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                    Auto-Sync: {isAutoRefresh ? "ON" : "OFF"}
                  </span>
                </button>

                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    const [freshResults, freshTeams] = await Promise.all([
                      getResultsAction(),
                      getTeamsAction(),
                    ]);
                    setAllResults(freshResults);
                    setTeamsList(freshTeams);
                    setTimeout(() => setIsRefreshing(false), 500);
                  }}
                  className="px-3 py-1 border border-[#00ff41]/30 text-[#00ff41]/60 hover:border-[#00ff41] transition-all flex items-center gap-2 group text-[9px] font-black uppercase tracking-widest"
                >
                  <motion.div
                    animate={{ rotate: isRefreshing ? 360 : 0 }}
                    transition={{ duration: 0.5, ease: "linear" }}
                    className="flex"
                  >
                    <RefreshCcw size={12} />
                  </motion.div>
                  <span className="whitespace-nowrap">
                    {loc.admin_lb_refresh}
                  </span>
                </button>

                <div className="h-6 w-px bg-[#00ff41]/20 mx-1 hidden lg:block"></div>
              </div>

              {/* GROUP 2: DATA OPERATIONS (Delete, Filter, Add) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0 lg:justify-end">
                {/* DELETE ALL BUTTON */}
                <button
                  onClick={handleWipeEverything}
                  className="px-3 py-1.5 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase transition-all shadow-[0_0_10px_rgba(220,38,38,0.2)] shrink-0"
                  title={loc.tooltip_wipe_all}
                >
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
                    onChange={(e) => setAdminTeamFilter(e.target.value)}
                  >
                    {/* 1. General filter */}
                    <option value="all" className="bg-black text-[#00ff41]">
                      -- {loc.filter_all || "TUTTI I RISULTATI"} --
                    </option>

                    {/* 2. We only consider scenarios that contain at least one command */}
                    {scenarios
                      .filter((scen) =>
                        teamsList.some((t) => t.current_scenario === scen.id),
                      )
                      .map((scen) => (
                        <React.Fragment key={scen.id}>
                          {/* SELECTED SCENARIO (marked with an asterisk) */}
                          <option
                            value={`scen:${scen.id}`}
                            className="bg-[#002200] text-amber-500 font-black italic"
                          >
                            * {scen.name.toUpperCase()}
                          </option>

                          {/* COMMANDS IN THIS SCRIPT */}
                          {teamsList
                            .filter((t) => t.current_scenario === scen.id)
                            .sort((a, b) => a.id - b.id)
                            .map((t) => (
                              <option
                                key={t.id}
                                value={`team:${t.id}`}
                                className="bg-black text-[#00ff41]"
                              >
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
                    title={loc.admin_msg_addteam}
                  >
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
                  filteredAdminResults.map((r) => {
                    const isPending = r.score === -1;
                    return (
                      <tr
                        key={r.id}
                        // Add a very light orange background to the entire line if the player is “waiting”
                        className={`border-b border-[#00ff41]/10 transition-colors ${
                          isPending
                            ? "bg-amber-500/5 hover:bg-amber-500/10"
                            : "hover:bg-[#00ff41]/5"
                        }`}
                      >
                        {/* DATE: Short format for mobile */}
                        <td
                          className={`p-2 whitespace-nowrap ${isPending ? "text-amber-500/50" : "opacity-60"}`}
                        >
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
                        <td
                          className={`p-2 font-bold wrap-break-word max-w-80px md:max-w-none ${
                            isPending ? "text-amber-500" : ""
                          }`}
                        >
                          {r.username}
                          {isPending && (
                            <span className="ml-2 text-[8px] animate-pulse">
                              [LOAD...]
                            </span>
                          )}
                        </td>

                        {/* TEAM: Hidden on very small screens, visible on tablets/desktop */}
                        <td
                          className={`p-2 italic truncate hidden sm:table-cell ${
                            isPending
                              ? "text-amber-500 opacity-100"
                              : "text-[#00ff41] opacity-60"
                          }`}
                        >
                          {r.team_name}
                        </td>

                        {/* SCORE */}
                        <td
                          className={`p-2 font-black text-right ${isPending ? "text-amber-500" : "text-[#00ff41]"}`}
                        >
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
                                const team = teamsList.find(
                                  (t) => t.id === r.team_id,
                                );
                                const scenario = scenarios.find(
                                  (s) => s.id === team?.current_scenario,
                                );
                                const lang = scenario?.language || PRIMARY_LANG;
                                // To create the link: your current address + player name
                                const url = `${window.location.origin}?user=${encodeURIComponent(r.username)}&lang=${lang}`;
                                setShareData({ name: r.username, url });
                              }}
                              className={`${isPending ? "text-amber-500" : "text-[#00ff41]"} hover:text-white transition-colors p-1`}
                              title={loc.admin_msg_qr}
                            >
                              <QrCode size={18} />{" "}
                            </button>
                            <button
                              onClick={() => handleDeleteResult(r.id!)}
                              className="text-red-500 hover:text-white transition-colors p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center opacity-50 italic"
                    >
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
              setPrevView("admin");
              setView("leaderboard");
            }}
            className="border-2 border-[#00ff41] py-3 hover:bg-[#00ff41] hover:text-black uppercase font-bold text-xs"
          >
            {loc.admin_btn_results}
          </button>

          <button
            onClick={() => {
              if (adminTeamFilter === "all") {
                triggerModal(
                  "alert",
                  ModalMode.IDLE,
                  loc.msg_err_select_team  ||
                    "Selezionare un Team o uno Scenario per avviare la discussione.",
                );
              } else {
                setPrevView("admin");
                setView("discussion-list");
              }
            }}
            className="border-2 border-amber-500 py-3 text-amber-500 hover:bg-amber-500 hover:text-black uppercase font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            {loc.admin_btn_dicusion}
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
        onClose={() =>
          setModal((prev) => ({ ...prev, isOpen: false, mode: ModalMode.IDLE }))
        }
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
        onChange={(val) => setModal((prev) => ({ ...prev, value: val }))}
        loc={loc}
      />

      {/* QR ACCESS MODAL */}
      {shareData && (
        <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm border-4 border-[#00ff41] bg-black p-6 shadow-[0_0_50px_rgba(0,255,65,0.4)] text-center relative"
          >
            <button
              onClick={() => setShareData(null)}
              className="absolute top-2 right-2 text-[#00ff41]/50 hover:text-[#00ff41]"
            >
              <X size={20} />
            </button>

            <h3 className="text-[#00ff41] font-black uppercase mb-6 italic border-b border-[#00ff41]/30 pb-2">
              {loc.modal_msg_qr}
              {shareData.name}
            </h3>

            {/* QR CODE CANVAS */}
            <div className="bg-[#00ff41] p-3 inline-block mb-6 shadow-[0_0_20px_rgba(0,255,65,0.3)]">
              <QRCodeCanvas
                id="qr-code-canvas"
                value={shareData.url}
                size={200}
                level={"H"}
                bgColor={"#00ff41"}
                fgColor={"#000000"}
                includeMargin={false}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-[#001100] border border-[#00ff41]/30 p-2 overflow-hidden">
                <span className="text-[9px] text-[#00ff41] truncate flex-1 font-mono opacity-70">
                  {shareData.url}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareData.url);
                  }}
                  className="text-[#00ff41] hover:text-white"
                >
                  <Copy size={16} />
                </button>
              </div>

              <button
                onClick={downloadQRCode}
                className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-xs hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} /> {loc.admin_msg_qrsave} (PNG)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </CRTWrapper>
  );
}
