import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  RefreshCcw, 
  Sun, 
  Briefcase, 
  Moon, 
  Gem, 
  Zap, 
  Activity, 
  Waves, 
  Leaf,
  Droplets,
  Smile,
  Flame,
  CloudFog,
  Flower2,
  Heart,
  Trees,
  Crown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { optimizeImage } from "../utils/imageOptimizer";

// --- ORIGINAL DATA (Preserved) ---
const questions = [
  {
    id: "occasion",
    title: "The Setting",
    subtitle: "Where will your presence be felt?",
    options: [
      {
        label: "Daily Ritual",
        keywords: ["balanced", "clean", "fresh", "daily", "versatile", "soft", "modern"],
        desc: "For the effortless moments of everyday life.",
        icon: Sun
      },
      {
        label: "The Workspace",
        keywords: ["professional", "subtle", "crisp", "citrus", "clean", "office", "elegant"],
        desc: "Commanding respect with subtle elegance.",
        icon: Briefcase
      },
      {
        label: "Intimate Evening",
        keywords: ["romantic", "seductive", "warm", "spicy", "night", "sensual", "vanilla"],
        desc: "A night of closeness and whispered secrets.",
        icon: Moon
      },
      {
        label: "Grand Gala",
        keywords: ["sophisticated", "rich", "luxury", "oud", "classic", "gold", "formal"],
        desc: "For moments that require your absolute best.",
        icon: Gem
      },
      {
        label: "High Energy",
        keywords: ["bold", "loud", "sweet", "playful", "projection", "club", "energy"],
        desc: "To stand out in the crowd and pulse with life.",
        icon: Zap
      },
      {
        label: "Active Pursuit",
        keywords: ["sport", "aqua", "energy", "fresh", "citrus", "dynamic", "cool"],
        desc: "Freshness that keeps pace with your intensity.",
        icon: Activity
      },
      {
        label: "Coastal Escape",
        keywords: ["tropical", "marine", "coconut", "relaxing", "summer", "sun", "breeze"],
        desc: "Sun-drenched skin and salt in the air.",
        icon: Waves
      },
      {
        label: "Sanctuary",
        keywords: ["comfort", "warm", "woody", "soft", "calm", "peace", "intimate"],
        desc: "Quiet moments of reflection and peace.",
        icon: Leaf
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
        desc: "Pure, untouched, and crystal clear.",
        icon: Droplets
      },
      {
        label: "Playful Sweetness",
        keywords: ["sweet", "fruity", "vanilla", "gourmand", "playful", "bright", "joy"],
        desc: "A radiant burst of joy and indulgence.",
        icon: Smile
      },
      {
        label: "Dark Power",
        keywords: ["strong", "musk", "tobacco", "spicy", "bold", "leather", "power"],
        desc: "Unapologetic strength and dominance.",
        icon: Flame
      },
      {
        label: "Enigmatic Mystery",
        keywords: ["smoky", "incense", "dark", "complex", "enigma", "deep", "mystique"],
        desc: "A riddle wrapped in smoke and shadows.",
        icon: CloudFog
      },
      {
        label: "Timeless Elegance",
        keywords: ["floral", "refined", "powdery", "chic", "timeless", "luxury", "classy"],
        desc: "Grace that transcends eras.",
        icon: Flower2
      },
      {
        label: "Warm Seduction",
        keywords: ["amber", "warm", "spicy", "cinnamon", "sexy", "alluring", "cozy"],
        desc: "A magnetic pull that cannot be resisted.",
        icon: Heart
      },
      {
        label: "Earthy Roots",
        keywords: ["woody", "moss", "earthy", "vetiver", "natural", "calm", "serene"],
        desc: "Grounded in the strength of nature.",
        icon: Trees
      },
      {
        label: "Royal Opulence",
        keywords: ["oud", "gold", "saffron", "oriental", "intense", "expensive", "regal"],
        desc: "The scent of kings and queens.",
        icon: Crown
      },
    ],
  },
];

// --- ANIMATION CONFIG ---
const springTransition = { type: "spring", stiffness: 120, damping: 20, mass: 1 };
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const itemVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springTransition }
};

// --- COMPONENTS ---

