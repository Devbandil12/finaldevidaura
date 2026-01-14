import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { optimizeImage } from "../utils/imageOptimizer";

// ... (Configuration arrays remain the same) ...
const questions = [
  {
    id: "occasion",
    title: "The Setting",
    subtitle: "Where will your presence be felt?",
    options: [
      { 
        label: "Daily Ritual", 
        keywords: ["balanced", "clean", "fresh", "daily", "versatile", "soft", "modern"],
        desc: "For the effortless moments of everyday life."
      },
      { 
        label: "The Workspace", 
        keywords: ["professional", "subtle", "crisp", "citrus", "clean", "office", "elegant"],
        desc: "Commanding respect with subtle elegance."
      },
      { 
        label: "Intimate Evening", 
        keywords: ["romantic", "seductive", "warm", "spicy", "night", "sensual", "vanilla"],
        desc: "A night of closeness and whispered secrets."
      },
      { 
        label: "Grand Gala", 
        keywords: ["sophisticated", "rich", "luxury", "oud", "classic", "gold", "formal"],
        desc: "For moments that require your absolute best."
      },
      { 
        label: "High Energy", 
        keywords: ["bold", "loud", "sweet", "playful", "projection", "club", "energy"],
        desc: "To stand out in the crowd and pulse with life."
      },
      { 
        label: "Active Pursuit", 
        keywords: ["sport", "aqua", "energy", "fresh", "citrus", "dynamic", "cool"],
        desc: "Freshness that keeps pace with your intensity."
      },
      { 
        label: "Coastal Escape", 
        keywords: ["tropical", "marine", "coconut", "relaxing", "summer", "sun", "breeze"],
        desc: "Sun-drenched skin and salt in the air."
      },
      { 
        label: "Sanctuary", 
        keywords: ["comfort", "warm", "woody", "soft", "calm", "peace", "intimate"],
        desc: "Quiet moments of reflection and peace."
      },
    ],
  },
  {
    id: "vibe",
    title: "The Essence",
    subtitle: "What story should your scent tell?",
    options: [
      { 
        label: "Clean Minimalism", 
        keywords: ["citrus", "aqua", "clean", "fresh", "soapy", "crisp", "uplifting"],
        desc: "Pure, untouched, and crystal clear."
      },
      { 
        label: "Playful Sweetness", 
        keywords: ["sweet", "fruity", "vanilla", "gourmand", "playful", "bright", "joy"],
        desc: "A radiant burst of joy and indulgence."
      },
      { 
        label: "Dark Power", 
        keywords: ["strong", "musk", "tobacco", "spicy", "bold", "leather", "power"],
        desc: "Unapologetic strength and dominance."
      },
      { 
        label: "Enigmatic Mystery", 
        keywords: ["smoky", "incense", "dark", "complex", "enigma", "deep", "mystique"],
        desc: "A riddle wrapped in smoke and shadows."
      },
      { 
        label: "Timeless Elegance", 
        keywords: ["floral", "refined", "powdery", "chic", "timeless", "luxury", "classy"],
        desc: "Grace that transcends eras."
      },
      { 
        label: "Warm Seduction", 
        keywords: ["amber", "warm", "spicy", "cinnamon", "sexy", "alluring", "cozy"],
        desc: "A magnetic pull that cannot be resisted."
      },
      { 
        label: "Earthy Roots", 
        keywords: ["woody", "moss", "earthy", "vetiver", "natural", "calm", "serene"],
        desc: "Grounded in the strength of nature."
      },
      { 
        label: "Royal Opulence", 
        keywords: ["oud", "gold", "saffron", "oriental", "intense", "expensive", "regal"],
        desc: "The scent of kings and queens."
      },
    ],
  },
];

const transitionSettings = { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] };

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.6, delay: 0.2 } }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      staggerChildren: 0.1, 
      delayChildren: 0.2,
      ...transitionSettings 
    } 
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    transition: { duration: 0.5, ease: "easeInOut" } 
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitionSettings },
};

