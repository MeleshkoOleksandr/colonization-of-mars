"use client";
import React, { useState, useEffect } from "react";
import {
  Reorder,
  AnimatePresence,
  motion,
  useDragControls,
} from "framer-motion";

import {
  Monitor,
  Save,
  ChevronRight,
  User,
  Users,
  Trash2,
  Edit,
  RefreshCcw,
  ArrowLeft,
  GripVertical,
  Info,
} from "lucide-react";

// --- Working with DB Server Actions ---
import {
  getTeamsAction,
  saveResultAction,
  getResultsAction,
  addTeamAction,
  deleteTeamAction,
  deleteResultAction,
  deleteAllResultsAction,
} from "./actions";

import { Team, GameResult } from "../../lib/db";

// --- UI COMPONENTS ---
const CRTWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0a0a0a] text-[#00ff41] font-mono p-4 md:p-8 relative overflow-hidden selection:bg-[#00ff41] selection:text-black">
    {/* Scanline Effect */}
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
 * DRAGGABLE ITEM COMPONENT
 * Each item has its own drag controls to allow dragging only via the handle.
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
          src={`/${item.photo}`}
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
 * ANALYSIS SEQUENCE COMPONENT
 * Displays a retro-loading screen with scrolling logs and a progress bar.
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
    // Используем h-full и overflow-hidden, чтобы ничего не вылезало за края
    <div className="fixed inset-0 z-200 bg-black text-[#00ff41] font-mono p-6 flex flex-col overflow-hidden">
      {/* Главный контейнер с ограничением по высоте */}
      <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-4 md:py-10">
        {/* 1. БЛОК ЛОГОВ (Теперь занимает всё свободное место) */}
        <div className="flex-1 min-h-0 mb-6 relative">
          <div className="absolute inset-0 overflow-hidden flex flex-col justify-end border-l border-[#00ff41]/20 pl-4">
            <AnimatePresence>
              {logs.slice(-8).map(
                (
                  log,
                  i, // Показываем только последние 8 строк на мобильных
                ) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] md:text-xs leading-tight mb-2 flex gap-2"
                  >
                    <span className="opacity-40 shrink-0 hidden xs:inline">
                      [
                      {new Date().toLocaleTimeString([], { second: "2-digit" })}
                      s]
                    </span>
                    <span>{log}</span>
                  </motion.div>
                ),
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 2. БЛОК ПРОГРЕСС-БАРА (Фиксированный размер) */}
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

        {/* 3. ДЕКОРАТИВНЫЙ ФУТЕР (Уменьшен еще сильнее) */}
        <div className="shrink-0 mt-8 grid grid-cols-3 gap-2 opacity-30 text-[7px] md:text-[8px] uppercase border-t border-[#00ff41]/10 pt-4">
          <div className="animate-pulse">CPU: 98%</div>
          <div className="animate-pulse delay-75">O2: OK</div>
          <div className="animate-pulse delay-150">TMP: -64C</div>
        </div>
      </div>

      {/* Эффект сканирования специально для этого экрана */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px] opacity-10"></div>
    </div>
  );
};

