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
      className={`group bg-[#111] border-2 p-3 flex items-center gap-4 transition-colors ${
        isChanged ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-[#00ff41]/30 hover:border-[#00ff41]/60'
      }`}
      style={{ touchAction: 'pan-y' }}>
      {/* --- IMPROVED GRIP AREA --- */}
      <div
        className={`
          cursor-grab active:cursor-grabbing 
          /* Делаем область захвата широкой: 48px в ширину (w-12) и растягиваем на всю высоту */
          w-12 -my-3 -ml-3 flex items-center justify-center shrink-0
          /* Легкая фоновая подсветка, чтобы игрок понимал, за что тянуть */
          bg-[#00ff41]/5 group-hover:bg-[#00ff41]/10 border-r border-[#00ff41]/10
          transition-colors
        `}
        onPointerDown={e => controls.start(e)}
        style={{ touchAction: 'none' }} // Disables scrolling ONLY in this area
      >
        <GripVertical size={24} className={isChanged ? 'text-amber-500' : 'text-[#00ff41]/40'} />
      </div>

      {/*  INDEX NUMBER : <current>[<old>] - for Commander */}
      <div
        className={`flex flex-col items-center justify-center w-12 shrink-0 font-black leading-none ${isChanged ? 'text-amber-500' : 'text-[#00ff41]/40'}`}>
        <span className="text-xl">{index + 1}</span>
        {isChanged && <span className="text-[10px] opacity-70">[{item.originalIndex}]</span>}
      </div>
      {/*  ITEM PHOTO */}
      <div className={`w-16 h-16 border overflow-hidden bg-black shrink-0 ${isChanged ? 'border-amber-500/50' : 'border-[#00ff41]/20'}`}>
        <img src={`/img/${item.photo}`} alt="" className={`w-full h-full object-cover ${isChanged ? 'opacity-100' : 'opacity-80'}`} />
      </div>
      {/*  ITEM NAME */}
      <div className={`flex-1 uppercase font-bold text-[10px] md:text-xs leading-tight ${isChanged ? 'text-amber-500' : ''}`}>{item.name}</div>
    </Reorder.Item>
  );
};