export default function AuraFinder() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); 
  const [selections, setSelections] = useState({ occasion: null, vibe: null });
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

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
    }, 800);
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
      }, 2500);

    } catch (err) {
      console.error("Aura Match Error:", err);
      setError("Our concierge is momentarily unavailable.");
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
      {/* ⚡️ TRIGGER BUTTON (Responsive Update) */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, paddingRight: "1.5rem" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          // UPDATED CLASSES HERE:
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 bg-white text-black px-4 py-3 md:px-6 md:py-4 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] flex items-center gap-2 md:gap-3 border border-gray-100 group transition-all duration-300 max-w-[calc(100vw-2rem)]"
        >
          {/* Icon Container - slightly smaller on mobile */}
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black flex items-center justify-center text-[#D4AF37] shrink-0">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
          </div>
          
          <div className="flex flex-col items-start">
            {/* Subtitle - smaller on mobile */}
            <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              Concierge
            </span>
            {/* Main Text - text-sm on mobile, text-lg on desktop */}
            <span className="font-serif italic text-sm md:text-lg leading-none pr-1 whitespace-nowrap">
              Find your Aura
            </span>
          </div>
        </motion.button>
      )}

      {/* ⚡️ FULL SCREEN OVERLAY (Portal) */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-[#fafafa] overflow-y-auto overflow-x-hidden"
              data-lenis-prevent 
            >
              {/* Decorative Lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-black/5 hidden md:block"></div>
                <div className="absolute right-10 top-0 bottom-0 w-[1px] bg-black/5 hidden md:block"></div>
                <div className="absolute top-24 left-0 right-0 h-[1px] bg-black/5 hidden md:block"></div>
                <div className="absolute bottom-10 left-0 right-0 h-[1px] bg-black/5 hidden md:block"></div>
              </div>

              {/* 🟢 NEW: PREMIUM MAIN HEADING (Fixed at top) */}
              <div className="absolute top-0 left-0 w-full flex justify-center py-8 z-20 pointer-events-none">
                <div className="flex flex-col items-center">
                   <h1 className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-1">Devid Aura</h1>
                   <h2 className="font-serif italic text-xl md:text-2xl text-black">The Olfactory Concierge</h2>
                </div>
              </div>

              {/* Close Button (Updated Hover) */}
              <button 
                onClick={handleClose}
                className="fixed top-6 right-6 md:top-8 md:right-8 z-50 p-3 rounded-full hover:bg-black group transition-colors duration-300"
              >
                <X className="w-6 h-6 text-black/60 group-hover:text-white transition-colors duration-300" />
              </button>

              <div className="w-full max-w-7xl px-6 md:px-20 relative z-10 py-10 min-h-screen flex flex-col justify-center" data-lenis-prevent>
                <AnimatePresence mode="wait">
                  
                  {/* --- QUESTIONS (STEP 1 & 2) --- */}
                  {(step === 1 || step === 2) && (
                    <motion.div
                      key={`step-${step}`}
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="w-full mt-16 md:mt-0"
                    >
                      {/* Header */}
                      <motion.div variants={itemVariants} className="mb-10 md:mb-24 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                           <span className="text-[10px] md:text-xs font-bold font-sans tracking-[0.3em] text-[#D4AF37]">
                             0{step} <span className="text-gray-300 mx-2">/</span> 02
                           </span>
                           <div className="h-[1px] w-12 bg-[#D4AF37] hidden md:block"></div>
                        </div>
                        
                        <h2 className="text-4xl md:text-7xl lg:text-8xl font-serif italic text-black mb-4 tracking-tight">
                          {questions[step - 1].title}
                        </h2>
                        <p className="text-xs md:text-base text-gray-500 font-sans tracking-wide uppercase max-w-xl mx-auto md:mx-0">
                          {questions[step - 1].subtitle}
                        </p>
                      </motion.div>
                      
                      {/* Options Grid - Editorial Style */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-y-12">
                        {questions[step - 1].options.map((option, idx) => (
                          <motion.button
                            key={option.label}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            onClick={() => handleSelection(option)}
                            className="group relative flex flex-col text-left outline-none p-2 md:p-0"
                          >
                            {/* Top Border */}
                            <div className="w-full h-[1px] bg-black/10 group-hover:bg-[#D4AF37] transition-colors duration-500 mb-4 md:mb-6 relative overflow-hidden">
                              <div className="absolute inset-0 bg-[#D4AF37] -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[0.22,1,0.36,1]"></div>
                            </div>

                            <span className="text-[10px] font-sans font-bold text-gray-400 group-hover:text-[#D4AF37] transition-colors mb-2 md:mb-3">
                              0{idx + 1}
                            </span>
                            
                            <h3 className="text-xl md:text-3xl font-serif text-gray-900 group-hover:italic transition-all duration-300 mb-2 md:mb-3">
                              {option.label}
                            </h3>
                            
                            <p className="text-xs md:text-sm text-gray-500 font-light leading-relaxed group-hover:text-black transition-colors duration-300">
                              {option.desc}
                            </p>

                            {/* Hover Icon */}
                            <div className="absolute top-2 right-2 md:top-0 md:right-0 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:-translate-y-2 group-hover:translate-x-2">
                               <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                            </div>
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
                      className="absolute inset-0 flex flex-col items-center justify-center bg-[#fafafa] z-50"
                    >
                        {/* Elegant Spinner */}
                        <div className="w-24 h-24 border-[1px] border-black/5 rounded-full relative flex items-center justify-center">
                          <motion.div 
                             className="absolute inset-0 border-t-[1px] border-black rounded-full"
                             animate={{ rotate: 360 }}
                             transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                          />
                          <motion.div 
                             className="w-16 h-16 bg-[#D4AF37]/10 rounded-full blur-xl"
                             animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </div>
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-10 text-center space-y-2"
                        >
                          <h3 className="text-lg uppercase tracking-[0.2em] font-sans font-bold">Curating</h3>
                          <p className="font-serif italic text-xl md:text-2xl text-gray-400">
                            Harmonizing {selections.occasion?.keywords[1]} & {selections.vibe?.keywords[1]}...
                          </p>
                        </motion.div>
                    </motion.div>
                  )}

                  {/* --- RESULT (STEP 4) --- */}
                  {step === 4 && (
                    <motion.div
                      key="result"
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="w-full flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-24 mt-16 md:mt-0"
                    >
                      {error ? (
                          <div className="text-center py-20 w-full">
                             <h3 className="text-3xl font-serif mb-4 italic">Connection Interrupted</h3>
                             <button onClick={handleClose} className="text-xs uppercase tracking-widest underline decoration-[#D4AF37] underline-offset-4">Close Concierge</button>
                          </div>
                      ) : recommendation && (
                        <>
                          {/* Left: Product Image */}
                          <motion.div 
                            variants={itemVariants}
                            className="w-full lg:w-[45%] relative group cursor-pointer"
                            onClick={() => navigate(`/product/${recommendation.id}`)}
                          >
                             <div className="aspect-[3/4] overflow-hidden bg-[#f0f0f0] relative">
                               <motion.img 
                                 initial={{ scale: 1.1 }}
                                 animate={{ scale: 1 }}
                                 transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                 src={optimizeImage(recommendation.imageurl?.[0] || recommendation.imageUrl, "hero")} 
                                 alt={recommendation.name}
                                 className="w-full h-full object-cover"
                               />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                               <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 border border-white/20">
                                 <span className="text-[10px] uppercase tracking-[0.2em] font-bold">The Match</span>
                               </div>
                             </div>
                          </motion.div>

                          {/* Right: The Story */}
                          <motion.div variants={contentVariants} className="w-full lg:w-[55%] pt-4 lg:pt-12 text-center lg:text-left pb-10 lg:pb-0">
                             
                             <div className="inline-flex flex-col items-center lg:items-start mb-6">
                               <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-2">Devid Aura Exclusive</span>
                               <div className="h-[1px] w-full bg-[#D4AF37]/30"></div>
                             </div>

                             <h1 className="text-5xl md:text-6xl lg:text-8xl font-serif italic text-black mb-8 leading-[0.9]">
                               {recommendation.name}
                             </h1>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                               <div>
                                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Composition</h4>
                                  <p className="text-base md:text-lg font-serif leading-relaxed text-gray-800">
                                    {recommendation.description?.slice(0, 100)}...
                                  </p>
                               </div>
                               <div>
                                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Why It Fits</h4>
                                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-light">
                                    Ideally suited for a <span className="text-black font-medium">{selections.occasion?.label}</span> setting where you wish to project <span className="text-black font-medium">{selections.vibe?.label}</span>.
                                  </p>
                               </div>
                             </div>

                             {/* Action Buttons */}
                             <div className="flex flex-col md:flex-row gap-4 justify-center lg:justify-start">
                               <button 
                                 onClick={() => navigate(`/product/${recommendation.id}`)}
                                 className="bg-black text-white px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] hover:text-black transition-all duration-500 min-w-[200px]"
                               >
                                 View Product
                               </button>
                               <button 
                                 onClick={restart}
                                 className="px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] border border-black/10 hover:border-black transition-all duration-500 flex items-center justify-center gap-3 min-w-[160px] group"
                               >
                                 <RefreshCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-700" />
                                 Restart
                               </button>
                             </div>

                          </motion.div>
                        </>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}