/**
 * CUSTOM RETRO MODAL
 * Replaces browser's alert, confirm, and prompt.
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

// --- Data types ---
interface SurvivalItem {
  id: string;
  name: string;
  photo: string;
  idealPosition: number;
  description: string;
}

interface UserResult {
  username: string;
  team: string;
  score: number;
  selections: string[];
}

export default function MarsSurvivalGame() {
  const [view, setView] = useState<
    | "login"
    | "story"
    | "game"
    | "results"
    | "admin"
    | "leaderboard"
    | "user-detail"
  >("login");

  // Initial empty states
  const [story, setStory] = useState({ title: "Caricamento...", plot: "" });
  // --- States ---
  const [username, setUsername] = useState("");
  const [items, setItems] = useState<SurvivalItem[]>([]); // Drag & Drop list
  const [staticItems, setStaticItems] = useState<SurvivalItem[]>([]); // To keep original list for deltas
  const [allResults, setAllResults] = useState<GameResult[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<GameResult | null>(null);
  // team data
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<number>(0);
  const currentTeamName =
    teamsList.find((t) => t.id === teamId)?.name || "Anonimo";

  //Counting rusults
  const [currentScore, setCurrentScore] = useState<number>(0);

  //For results loading aniamtion
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Inside MarsSurvivalGame component:
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

  // Filter for admin view
  const [adminTeamFilter, setAdminTeamFilter] = useState<number>(0);
  // Remember where to go back from 'user-detail' view
  const [prevView, setPrevView] = useState<"leaderboard" | "admin">(
    "leaderboard",
  );

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

    return { story: { title, plot }, items };
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
        const response = await fetch("/story.xml");
        if (!response.ok)
          throw new Error("Could not find story.xml in /public");

        const xmlString = await response.text();
        const parsedData = parseStoryXml(xmlString);

        // Update story and items from XML
        setStory(parsedData.story);
        setStaticItems(parsedData.items);

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
        // Optional: Show error message to user via our custom Modal
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

  const handleStart = () => {
    // Replace standard alert with our new Modal
    if (!username) {
      setModal({
        isOpen: true,
        type: "alert",
        message:
          "Identificazione fallita. Inserire un nome operatore per procedere.",
        value: "",
        action: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    if (username.toLowerCase() === "admin") {
      setView("admin");
      return;
    }

    if (teamId === 0) {
      setModal({
        isOpen: true,
        type: "alert",
        message:
          "Unità non selezionata. Selezionare una squadra per la missione.",
        value: "",
        action: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
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

    // 1. Сохраняем результат текущего игрока в отдельную переменную
    setCurrentScore(totalScore);
    setIsAnalyzing(true);

    const resultData = {
      username,
      team_id: teamId,
      score: totalScore,
      selections: items.map((i) => i.id),
    };

    try {
      await saveResultAction(resultData);
      // Обновляем общий список в фоне
      const updatedResults = await getResultsAction();
      setAllResults(updatedResults);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const getScoreMessage = (s: number) => {
    if (s <= 20) return "ECCELLENTE. Elon Musk sarebbe fiero di te!";
    if (s <= 35) return "BUONO. Arriverai alla base, seppur con fatica.";
    if (s <= 50)
      return "SUFFICIENTE. Probabilmente finirai l'energia a metà strada.";
    return "DISASTRO. I tuoi resti saranno concime per patate marziane.";
  };

  // ---  Handlers ---
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
      await addTeamAction(modal.value);
      setTeamsList(await getTeamsAction());
      // Close and clear input
      setModal((prev) => ({ ...prev, isOpen: false, value: "" }));
    }
  };

  //HANDLER: Delete a specific player result
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

  //HANDLER: Delete all result
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

  // Define a variable to hold the screen content
  let content;
  // --- VIEWS ---
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
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase">Unità di Assegnazione:</label>
            <select
              className="w-full bg-black border-2 border-[#00ff41] p-3 outline-none appearance-none cursor-pointer"
              value={teamId}
              onChange={(e) => setTeamId(Number(e.target.value))}
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
                      src={`/${item.photo}`}
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
    // Если зашел админ и у него выбран фильтр в админке — показываем только этот фильтр.
    // Если фильтра нет (0) или это не админ — обычная логика.
    const effectiveTeamId = isAdmin ? adminTeamFilter : teamId;

    const filteredResults =
      isAdmin && effectiveTeamId === 0
        ? allResults
        : allResults.filter((res) => res.team_id === effectiveTeamId);

    content = (
      <>
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#00ff41] pb-2">
          <button
            // Используем prevView, чтобы вернуться либо в results, либо в admin
            onClick={() => setView(prevView)}
            className="text-xs flex items-center gap-1 hover:underline"
          >
            <ArrowLeft size={14} />{" "}
            {prevView === "admin" ? "Torna all'Admin" : "Indietro"}
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
          {/* 1. TABLE HEADERS - Adjusted for mobile grid */}
          <div className="grid grid-cols-[1.5fr_1fr_45px_35px] md:grid-cols-4 text-[10px] uppercase opacity-50 px-4 mb-2">
            <span>Nome</span>
            <span>Team</span>
            <span className="text-right">Pts</span>
            <span className="text-right md:pr-2">Info</span>
          </div>

          {filteredResults
            .sort((a, b) => a.score - b.score)
            .map((res) => (
              <div
                key={res.id}
                // Responsive grid: wider for name, narrow for score/action
                className="grid grid-cols-[1.5fr_1fr_45px_35px] md:grid-cols-4 items-center bg-[#111] p-3 md:p-4 border border-[#00ff41]/20 hover:border-[#00ff41] gap-2"
              >
                {/* NAME: Allow wrapping and multi-line for long names */}
                <span className="font-bold text-xs md:text-sm leading-tight wrap-break-word pr-2">
                  {res.username}
                </span>

                {/* TEAM: Small and truncated to save space */}
                <span className="text-[10px] md:text-xs opacity-70 truncate uppercase">
                  {res.team_name}
                </span>

                {/* SCORE: Bold and aligned */}
                <span className="text-right font-black text-[#00ff41] text-xs md:text-base">
                  {res.score}
                </span>

                {/* ACTION: Icon instead of text on mobile */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedUserDetail(res);
                      setPrevView("leaderboard");
                      setView("user-detail");
                    }}
                    className="text-[#00ff41] hover:text-white p-1"
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
            ))}
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

          <h2 className="text-2xl font-bold uppercase tracking-tighter">
            Analisi: {selectedUserDetail.username}
          </h2>

          <div className="text-sm opacity-70 italic">
            Team: {selectedUserDetail.team_name} | Score:{" "}
            {selectedUserDetail.score}
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
                  <div className="text-[9px] opacity-50 uppercase italic leading-none mb-1">
                    NASA: {item?.idealPosition}
                  </div>
                  <div
                    className={`text-sm font-black leading-none ${
                      diff === 0 ? "text-green-400" : "text-amber-500"
                    }`}
                  >
                    Δ {diff}
                  </div>
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
    ).sort((a, b) => a.score - b.score); // NASA logic: lower score is better
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
          <div className="space-y-4 border-2 border-[#00ff41]/30 p-4">
            <h3 className="font-bold uppercase flex items-center gap-2">
              <Users size={18} /> Gestione Team
            </h3>
            <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                {teamsList
                  .sort((a, b) => a.id - b.id)
                  .map((t) => (
                    <div
                      key={t.id} // 1. Use DB ID as key
                      className="flex justify-between items-center bg-[#111] p-2 text-sm"
                    >
                      {/* 2. Access the name property of the object */}
                      <span>{t.name}</span>
                      <button
                        // 3. Call a new function to delete from DB
                        onClick={() => handleDeleteTeam(t.id)}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            {/* Update the Add Team button */}
            <button
              onClick={handleAddTeam}
              className="text-[10px] border border-[#00ff41] p-1 w-full hover:bg-[#00ff41] hover:text-black"
            >
              + AGGIUNGI TEAM
            </button>
          </div>
        </div>
        <div className="space-y-4 border-2 border-[#00ff41]/30 p-6 bg-[#111]/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#00ff41]/30 pb-2 gap-4">
            <h3 className="font-bold uppercase flex items-center gap-2 text-[#00ff41]">
              <Save size={18} /> Registro Risultati
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              {/* DELETE ALL BUTTON */}
              <button
                onClick={handleDeleteAllResults}
                className="text-[10px] border border-red-600 px-2 py-1 text-red-500 hover:bg-red-600 hover:text-white transition-colors uppercase font-bold"
              >
                Clear All Database
              </button>

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

        <button
          onClick={() => {
            // 1. Указываем, что нужно вернуться в админку
            setPrevView("admin");
            // 2. Переходим в таблицу лидеров
            setView("leaderboard");
          }}
          className="w-full mt-8 border-2 border-[#00ff41] py-3 hover:bg-[#00ff41] hover:text-black uppercase font-bold transition-all"
        >
          Visualizza Classifica{" "}
          {adminTeamFilter !== 0
            ? `Team: ${teamsList.find((t) => t.id === adminTeamFilter)?.name}`
            : "Completa"}
        </button>
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
            setView("results"); // Show results
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
        onConfirm={modal.type === "prompt" ? executeAddTeam : modal.action}
        onChange={(val) => setModal((prev) => ({ ...prev, value: val }))}
      />
    </CRTWrapper>
  );
}
