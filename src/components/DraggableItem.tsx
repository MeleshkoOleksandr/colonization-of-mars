'use client';
import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { SurvivalItem } from '../types';

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

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={controls}
      className="group bg-[#111] border-2 border-[#00ff41]/30 p-3 flex items-center gap-4 hover:border-[#00ff41]/60 transition-colors"
      style={{ touchAction: 'pan-y' }}>
      {/* 1. THE DRAG HANDLE */}
      <div
        className="cursor-grab active:cursor-grabbing p-2 text-[#00ff41]/30 hover:text-[#00ff41] transition-colors"
        // Start dragging only when touching this handle ---
        onPointerDown={e => controls.start(e)}
        style={{ touchAction: 'none' }}>
        <GripVertical size={20} />
      </div>
      {/* 2. INDEX NUMBER */}
      <span className="text-xl font-black w-8 text-[#00ff41]/40 group-hover:text-[#00ff41]">{index + 1}</span>
      {/* 3. ITEM PHOTO */}
      <div className="w-20 h-20 border border-[#00ff41]/20 overflow-hidden bg-black shrink-0">
        <img src={`/img/${item.photo}`} alt={item.name} draggable="false" className="w-full h-full object-cover opacity-80" />
      </div>
      {/* 4. ITEM NAME */}
      <div className="flex-1">
        <div className="uppercase font-bold text-xs leading-tight">{item.name}</div>
      </div>
    </Reorder.Item>
  );
};