export default function AuraFinder() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({ occasion: null, vibe: null });
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

  // Helper to map icons if not in data object (fallback)
  const getIcon = (OptionIcon) => OptionIcon ? <OptionIcon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />;

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
    }, 600);
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
      {/* ⚡️ TRIGGER BUTTON (Floating Pill) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-white pl-2 pr-6 py-2 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-black/5 group"
          >
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Concierge</span>
              <span className="font-serif italic text-black leading-none">Find your Aura</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ⚡️ MAIN MODAL OVERLAY */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-[#FAFAFA] overflow-y-auto smooth-scrolling overflow-x-hidden"
            >
              <div className="min-h-screen relative flex flex-col items-center">
                
                {/* 🟢 STICKY HEADER (Glassmorphism Pill) */}
                <motion.div 
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, ...springTransition }}
                  className="sticky top-6 z-[10001] w-full flex justify-center pointer-events-none px-4"
                >
                  <div className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] rounded-full px-6 py-3 flex items-center gap-6">
                    <div className="flex align-items-center gap-4">
                      <h1 className="font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Devid Aura</h1>
                      <h3 className=" italic text-sm text-black">
                        {step === 3 ? "Analyzing..." : step === 4 ? "Recommendation" : "Concierge"}
                      </h3>
                    </div>
                    <div className="w-[1px] h-6 bg-black/5"></div>
                    <button 
                      onClick={handleClose}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors duration-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>

                <div className="w-full max-w-7xl px-6 md:px-12 py-20 md:py-12 flex-grow flex flex-col justify-center">
                  <AnimatePresence mode="wait">

                    {/* --- STEP 1 & 2: SELECTION --- */}
                    {(step === 1 || step === 2) && (
                      <motion.div
                        key={`step-${step}`}
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full"
                      >
                        <motion.div variants={itemVariant} className="text-center mb-16">
                          <span className="inline-block px-3 py-1 rounded-full bg-black/5 text-black/60 text-[10px] font-bold uppercase tracking-widest mb-4">
                            0{step} / 02
                          </span>
                          <h2 className="text-4xl md:text-6xl font-serif text-black mb-4">
                            {questions[step - 1].title}
                          </h2>
                          <p className="text-gray-400 uppercase tracking-widest text-xs font-medium">
                            {questions[step - 1].subtitle}
                          </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                          {questions[step - 1].options.map((option, idx) => (
                            <motion.button
                              key={option.label}
                              variants={itemVariant}
                              onClick={() => handleSelection(option)}
                              className="group relative bg-white rounded-3xl p-8 text-left border border-black/[0.02] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden"
                            >
                              {/* Hover Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="w-10 h-10 rounded-2xl bg-gray-50 group-hover:bg-[#D4AF37]/10 flex items-center justify-center text-gray-400 group-hover:text-[#D4AF37] transition-colors duration-300">
                                    {getIcon(option.icon)}
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-300 group-hover:text-black transition-colors">
                                    0{idx + 1}
                                  </span>
                                </div>
                                
                                <h3 className="text-xl font-serif text-gray-900 group-hover:text-black mb-2 transition-colors">
                                  {option.label}
                                </h3>
                                
                                <p className="text-xs text-gray-500 font-medium leading-relaxed group-hover:text-gray-700 transition-colors">
                                  {option.desc}
                                </p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* --- STEP 3: ANALYZING --- */}
                    {step === 3 && (
                      <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center min-h-[50vh]"
                      >
                        <div className="relative w-24 h-24 mb-10">
                          <motion.div 
                            className="absolute inset-0 border-4 border-gray-100 rounded-full" 
                          />
                          <motion.div 
                            className="absolute inset-0 border-4 border-t-[#D4AF37] border-r-[#D4AF37] border-b-transparent border-l-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-[#D4AF37] opacity-50" />
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Curating</h3>
                          <p className="font-serif text-2xl md:text-3xl text-black">
                            {selections.occasion?.keywords[0]} <span className="text-gray-300">&</span> {selections.vibe?.keywords[0]}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* --- STEP 4: RESULT --- */}
                    {step === 4 && (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full flex flex-col items-center"
                      >
                        {error ? (
                          <div className="text-center">
                            <h3 className="text-2xl font-serif italic mb-4">Connection Interrupted</h3>
                            <button onClick={handleClose} className="text-xs uppercase tracking-widest border-b border-[#D4AF37]">Close</button>
                          </div>
                        ) : recommendation && (
                          <div className="w-full max-w-6xl flex flex-col md:flex-row items-center md:items-stretch gap-10 md:gap-20">
                            
                            {/* Left: Soft Rounded Image */}
                            <motion.div 
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                              className="w-full md:w-5/12 aspect-[3/4] relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] bg-white border border-black/[0.02]"
                            >
                              <img 
                                src={optimizeImage(recommendation.imageurl?.[0] || recommendation.imageUrl, "hero")}
                                alt={recommendation.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-black">Perfect Match</span>
                              </div>
                            </motion.div>

                            {/* Right: Content */}
                            <motion.div 
                              initial={{ x: 20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.3, duration: 0.8 }}
                              className="w-full md:w-7/12 flex flex-col justify-center text-center md:text-left py-8"
                            >
                              <div className="mb-6">
                                <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] block mb-4">
                                  Devid Aura Exclusive
                                </span>
                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-black leading-[0.9] mb-8">
                                  {recommendation.name}
                                </h1>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="bg-white p-6 rounded-3xl border border-black/[0.02] shadow-sm">
                                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">The Composition</h4>
                                  <p className="font-serif text-lg leading-relaxed text-gray-800">
                                    {recommendation.description?.slice(0, 100)}...
                                  </p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-black/[0.02] shadow-sm flex flex-col justify-center">
                                   <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                     Selected for its ability to harmonize the <span className="text-black">{selections.occasion?.label}</span> environment with your desire for <span className="text-black">{selections.vibe?.label}</span>.
                                   </p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button
                                  onClick={() => navigate(`/product/${recommendation.id}`)}
                                  className="bg-black text-white px-10 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-black/20 hover:scale-105 hover:shadow-xl transition-all duration-300"
                                >
                                  View Product
                                </button>
                                <button
                                  onClick={restart}
                                  className="px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-gray-200 hover:border-black hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                  <RefreshCcw className="w-3 h-3" />
                                  Restart
                                </button>
                              </div>

                            </motion.div>
                          </div>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}