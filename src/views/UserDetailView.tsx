import { GameResult, SurvivalItem, Localization } from '../logic';

import { ArrowLeft, MessageSquare } from 'lucide-react';

interface UserDetailViewProps {
  selectedUserDetail: GameResult;
  staticItems: SurvivalItem[];
  showDeltas: boolean;
  prevView: string;
  setView: (view: any) => void;
  loc: Localization;
}

export const UserDetailView = ({ selectedUserDetail, staticItems, showDeltas, prevView, setView, loc }: UserDetailViewProps) => (
  <>
    <div className="mb-6">
      <button
        // We use prevView state to decide where to go back
        onClick={() => setView(prevView)}
        className="text-xs flex items-center gap-1 hover:underline mb-4">
        <ArrowLeft size={14} />{' '}
      </button>

      <div className="mb-8">
        <div className="text-center mb-4">
          <div className="inline-block border border-[#00ff41] px-4 py-1 text-[14px] uppercase tracking-[0.2em] bg-[#00ff41]/10">
            {loc.lb_operator} <span className="text-white">{selectedUserDetail.username}</span> | {loc.lb_team}{' '}
            <span className="text-white">{selectedUserDetail.team_name}</span>
          </div>
        </div>

        <div className="mt-2 flex justify-center ">
          {showDeltas ? (
            <div className="text-sm font-black uppercase tracking-tight text-[#00ff41] flex items-baseline gap-2">
              <span>{loc.lb_nasapoints}</span>
              <span className="text-2xl underline decoration-double">{selectedUserDetail.score}</span>
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
        const item = staticItems.find(i => i.id === itemId);
        const diff = Math.abs(idx + 1 - (item?.idealPosition || 0));

        return (
          <div key={itemId} className="flex justify-between items-start gap-3 p-3 border-b border-[#00ff41]/10 bg-black/20">
            {/* LEFT SIDE: Index and Name (Flexible) */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] opacity-40 font-mono mr-2">{String(idx + 1).padStart(2, '0')}.</span>
              <span className="uppercase font-bold text-[11px] leading-tight wrap-break-word">{item?.name}</span>
            </div>

            {/* RIGHT SIDE: NASA Info and Delta (Fixed width, pinned to right) */}
            <div className="shrink-0 text-right font-mono flex flex-col items-end">
              {/* Condition: display deltas only if showDeltas === true */}
              {showDeltas ? (
                <>
                  <div className="text-[9px] opacity-50 uppercase italic leading-none mb-1">NASA: {item?.idealPosition}</div>
                  <div className={`text-sm font-black leading-none ${diff === 0 ? 'text-green-400' : 'text-amber-500'}`}>Δ {diff}</div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-amber-500 opacity-80" title="In fase di discussione - Punteggio nascosto">
                  <MessageSquare size={22} className="animate-pulse" />
                  <span className="text-[7px] uppercase font-black tracking-tighter">{loc.lb_discussione}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </>
);
