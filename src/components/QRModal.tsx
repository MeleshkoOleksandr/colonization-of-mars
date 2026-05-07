'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, Check, Download } from 'lucide-react';
import { Localization } from '../logic';

interface QRModalProps {
  shareData: { name: string; url: string } | null;
  loc: Localization;
  setShareData: (val: any) => void; 
  onDownload: (name: string) => void; 
}

export const QRModal = ({ shareData, loc, setShareData, onDownload }: QRModalProps) => {
  const [isCopied, setIsCopied] = useState(false);
  if (!shareData) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm border-4 border-[#00ff41] bg-black p-6 shadow-[0_0_50px_rgba(0,255,65,0.4)] text-center relative">
        <button onClick={() => setShareData(null)} className="absolute top-2 right-2 text-[#00ff41]/50 hover:text-[#00ff41]">
          <X size={20} />
        </button>

        <h3 className="text-[#00ff41] font-black uppercase mb-6 italic border-b border-[#00ff41]/30 pb-2">
          {loc.modal_msg_qr}
          {shareData.name}
        </h3>

        {/* QR CODE CANVAS */}
        <div className="bg-[#00ff41] p-3 inline-block mb-6 shadow-[0_0_20px_rgba(0,255,65,0.3)] overflow-hidden">
          <QRCodeCanvas
            id="qr-code-canvas"
            value={shareData.url}
            size={1000} // Big size for saving as image
            level={'H'}
            bgColor={'#00ff41'}
            fgColor={'#000000'}
            style={{ width: '200px', height: '200px' }} // And we'll show 200px on the screen
          />
        </div>

        <div className="space-y-4">
          {' '}
          <div className="flex items-center gap-2 bg-[#001100] border border-[#00ff41]/30 p-2 overflow-hidden relative">
            {/* Displaying a URL or the text “COPIED” */}
            <div className="flex-1 min-w-0 flex items-center">
              <AnimatePresence mode="wait">
                {!isCopied ? (
                  <motion.span
                    key="url"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    className="text-[9px] text-[#00ff41] truncate font-mono">
                    {shareData?.url}
                  </motion.span>
                ) : (
                  <motion.span
                    key="copied"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="text-[9px] text-[#00ff41] font-black uppercase tracking-[0.2em] animate-pulse">
                    {loc.msg_link_copied || '> LINK COPIED <'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Button with a dynamic icon */}
            <button
              onClick={async () => {
                if (shareData?.url) {
                  // Copy the text
                  await navigator.clipboard.writeText(shareData.url);
                  // Play the confirmation animation
                  setIsCopied(true);
                  // We'll return to the original state in 2 seconds
                  setTimeout(() => setIsCopied(false), 2000);
                }
              }}
              className={`transition-colors duration-300 ${isCopied ? 'text-white' : 'text-[#00ff41] hover:text-white'}`}>
              {isCopied ? <Check size={16} className="text-[#00ff41]" /> : <Copy size={16} />}
            </button>
          </div>
          <button
            onClick={() => {
              if (shareData) {
                onDownload(shareData.name);
              }
            }}
            className="w-full bg-[#00ff41] text-black py-3 font-black uppercase text-xs hover:bg-white transition-colors flex items-center justify-center gap-2">
            <Download size={16} /> {loc.admin_msg_qrsave} (PNG)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
