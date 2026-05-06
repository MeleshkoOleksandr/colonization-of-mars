'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const AnalysisSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const phrases = [
    '> INIZIALIZZAZIONE ANALISI...',
    '> CONNESSIONE SATELLITE ARES-1',
    '> SCANSIONE INVENTARIO...',
    '> VALUTAZIONE O2: CRITICO',
    '> CALCOLO TRAIETTORIA...',
    '> ANALISI PRIORITÀ NASA...',
    '> SINCRONIZZAZIONE DATABASE...',
    '> CALCOLO PROBABILITÀ...',
    '> GENERAZIONE RAPPORTO...',
  ];

  useEffect(() => {
    // 1. Progress bar simulation
    const interval = setInterval(() => {
      setProgress(prev => (prev < 100 ? prev + 1 : 100));
    }, 20);
    // 2. Typing logs simulation
    phrases.forEach((phrase, index) => {
      setTimeout(() => {
        setLogs(prev => [...prev, phrase]);
      }, index * 220);
    });
    // 3. Complete after some time
    const timeout = setTimeout(onComplete, 2250);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-200 bg-black text-[#00ff41] font-mono p-6 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-4 md:py-10">
        <div className="flex-1 min-h-0 mb-6 relative">
          <div className="absolute inset-0 overflow-hidden flex flex-col justify-end border-l border-[#00ff41]/20 pl-4">
            <AnimatePresence>
              {logs.slice(-8).map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] md:text-xs leading-tight mb-2 flex gap-2">
                  <span className="opacity-40 shrink-0">[{new Date().toLocaleTimeString([], { second: '2-digit' })}s]</span>
                  <span>{log}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {/* PROGRESS BAR BLOCK (Fixed size)  */}
        <div className="shrink-0 space-y-3 bg-black">
          <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
            <span className="animate-pulse">Analyzing...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-4 border-2 border-[#00ff41] p-0.5 shadow-[0_0_10px_rgba(0,255,65,0.2)]">
            <div
              className="h-full bg-[#00ff41] transition-all duration-100 ease-linear shadow-[0_0_15px_#00ff41]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {/* DECORATIVE FOOTER */}
        <div className="shrink-0 mt-8 grid grid-cols-3 gap-2 opacity-30 text-[7px] md:text-[8px] uppercase border-t border-[#00ff41]/10 pt-4">
          <div className="animate-pulse">CPU: 98%</div>
          <div className="animate-pulse delay-75">O2: OK</div>
          <div className="animate-pulse delay-150">TMP: -64C</div>
        </div>
      </div>
    </div>
  );
};
