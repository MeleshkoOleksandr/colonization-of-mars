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
    name: "Telemetro/puntatore laser",
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
  const [username, setUsername] = useState("");
  const [team, setTeam] = useState("");
  const [items, setItems] = useState<SurvivalItem[]>([]);
  const [allResults, setAllResults] = useState<UserResult[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<UserResult | null>(null);

  // Состояния для админки
  const [story, setStory] = useState(INITIAL_STORY);
  const [teamsList, setTeamsList] = useState([
    "Alfa Centauri",
    "Marineris Rangers",
    "Olympus Mons",
  ]);

  // Инициализация при запуске
  useEffect(() => {
    const saved = localStorage.getItem("mars_results");
    if (saved) setAllResults(JSON.parse(saved));
    setItems([...INITIAL_ITEMS].sort(() => Math.random() - 0.5));
  }, []);

  const handleStart = () => {
    if (!username || !team) return alert("Inserire nome e squadra!");
    if (username.toLowerCase() === "admin") {
      setView("admin");
    } else {
      setView("story");
    }
  };

  const finishGame = () => {
    let score = 0;
    items.forEach((item, index) => {
      score += Math.abs(index + 1 - item.idealPosition);
    });

    const newResult: UserResult = {
      username,
      team,
      score,
      selections: items.map((i) => i.id),
    };

    const updatedResults = [...allResults, newResult];
    setAllResults(updatedResults);
    localStorage.setItem("mars_results", JSON.stringify(updatedResults));
    setView("results");
  };

  const getScoreMessage = (s: number) => {
    if (s <= 20) return "ECCELLENTE. Elon Musk sarebbe fiero di te!";
    if (s <= 35) return "BUONO. Arriverai alla base, seppur con fatica.";
    if (s <= 50)
      return "SUFFICIENTE. Probabilmente finirai l'energia a metà strada.";
    return "DISASTRO. I tuoi resti saranno concime per patate marziane.";
  };

  // --- VIEWS ---
  if (view === "login")
    return (
      <CRTWrapper>
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
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            >
              <option value="">Seleziona Team...</option>
              {teamsList.map((t) => (
                <option key={t} value={t}>
                  {t}
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
      </CRTWrapper>
    );

  if (view === "story")
    return (
      <CRTWrapper>
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
      </CRTWrapper>
    );

  if (view === "game")
    return (
      <CRTWrapper>
        <div className="flex justify-between items-end mb-6">
          <div className="text-xs">
            OPERATORE: {username}
            <br />
            TEAM: {team}
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
      </CRTWrapper>
    );

  if (view === "results") {
    const lastResult = allResults[allResults.length - 1];
    return (
      <CRTWrapper>
        <Header title="Analisi Sopravvivenza" />
        <div className="text-center mb-8">
          <div className="text-6xl font-black mb-2">{lastResult.score}</div>
          <div className="text-sm uppercase tracking-[0.3em] mb-4">
            Punti di Deviazione
          </div>
          <p className="text-xl italic bg-[#00ff41] text-black p-2 font-bold uppercase">
            {getScoreMessage(lastResult.score)}
          </p>
        </div>

        <div className="grid gap-4 mb-8 h-64 overflow-y-auto border border-[#00ff41]/30 p-4 bg-black/50">
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
          <button
            onClick={() => window.location.reload()}
            className="flex-1 border-2 border-[#00ff41]/50 py-3 hover:text-white uppercase font-bold text-xs flex items-center justify-center gap-2"
          >
            <RefreshCcw size={14} /> Nuovo Test
          </button>
        </div>
      </CRTWrapper>
    );
  }

  if (view === "leaderboard")
    return (
      <CRTWrapper>
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#00ff41] pb-2">
          <button
            onClick={() => setView("results")}
            className="text-xs flex items-center gap-1 hover:underline"
          >
            <ArrowLeft size={14} /> Indietro
          </button>
          <h2 className="text-xl font-bold uppercase">Status Coloni</h2>
          <button
            onClick={() =>
              setAllResults(
                JSON.parse(localStorage.getItem("mars_results") || "[]"),
              )
            }
            className="p-1 hover:rotate-180 transition-transform"
          >
            <RefreshCcw size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-4 text-[10px] uppercase opacity-50 px-4">
            <span>Nome</span>
            <span>Team</span>
            <span className="text-right">Score</span>
            <span className="text-right">Azione</span>
          </div>
          {allResults
            .sort((a, b) => a.score - b.score)
            .map((res, i) => (
              <div
                key={i}
                className="grid grid-cols-4 items-center bg-[#111] p-4 border border-[#00ff41]/20 hover:border-[#00ff41]"
              >
                <span className="font-bold truncate">{res.username}</span>
                <span className="text-xs opacity-70">{res.team}</span>
                <span className="text-right font-black">{res.score}</span>
                <button
                  onClick={() => {
                    setSelectedUserDetail(res);
                    setView("user-detail");
                  }}
                  className="text-right text-[10px] underline hover:text-white"
                >
                  DETTAGLI
                </button>
              </div>
            ))}
        </div>
      </CRTWrapper>
    );

  if (view === "user-detail" && selectedUserDetail)
    return (
      <CRTWrapper>
        <div className="mb-6">
          <button
            onClick={() => setView("leaderboard")}
            className="text-xs flex items-center gap-1 hover:underline mb-4"
          >
            <ArrowLeft size={14} /> Torna alla Classifica
          </button>
          <h2 className="text-2xl font-bold uppercase tracking-tighter">
            Analisi: {selectedUserDetail.username}
          </h2>
          <div className="text-sm opacity-70 italic">
            Team: {selectedUserDetail.team} | Score: {selectedUserDetail.score}
          </div>
        </div>

        <div className="space-y-1 text-xs">
          {selectedUserDetail.selections.map((itemId, idx) => {
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
      </CRTWrapper>
    );

  if (view === "admin")
    return (
      <CRTWrapper>
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* Teams Management */}
          <div className="space-y-4 border-2 border-[#00ff41]/30 p-4">
            <h3 className="font-bold uppercase flex items-center gap-2">
              <Users size={18} /> Gestione Team
            </h3>
            <div className="space-y-2">
              {teamsList.map((t) => (
                <div
                  key={t}
                  className="flex justify-between items-center bg-[#111] p-2 text-sm"
                >
                  <span>{t}</span>
                  <button
                    onClick={() =>
                      setTeamsList(teamsList.filter((i) => i !== t))
                    }
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const n = prompt("Nome nuovo team?");
                if (n) setTeamsList([...teamsList, n]);
              }}
              className="text-[10px] border border-[#00ff41] p-1 w-full hover:bg-[#00ff41] hover:text-black"
            >
              + AGGIUNGI TEAM
            </button>
          </div>

          {/* Story Management */}
          <div className="space-y-4 border-2 border-[#00ff41]/30 p-4">
            <h3 className="font-bold uppercase flex items-center gap-2">
              <Edit size={18} /> Editor Scenario
            </h3>
            <div className="space-y-2">
              <label className="text-[10px]">Titolo:</label>
              <input
                className="w-full bg-black border border-[#00ff41] p-1 text-sm"
                value={story.title}
                onChange={(e) => setStory({ ...story, title: e.target.value })}
              />
              <label className="text-[10px]">Plot:</label>
              <textarea
                className="w-full bg-black border border-[#00ff41] p-1 text-xs h-24"
                value={story.plot}
                onChange={(e) => setStory({ ...story, plot: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-bold uppercase mb-4 flex items-center gap-2">
            <Save size={18} /> Database Risultati
          </h3>
          <div className="max-h-40 overflow-y-auto border border-[#00ff41]/50 text-[10px]">
            <table className="w-full text-left">
              <thead className="bg-[#00ff41] text-black">
                <tr>
                  <th className="p-1">User</th>
                  <th className="p-1">Team</th>
                  <th className="p-1">Score</th>
                  <th className="p-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {allResults.map((r, i) => (
                  <tr key={i} className="border-b border-[#00ff41]/20">
                    <td className="p-1">{r.username}</td>
                    <td className="p-1">{r.team}</td>
                    <td className="p-1">{r.score}</td>
                    <td className="p-1">
                      <button
                        onClick={() => {
                          const updated = allResults.filter(
                            (_, idx) => idx !== i,
                          );
                          setAllResults(updated);
                          localStorage.setItem(
                            "mars_results",
                            JSON.stringify(updated),
                          );
                        }}
                        className="text-red-500"
                      >
                        DEL
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
      </CRTWrapper>
    );

  return null;
}
