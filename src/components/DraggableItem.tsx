'use client';
import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { SurvivalItem } from '../logic';

interface DraggableItemProps {
  item: SurvivalItem;
  index: number;
}

/**
 * Item component for the Drag & Drop list.
 * Restricted to drag only via the GripVertical handle for better mobile UX.
 */

export const DraggableItem = ({ item, index }: DraggableItemProps) => {
  const controls = useDragControls();
  // CHECK: Has the commander changed the position of this item
  const isChanged = item.originalIndex !== undefined && item.originalIndex !== index + 1;

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={controls}
      // CHANGE COLOR: If the status has changed, the border turns orange
      className={`group bg-[#111] border-2 p-3 flex items-stretch gap-4 transition-colors ${
        isChanged ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-[#00ff41]/30 hover:border-[#00ff41]/60'
      }`}
      style={{ touchAction: 'pan-y' }}>
      {/* --- IMPROVED GRIP AREA --- */}
      <div
        className="cursor-grab active:cursor-grabbing w-12 shrink-0 flex items-center justify-center self-stretch -my-3 -ml-3 border-r border-[#00ff41]/10"
        onPointerDown={e => controls.start(e)}
        style={{ touchAction: 'none' }}>
        <GripVertical size={20} className={isChanged ? 'text-amber-500' : 'text-[#00ff41]/30'} />
      </div>

      {/*  INDEX NUMBER : <current>[<old>] - for Commander */}
      <div
        className={`flex flex-col items-center justify-center w-8 shrink-0 font-black leading-none ${isChanged ? 'text-amber-500' : 'text-[#00ff41]/40'}`}>
        <span className="text-xl">{index + 1}</span>
        {isChanged && <span className="text-[10px] opacity-70">[{item.originalIndex}]</span>}
      </div>
      {/*  ITEM PHOTO */}
      <div className="flex items-center">
        {' '}
        <div className={`w-16 h-16 border overflow-hidden bg-black shrink-0 ${isChanged ? 'border-amber-500/50' : 'border-[#00ff41]/20'}`}>
          <img src={`/img/${item.photo}`} alt="" className="w-full h-full object-cover opacity-80" />
        </div>
      </div>
      {/*  ITEM NAME */}
      <div className={`flex-1 flex items-center uppercase font-bold text-[10px] md:text-xs leading-tight ${isChanged ? 'text-amber-500' : ''}`}>
        {item.name}
      </div>
    </Reorder.Item>
  );
};
