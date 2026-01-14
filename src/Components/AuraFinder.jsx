// src/Components/AuraFinder.jsx
import React, { useState } from "react";
import { createPortal } from "react-dom"; // 🟢 1. IMPORT THIS
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, RefreshCcw } from "lucide-react"; // Removed ArrowRight as it wasn't used in snippet
import { useNavigate } from "react-router-dom";
import { optimizeImage } from "../utils/imageOptimizer";

// ... (Keep your existing CONFIGURATION array: questions, options, etc.) ...
const questions = [
  {
    id: "occasion",
    title: "Where is your next chapter being written?",
    options: [
      { label: "An Intimate Evening", keywords: ["night", "sensual", "warm", "spicy", "intense", "romance", "seductive"] },
      { label: "The Boardroom", keywords: ["fresh", "clean", "citrus", "light", "professional", "crisp", "subtle"] },
      { label: "A Grand Celebration", keywords: ["elegant", "floral", "sophisticated", "rich", "gold", "luxury", "oud"] },
      { label: "Everyday Signature", keywords: ["balanced", "modern", "classic", "air", "daily", "soft", "aqua"] },
    ],
  },
  {
    id: "vibe",
    title: "What presence do you wish to project?",
    options: [
      { label: "Commanding & Powerful", keywords: ["bold", "musk", "oud", "strong", "commanding", "leather", "tobacco"] },
      { label: "Mysterious & Complex", keywords: ["smoky", "amber", "dark", "complex", "enigma", "deep", "incense"] },
      { label: "Playful & Radiant", keywords: ["sweet", "fruity", "vanilla", "bright", "joy", "energy", "citrus"] },
      { label: "Grounded & Serene", keywords: ["wood", "earth", "calm", "sandalwood", "peace", "nature", "vetiver"] },
    ],
  },
];

// ... (Keep your existing ANIMATION VARIANTS) ...
const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(12px)", transition: { duration: 0.6 } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 30, stiffness: 300, staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -40, transition: { duration: 0.4 } },
};

