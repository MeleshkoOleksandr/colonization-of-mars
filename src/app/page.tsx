"use client";
import React, { useState, useEffect } from "react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
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
} from "lucide-react";

// --- Working with DB Server Actions ---
import {
  getTeamsAction,
  saveResultAction,
  getResultsAction,
  addTeamAction,
  deleteTeamAction,
  deleteResultAction,
} from "./actions";
import { Team, GameResult } from "../../lib/db";

// --- UI COMPONENTS ---
const CRTWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0a0a0a] text-[#00ff41] font-mono p-4 md:p-8 relative overflow-hidden selection:bg-[#00ff41] selection:text-black">
    {/* Scanline Effect */}
    <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-30"></div>
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
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>

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

// --- Initial data ---
const INITIAL_STORY = {
  title: "Sopravvivenza nella Valle Marineris",
  plot: "Siete i membri di una squadra di coloni d'avanguardia diretti verso la cupola principale della base <Ares-1>. Durante la discesa, il vostro rover cargo è stato investito da una violenta tempesta di sabbia e si è ribaltato a 150 chilometri dalla destinazione. I sistemi di supporto vitale del rover sono fuori uso e le comunicazioni con la base sono interrotte. Il vostro obiettivo: percorrere 150 km nel deserto marziano fino alla base. Indossate le tute spaziali, ma le risorse sono limitate. Di seguito sono elencati i 15 oggetti rimasti intatti dopo l'incidente.",
};

const INITIAL_ITEMS: SurvivalItem[] = [
  {
    id: "o2",
    name: "Bombole di ossigeno compresso ad alta concentrazione",
    photo: "item_01.jpg",
    idealPosition: 1,
    description: "Senza ossigeno la morte è immediata. Priorità assoluta.",
  },
  {
    id: "rtg",
    name: "RTG compatto (generatore termico a radioisotopi)",
    photo: "item_06.jpg",
    idealPosition: 2,
    description: "Mantiene il calore vitale contro i -60°C di Marte.",
  },
  {
    id: "nav",
    name: "Unità di navigazione inerziale (giroscopio)",
    photo: "item_03.jpg",
    idealPosition: 3,
    description: "Essenziale per non perdersi: su Marte non c'è GPS.",
  },
  {
    id: "water",
    name: "Dissalatore-condensatore portatile (estrae umidità dal suolo)",
    photo: "item_02.jpg",
    idealPosition: 4,
    description: "L'acqua è fondamentale per un viaggio di 150 km.",
  },
  {
    id: "seal",
    name: "Bomboletta di sigillante liquido per materiali compositi",
    photo: "item_04.jpg",
    idealPosition: 5,
    description: "Riparare una microfrattura nella tuta è vitale.",
  },
  {
    id: "food",
    name: "Tubetti di pasta proteica ipercalorica",
    photo: "item_07.jpg",
    idealPosition: 6,
    description: "Energia per i 3-5 giorni di cammino previsti.",
  },
  {
    id: "tent",
    name: "Tenda gonfiabile ermetica (camera di compensazione temporanea)",
    photo: "item_10.jpg",
    idealPosition: 7,
    description: "Permette di riposare fuori dalla tuta spaziale.",
  },
  {
    id: "solar",
    name: "Set di pannelli solari flessibili",
    photo: "item_05.jpg",
    idealPosition: 8,
    description: "Ricarica i sistemi della tuta nel lungo periodo.",
  },
  {
    id: "med",
    name: "Kit pronto soccorso",
    photo: "item_12.jpg",
    idealPosition: 9,
    description: "Per trattare ferite o infezioni durante il tragitto.",
  },
  {
    id: "rope",
    name: "Corda in Kevlar (30m)",
    photo: "item_08.jpg",
    idealPosition: 10,
    description: "Utile per superare canyon e crepacci.",
  },
  {
    id: "laser",
    name: "Telemetro / puntatore laser",
    photo: "item_11.jpg",
    idealPosition: 11,
    description: "Segnalazione visiva per squadre di soccorso.",
  },
  {
    id: "blanket",
    name: "Foglio metallico con rivestimento in titanio (coperta termica)",
    photo: "item_14.jpg",
    idealPosition: 12,
    description: "Isolante extra, ma poco efficace contro il gelo estremo.",
  },
  {
    id: "n2",
    name: "Bombola di azoto compresso",
    photo: "item_09.jpg",
    idealPosition: 13,
    description: "Non respirabile. Pericolosa se usata come propulsore.",
  },
  {
    id: "comp",
    name: "Bussola magnetica",
    photo: "item_15.jpg",
    idealPosition: 14,
    description: "Inutile: Marte non ha un campo magnetico globale.",
  },
  {
    id: "fire",
    name: "Accenditore al plasma",
    photo: "item_13.jpg",
    idealPosition: 15,
    description: "Inutile: l'atmosfera di CO2 non permette combustione.",
  },
];

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
  // --- States ---
  const [username, setUsername] = useState("");
  const [items, setItems] = useState<SurvivalItem[]>([]);
  const [allResults, setAllResults] = useState<GameResult[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<GameResult | null>(null);

  // ОСТАВЛЯЕМ ТОЛЬКО ЭТО ОБЪЯВЛЕНИЕ:
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<number>(0);
  const [story, setStory] = useState(INITIAL_STORY);

  const currentTeamName =
    teamsList.find((t) => t.id === teamId)?.name || "Anonimo";

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
   * INITIALIZATION
   * Loads teams and results from the Database and shuffles items locally.
   */
  useEffect(() => {
    async function loadInitialData() {
      try {
        // 1. Fetch all teams from DB for the login dropdown
        const teams = await getTeamsAction();
        setTeamsList(teams);

        // 2. Fetch all previous results from DB for the leaderboard
        const results = await getResultsAction();
        setAllResults(results);

        console.log("Database connection: SUCCESS");
      } catch (error) {
        console.error("Database connection: FAILED", error);
      }
    }
    // Start the loading process
    loadInitialData();
    // 3. Shuffle game items for the sorting task (local state)
    setItems([...INITIAL_ITEMS].sort(() => Math.random() - 0.5));
  }, []);

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
    // Добавляем async, так как работаем с БД
    let totalScore = 0;
    items.forEach((item, index) => {
      totalScore += Math.abs(index + 1 - item.idealPosition);
    });

    // Создаем объект результата для базы данных
    const newResult: GameResult = {
      username,
      team_id: teamId, // Используем актуальный ID команды
      score: totalScore,
      selections: items.map((i) => i.id),
    };

    try {
      // Сохраняем в базу данных через Server Action
      await saveResultAction(newResult);

      // Сразу обновляем список всех результатов с сервера, чтобы увидеть себя в таблице
      const updatedResults = await getResultsAction();
      setAllResults(updatedResults);

      setView("results");
    } catch (error) {
      console.error("Failed to save result:", error);
      alert("Errore nel salvataggio dei dati. Riprova.");
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
          className="space-y-2"
        >
          {items.map((item, index) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className="group bg-[#111] border-2 border-[#00ff41]/30 p-3 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-[#00ff41] transition-colors"
            >
              <span className="text-2xl font-black w-10 text-[#00ff41]/40 group-hover:text-[#00ff41]">
                {index + 1}
              </span>
              <div className="w-24 h-24 bg-[#222] border border-[#00ff41]/20 flex items-center justify-center text-[10px] text-center">
                <img
                  src={`/${item.photo}`}
                  alt={item.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  draggable="false"
                  onError={(e) => {
                    // No image found
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/50?text=NA";
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="uppercase font-bold text-sm">{item.name}</div>
              </div>
            </Reorder.Item>
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
    const lastResult = allResults[allResults.length - 1];
    content = (
      <>
        <Header title="Analisi Sopravvivenza" />
        {/* PLAYER INFO BAR */}
        <div className="text-center mb-6">
          <div className="inline-block border border-[#00ff41] px-4 py-1 text-[10px] uppercase tracking-[0.2em] bg-[#00ff41]/10">
            Operatore: <span className="text-white">{username}</span> | Team:{" "}
            <span className="text-white">{currentTeamName}</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl font-black mb-2">{lastResult.score}</div>
          <div className="text-sm uppercase tracking-[0.3em] mb-4">
            Punti di Deviazione
          </div>
          <p className="text-xl italic bg-[#00ff41] text-black p-2 font-bold uppercase">
            {getScoreMessage(lastResult.score)}
          </p>
        </div>

        <div className="grid gap-4 mb-8 border border-[#00ff41]/30 p-4 bg-black/50">
          {INITIAL_ITEMS.sort((a, b) => a.idealPosition - b.idealPosition).map(
            (item) => (
              <div
                key={item.id}
                className="text-xs border-b border-[#00ff41]/20 pb-2"
              >
                <span className="text-[#00ff41] font-bold">
                  {item.idealPosition}. {item.name}
                </span>
                <p className="opacity-70 mt-1 italic">{item.description}</p>
              </div>
            ),
          )}
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
    const filteredResults = isAdmin
      ? allResults // Admin sees everyone
      : allResults.filter((res) => res.team_id === teamId); // Player sees ONLY their team_id

    // Update the Title too:
    const leaderboardTitle = isAdmin
      ? "Global Ranking (All Teams)"
      : `Ranking Team: ${currentTeamName}`;

    content = (
      <>
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#00ff41] pb-2">
          <button
            onClick={() => setView("results")}
            className="text-xs flex items-center gap-1 hover:underline"
          >
            <ArrowLeft size={14} /> Indietro
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
          <div className="grid grid-cols-4 text-[10px] uppercase opacity-50 px-4">
            <span>Nome</span>
            <span>Team</span>
            <span className="text-right">Score</span>
            <span className="text-right">Azione</span>
          </div>
          {filteredResults
            .sort((a, b) => a.score - b.score)
            .map((res, i) => (
              <div
                key={i}
                className="grid grid-cols-4 items-center bg-[#111] p-4 border border-[#00ff41]/20 hover:border-[#00ff41]"
              >
                <span className="font-bold truncate">{res.username}</span>
                <span className="text-xs opacity-70">
                  {res.team_name || "Unknown Team"}
                </span>

                <span className="text-right font-black">{res.score}</span>
                <button
                  onClick={() => {
                    setSelectedUserDetail(res);
                    setPrevView("leaderboard"); // Remember we came from Leaderboard
                    setView("user-detail");
                  }}
                  className="text-right text-[10px] underline hover:text-white"
                >
                  DETTAGLI
                </button>
              </div>
            ))}
        </div>
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

        <div className="space-y-1 text-xs">
          {selectedUserDetail.selections.map((itemId: string, idx: number) => {
            // Finding the item details from our local INITIAL_ITEMS array
            const item = INITIAL_ITEMS.find((i) => i.id === itemId);
            const diff = Math.abs(idx + 1 - (item?.idealPosition || 0));
            return (
              <div
                key={itemId}
                className="flex justify-between p-2 border-b border-[#00ff41]/10 bg-black/30"
              >
                <span>
                  {idx + 1}. {item?.name}
                </span>
                <span
                  className={diff === 0 ? "text-green-400" : "text-amber-500"}
                >
                  NASA: {item?.idealPosition} (Δ{diff})
                </span>
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
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>{/* ... headers (same as before) ... */}</thead>
              <tbody className="text-[11px] uppercase">
                {filteredAdminResults.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#00ff41]/10 hover:bg-[#00ff41]/5"
                  >
                    <td className="p-2 opacity-60">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="p-2 font-bold">{r.username}</td>
                    <td className="p-2 opacity-80">{r.team_name}</td>
                    <td className="p-2 font-black text-[#00ff41]">{r.score}</td>
                    <td className="p-2 flex justify-center gap-4">
                      {/* VIEW DETAILS BUTTON  */}
                      <button
                        onClick={() => {
                          setSelectedUserDetail(r);
                          setPrevView("admin"); // Remember we came from Admin
                          setView("user-detail");
                        }}
                        className="text-[#00ff41] hover:underline"
                      >
                        DETAILS
                      </button>
                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => handleDeleteResult(r.id!)}
                        className="text-red-500 hover:underline"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={() => setView("leaderboard")}
          className="w-full mt-8 border-2 border-[#00ff41] py-2 hover:bg-[#00ff41] hover:text-black uppercase font-bold"
        >
          Visualizza Classifica Completa
        </button>
      </>
    );
  }
  return (
    <CRTWrapper>
      {content}
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
