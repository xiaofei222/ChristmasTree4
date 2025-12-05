import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeState } from '../types';
import { generateHolidayGreeting } from '../services/geminiService';

interface OverlayProps {
  treeState: TreeState;
  setTreeState: (state: TreeState) => void;
}

const Overlay: React.FC<OverlayProps> = ({ treeState, setTreeState }) => {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleState = () => {
    setTreeState(
      treeState === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE
    );
  };

  const handleGenerateGreeting = async () => {
    setLoading(true);
    const text = await generateHolidayGreeting();
    setGreeting(text);
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 md:p-12">
      {/* Header */}
      <header className="flex flex-col items-start">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-4xl md:text-6xl text-[#d4af37] font-serif font-bold tracking-widest uppercase drop-shadow-md"
          style={{ fontFamily: '"Cinzel", serif' }}
        >
          Arix Signature
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-white/60 text-sm md:text-base mt-2 tracking-[0.2em]"
        >
          The Golden Christmas Edition
        </motion.p>
      </header>

      {/* Center - Greeting Display */}
      <AnimatePresence>
        {greeting && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl text-center px-4"
          >
            <div className="bg-black/30 backdrop-blur-sm border-t border-b border-[#d4af37]/30 py-8 px-6">
              <p 
                className="text-[#f9eeb8] text-xl md:text-3xl italic leading-relaxed font-serif"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                "{greeting}"
              </p>
            </div>
            <button 
              onClick={() => setGreeting(null)}
              className="mt-4 text-[#d4af37]/50 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors pointer-events-auto"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Controls */}
      <footer className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
           <div className="h-px w-24 bg-[#d4af37]" />
           <p className="text-[#d4af37] text-xs uppercase tracking-widest">Interactive Experience</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pointer-events-auto">
          {/* AI Button */}
          <button
            onClick={handleGenerateGreeting}
            disabled={loading}
            className="group relative px-6 py-3 border border-[#d4af37]/30 bg-[#042e1f]/80 hover:bg-[#d4af37] transition-all duration-500 overflow-hidden"
          >
             <span className="relative z-10 text-[#d4af37] group-hover:text-[#020b08] text-xs font-bold uppercase tracking-widest transition-colors">
               {loading ? 'Divining...' : 'Request Greeting'}
             </span>
             <div className="absolute inset-0 bg-[#d4af37] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out" />
          </button>

          {/* Morph Button */}
          <button
            onClick={toggleState}
            className="group relative px-8 py-3 bg-[#d4af37] text-[#020b08] hover:bg-white transition-colors duration-500 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            <span className="text-xs font-bold uppercase tracking-widest">
              {treeState === TreeState.TREE_SHAPE ? 'Scatter Elements' : 'Form The Tree'}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Overlay;
