'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ModalType, Localization, ModalMode } from '../logic';
import { Eye, EyeOff, RefreshCcw } from 'lucide-react';

/**
 * Universal Modal UI used for Alerts, Confirms, and Admin Prompts.
 * Supports Enter and Escape keys for fast interaction.
 */

// 1. Describing the props interface
interface RetroModalProps {
  isOpen: boolean;
  type: ModalType;
  mode: ModalMode;
  message: string;
  value?: string;
  onClose: () => void;
  onConfirm: () => void;
  onChange?: (val: string) => void;
  loc: Localization;
  isSaving?: boolean;
}

export const RetroModal = ({ isOpen, type, mode, message, value, onClose, onConfirm, onChange, loc, isSaving }: RetroModalProps) => {
  // For password hide
  const [showPassword, setShowPassword] = React.useState(false);

  //For system message
  const isSystemMessage = message?.includes('> > MESSAGGIO SISTEMA') ?? false;

  // Reset visibility when modal closes
  React.useEffect(() => {
    if (!isOpen) setShowPassword(false);
  }, [isOpen]);

  // We specify that the arguments conform to the interface
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter' && type !== 'prompt-area') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onClose, type]);

  if (!isOpen) return null;
  const isPasswordField = mode === ModalMode.ADMIN_AUTH || (message && message.toLowerCase().includes('password'));

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-md border-4 bg-black p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative ${isSystemMessage ? 'border-red-600 shadow-red-900/40' : 'border-[#00ff41] shadow-[#00ff41]/20'}`}>
        {/* The scanning line effect */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] opacity-20"></div>

        <h3
          className={`uppercase tracking-tighter mb-4 text-xl italic border-b pb-2 ${isSystemMessage ? 'text-red-600 border-red-600/30' : 'text-[#00ff41] border-[#00ff41]/30'}`}>
          {type === 'confirm'
            ? `> ${loc.modal_title_confirm || 'Richiesta Conferma'}`
            : type === 'prompt' || type === 'prompt-area'
              ? `> ${loc.modal_title_input || 'Input Richiesto'}`
              : `> ${loc.modal_title_system || 'Messaggio Sistema'}`}
        </h3>

        <p className="text-[#00ff41] mb-6 uppercase text-sm leading-relaxed tracking-wide">{message}</p>

        <div className="w-full">
          {/* 1. TEXTAREA logic (prompt-area) - Stays exactly as it was */}
          {type === 'prompt-area' ? (
            <textarea
              autoFocus
              className="w-full h-40 bg-[#001100] border-2 border-[#00ff41] p-2 text-[#00ff41] outline-none mb-6 focus:bg-[#003300] uppercase font-mono text-xs"
              value={value}
              onChange={e => onChange?.(e.target.value)}
            />
          ) : type === 'prompt' ? (
            /* 2. INPUT logic (prompt) - Wrapped in a relative div for the eye icon */
            <div className="relative w-full mb-6">
              <input
                autoFocus
                // Switch type between "password" (dots) and "text" (visible)
                type={isPasswordField && !showPassword ? 'password' : 'text'}
                className="w-full bg-[#001100] border-2 border-[#00ff41] p-2 pr-10 text-[#00ff41] outline-none focus:bg-[#003300] uppercase font-mono"
                value={value}
                onChange={e => onChange?.(e.target.value)}
              />

              {/* Show the Eye icon ONLY if it's a password field */}
              {isPasswordField && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00ff41]/40 hover:text-[#00ff41] transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-4">
          {type !== 'alert' && (
            <button
              onClick={onClose}
              disabled={isSaving} // Disable the “Cancel” button when saving
              className="px-4 py-2 border border-[#00ff41]/50 text-[#00ff41]/50 hover:text-[#00ff41] uppercase text-xs font-bold">
              {loc.msg_modal_cancel || 'Annulla'}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={isSaving} // Disable the confirmation button
            className="px-6 py-2 bg-[#00ff41] text-black font-black uppercase text-xs hover:bg-white transition-colors disabled:bg-gray-600 disabled:cursor-wait min-w-25">
            {/* 3. Change the text to “Processing...” while saving */}
            {isSaving ? (
              <div className="flex items-center gap-2">
                <RefreshCcw size={12} className="animate-spin" />
                <span>{loc.modal_status_busy || '...'}</span>
              </div>
            ) : type === 'confirm' ? (
              loc.btn_confirm || 'Conferma'
            ) : (
              loc.btn_execute || 'Esegui'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
