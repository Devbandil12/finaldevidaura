// src/Components/Loader.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function Loader({ text = "Loading..." }) {
  // Brand color reference
  const goldColor = "#D4AF37"; 
  
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fdfbf7]">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      <div className="relative z-10 flex flex-col items-center">
        
        {/* 1. The "Essence" Droplet Animation */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-8">
          {/* Outer Ripple */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
              borderWidth: ["1px", "0px", "1px"]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full border border-[#D4AF37]"
          />
          
          {/* Inner Rotating Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute w-16 h-16 rounded-full border border-t-[#D4AF37] border-r-transparent border-b-[#D4AF37] border-l-transparent opacity-60"
          />

          {/* Central Perfume Drop */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.6)]"
          />
        </div>

        {/* 2. Brand Typography */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl md:text-5xl text-gray-900 font-serif tracking-[0.2em] uppercase">
            Devid Aura
          </h1>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "40%" }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="h-[1px] bg-[#D4AF37] mx-auto my-4"
          />
        </motion.div>

        {/* 3. Elegant Status Text (Dynamic Prop) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-2 text-center"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-medium">
            {text}
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >...</motion.span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}