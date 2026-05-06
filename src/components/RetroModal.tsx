'use client';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ModalType, Localization } from '../types';

// 1. Describing the props interface
interface RetroModalProps {
  isOpen: boolean;
  type: ModalType;
  message: string;
  value?: string;
  onClose: () => void;
  onConfirm: () => void;
  onChange?: (val: string) => void;
  loc: Localization;
}

export const RetroModal = ({ isOpen, type, message, value, onClose, onConfirm, onChange, loc }: RetroModalProps) => {
  // We specify that the arguments conform to the interface
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter' && type !== 'prompt-area') {
        e.preventDefault();
        onConfirm();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onClose, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md border-4 border-[#00ff41] bg-black p-6 shadow-[0_0_50px_rgba(0,255,65,0.3)] relative">
        {/* The scanning line effect */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] opacity-20"></div>

        <h3 className="text-[#00ff41] font-black uppercase tracking-tighter mb-4 text-xl italic border-b border-[#00ff41]/30 pb-2">
          {type === 'confirm'
            ? `> ${loc.modal_title_confirm || 'Richiesta Conferma'}`
            : type === 'prompt' || type === 'prompt-area'
              ? `> ${loc.modal_title_input || 'Input Richiesto'}`
              : `> ${loc.modal_title_system || 'Messaggio Sistema'}`}
        </h3>

        <p className="text-[#00ff41] mb-6 uppercase text-sm leading-relaxed tracking-wide">{message}</p>

        {type === 'prompt-area' ? (
          <textarea
            autoFocus
            className="w-full h-40 bg-[#001100] border-2 border-[#00ff41] p-2 text-[#00ff41] outline-none mb-6 focus:bg-[#003300] uppercase font-mono text-xs"
            value={value}
            onChange={e => onChange?.(e.target.value)}
          />
        ) : type === 'prompt' ? (
          <input
            autoFocus
            className="w-full bg-[#001100] border-2 border-[#00ff41] p-2 text-[#00ff41] outline-none mb-6 focus:bg-[#003300] uppercase font-mono"
            value={value}
            onChange={e => onChange?.(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onConfirm()}
          />
        ) : null}

        <div className="flex justify-end gap-4">
          {type !== 'alert' && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#00ff41]/50 text-[#00ff41]/50 hover:text-[#00ff41] uppercase text-xs font-bold">
              {loc.msg_modal_cancel || 'Annulla'}
            </button>
          )}
          <button onClick={onConfirm} className="px-6 py-2 bg-[#00ff41] text-black font-black uppercase text-xs hover:bg-white transition-colors">
            {type === 'confirm' ? loc.msg_modal_confirm || 'Conferma' : loc.msg_modal_exit || 'Esegui'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
