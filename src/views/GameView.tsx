'use client';
import React from 'react';
import { Reorder } from 'framer-motion';
import { DraggableItem } from '../components/DraggableItem';
import { SurvivalItem, Localization } from '../types';

interface GameViewProps {
  username: string;
  currentTeamName: string;
  items: SurvivalItem[];
  setItems: (items: SurvivalItem[]) => void;
  finishGame: () => void;
  loc: Localization;
}

export const GameView = ({ username, currentTeamName, items, setItems, finishGame, loc }: GameViewProps) => (
  <>
    <div className="flex justify-between items-end mb-6">
      <div className="text-xs">
        {loc.lb_operator} {username}
        <br />
        {loc.lb_team} {currentTeamName}
      </div>
      <h2 className="text-xl font-bold uppercase tracking-widest">{loc.lb_configuration}</h2>
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
      className="w-full mt-8 bg-[#00ff41] text-black py-4 font-black uppercase text-xl hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.5)]">
      {loc.btn_sendreport}
    </button>
  </>
);