export default function AuraFinder() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); 
  const [selections, setSelections] = useState({ occasion: null, vibe: null });
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

  // ... (Keep your existing Handlers: handleStart, handleClose, handleSelection, findMatchOnServer, restart) ...
  const handleStart = () => {
    setIsOpen(true);
    setStep(1);
    setError(null);
    document.body.style.overflow = "hidden"; 
  };

  const handleClose = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto"; 
    setTimeout(() => {
      setStep(0);
      setSelections({ occasion: null, vibe: null });
      setRecommendation(null);
    }, 500);
  };

  const handleSelection = (option) => {
    if (step === 1) {
      setSelections((prev) => ({ ...prev, occasion: option }));
      setStep(2);
    } else if (step === 2) {
      const finalSelections = { ...selections, vibe: option };
      setSelections(finalSelections);
      setStep(3);
      findMatchOnServer(finalSelections.occasion, option);
    }
  };

  const findMatchOnServer = async (occasion, vibe) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products/aura-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion, vibe }),
      });

      if (!response.ok) throw new Error("Consultation failed");

      const bestMatch = await response.json();
      
      setTimeout(() => {
        setRecommendation(bestMatch);
        setStep(4);
      }, 1800);

    } catch (err) {
      console.error("Aura Match Error:", err);
      setError("Our concierge is currently unavailable. Please explore our full collection.");
      setStep(4);
    }
  };

  const restart = () => {
    setStep(1);
    setSelections({ occasion: null, vibe: null });
    setRecommendation(null);
    setError(null);
  };

  return (
    <>
      {/* ⚡️ TRIGGER BUTTON (Stays where it is in the DOM) */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, paddingRight: "1.5rem" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          className="fixed bottom-8 right-8 z-40 bg-white text-black px-6 py-4 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] flex items-center gap-3 border border-gray-100 group transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[#D4AF37]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Concierge</span>
            <span className="font-serif italic text-lg leading-none pr-1">Find your Aura</span>
          </div>
        </motion.button>
      )}

      {/* ⚡️ FULL SCREEN OVERLAY (MOVED TO PORTAL) */}
      {/* 🟢 2. WRAP THIS SECTION IN createPortal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              // 🟢 3. Ensure Z-index is higher than Navbar (9999)
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-white/90 overflow-y-auto"
              // 🟢 4. Add this to prevent Lenis scroll issues here too
              data-lenis-prevent 
            >
              {/* Background Texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>

              <button 
                onClick={handleClose}
                className="absolute top-8 right-8 p-4 rounded-full hover:bg-black hover:text-white transition-colors duration-300 z-50 group"
              >
                <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
                <span className="sr-only">Close</span>
              </button>

              <div className="w-full max-w-5xl px-6 relative z-10 max-h-screen " data-lenis-prevent>
                <AnimatePresence mode="wait">
                  
                  {/* --- QUESTIONS (STEP 1 & 2) --- */}
                  {(step === 1 || step === 2) && (
                    <motion.div
                      key={`step-${step}`}
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex flex-col items-center text-center my-10"
                    >
                      <motion.span className="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.25em] mb-6 border border-[#D4AF37]/30 px-4 py-2 rounded-full">
                        Step {step} of 2
                      </motion.span>
                      
                      <motion.h2 className="text-4xl md:text-6xl font-serif text-gray-900 mb-16 max-w-3xl leading-tight">
                        {questions[step - 1].title}
                      </motion.h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                        {questions[step - 1].options.map((option, idx) => (
                          <motion.button
                            key={option.label}
                            variants={contentVariants}
                            whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a", color: "#ffffff" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelection(option)}
                            className="group relative p-8 md:p-10 text-left border border-gray-200 bg-white transition-all duration-500 ease-out overflow-hidden"
                          >
                            <span className="relative z-10 text-2xl md:text-3xl font-serif italic text-gray-400 group-hover:text-white/40 absolute top-4 right-6">
                              0{idx + 1}
                            </span>
                            <h3 className="relative z-10 text-xl md:text-2xl font-medium text-gray-900 group-hover:text-white mb-2 transition-colors">
                              {option.label}
                            </h3>
                            <div className="relative z-10 w-8 h-[1px] bg-gray-300 group-hover:bg-[#D4AF37] group-hover:w-16 transition-all duration-500 mt-4"></div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* --- ANALYZING (STEP 3) --- */}
                  {step === 3 && (
                    <motion.div
                      key="analyzing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-[50vh]"
                    >
                       <div className="relative">
                          <motion.div 
                            className="absolute inset-0 border border-gray-200 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                          <motion.div 
                            className="absolute inset-0 border border-[#D4AF37]/30 rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                          />
                          <Loader2 className="w-12 h-12 text-black animate-spin relative z-10" />
                       </div>
                       <h3 className="mt-8 text-2xl font-serif text-gray-900">Curating your essence...</h3>
                       <p className="text-gray-500 mt-2 font-light">Analyzing notes of {selections.occasion?.keywords[1]} and {selections.vibe?.keywords[1]}</p>
                    </motion.div>
                  )}

                  {/* --- RESULT (STEP 4) --- */}
                  {step === 4 && (
                    <motion.div
                      key="result"
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="w-full max-w-6xl mx-auto my-10"
                    >
                      {error ? (
                         <div className="text-center py-20">
                            <h3 className="text-3xl font-serif mb-4">Connection Interrupted</h3>
                            <p className="text-gray-500 mb-8">{error}</p>
                            <button onClick={handleClose} className="text-black underline">Close</button>
                         </div>
                      ) : recommendation && (
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                          
                          {/* Left: Product Image */}
                          <motion.div 
                            className="w-full lg:w-1/2 relative group cursor-pointer"
                            onClick={() => navigate(`/product/${recommendation.id}`)}
                            whileHover={{ scale: 0.98 }}
                            transition={{ duration: 0.5 }}
                          >
                             <div className="aspect-[4/5] bg-[#f4f4f4] overflow-hidden relative">
                               <div className="absolute inset-4 border border-black/5 z-20 pointer-events-none"></div>
                               <img 
                                 src={optimizeImage(recommendation.imageurl?.[0] || recommendation.imageUrl, "hero")} 
                                 alt={recommendation.name}
                                 className="w-full h-full object-cover"
                               />
                               <div className="absolute bottom-8 left-8 z-30 bg-white/90 backdrop-blur px-6 py-3">
                                 <p className="text-xs uppercase tracking-widest font-bold">Your Match</p>
                               </div>
                             </div>
                          </motion.div>

                          {/* Right: Story */}
                          <div className="w-full lg:w-1/2 text-left">
                             <motion.div 
                               initial={{ opacity: 0, x: 20 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.3 }}
                             >
                               <div className="flex items-center gap-4 mb-6">
                                 <span className="h-[1px] w-12 bg-black"></span>
                                 <span className="text-sm font-bold uppercase tracking-widest text-gray-500">
                                   AI Concierge Recommendation
                                 </span>
                               </div>

                               <h1 className="text-5xl md:text-7xl font-serif text-black mb-6 leading-[0.9]">
                                 {recommendation.name}
                               </h1>

                               <p className="text-lg md:text-xl text-gray-600 font-light leading-relaxed mb-8 max-w-xl">
                                 {recommendation.description}
                               </p>

                               <div className="bg-[#fafafa] p-6 border-l-2 border-[#D4AF37] mb-10">
                                 <p className="font-serif italic text-xl text-gray-800 mb-2">
                                   "A perfect harmony."
                                 </p>
                                 <p className="text-sm text-gray-500">
                                   Selected because you desired a <strong className="text-black">{selections.vibe?.label}</strong> aura for <strong className="text-black">{selections.occasion?.label}</strong>.
                                 </p>
                               </div>

                               <div className="flex flex-wrap gap-4">
                                 <button 
                                   onClick={() => navigate(`/product/${recommendation.id}`)}
                                   className="bg-black text-white px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors duration-300"
                                 >
                                   Explore Scent
                                 </button>
                                 <button 
                                   onClick={restart}
                                   className="px-8 py-4 text-sm font-bold uppercase tracking-widest border border-gray-200 hover:border-black transition-colors flex items-center gap-2"
                                 >
                                   <RefreshCcw className="w-4 h-4" />
                                   Start Over
                                 </button>
                               </div>
                             </motion.div>
                          </div>

                        </div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body // 🟢 5. Render directly to body
      )}
    </>
  );
}