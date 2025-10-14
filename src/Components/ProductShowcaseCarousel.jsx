import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ProductContext } from "../contexts/productContext";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ------------------ DATA (Keep this as is) ------------------ */
const scentDetails = {
  SHADOW: {
    slogan: "Where silence lingers longer than light.",
    story: `Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told. It begins with a crisp, cooling rush of peppermint and lavender, stirring curiosity. As it unfolds, earthy oakmoss and sensual sandalwood emerge, grounding the fragrance in sophistication. A warm finish of amber and musk cloaks the wearer like midnight silk. Best worn in evening hours, when the world slows and presence becomes power.`,
    notes: ["Peppermint", "Lavender Burst", "Oakmoss", "Geranium", "Sandalwood", "Amber", "Musk Facets"],
  },
  SUNSET: {
    slogan: "Where golden light melts into longing.",
    story: `SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace. It opens with a vivid burst of saffron and grapefruit, laced with sage and bergamot, evoking the golden glow of dusk. The heart blooms with soft magnolia and jasmine, kissed by a hint of pepper — warm, intimate, alive. As it deepens, a rich foundation of oud and patchouli anchors the scent in sensual memory. Best worn at twilight, when the day exhales and romance begins to stir.`,
    notes: ["Saffron", "Sage", "Bergamot", "Grapefruit", "Magnolia", "Pepper", "Jasmine", "Oud", "Cedarwood", "Sandalwood", "Patchouli"],
  },
  VIGOR: {
    slogan: "Where boldness breaks like sunrise.",
    story: `VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose. It opens in a blaze of grapefruit and pepper, charged with the cool clarity of violet leaves. At its core, clary sage and French lavender pulse with herbal strength, while a powerful base of amber wood and tonka grounds the composition in warmth and persistence. Designed for daylight hours, when ambition sharpens and confidence commands the room.`,
    notes: ["Grapefruit", "Violet Leaves", "Sichuan Pepper", "Clary Sage", "Geranium", "French Lavender", "Amber Wood", "Tonka Bean", "Cristal Moss"],
  },
  "OUD HORIZON": {
    slogan: "Where tropics meet twilight — bold, bright, unforgettable.",
    story: `OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods. It begins with a burst of tropical exuberance: juicy mandarin, pineapple, and papaya, spiced gently by cardamom. A heart of sandalwood and amber follows, warm and magnetic, before settling into a complex tapestry of cedar, musk, and oud — refined, exotic, and lingering. Worn to make an impression, this scent is your signature when you want to arrive without speaking.`,
    notes: ["Mandarin Orange", "Papaya", "Bergamot", "Pineapple", "Cardamom", "Sandalwood", "Amber", "Musk", "Cedar", "Oakmoss", "Nutmeg", "Violet", "Orris Root", "Jasmine", "Lily-of-the-Valley"],
  },
};
const NOTE_EMOJI = { PEPPERMINT: "🌿", SAGE: "🌿", "CLARY SAGE": "🌿", "FRENCH LAVENDER": "💜", LAVENDER: "💜", "LAVENDER BURST": "💜", JASMINE: "🌸", MAGNOLIA: "🌼", "LILY-OF-THE-VALLEY": "🌼", VIOLET: "💜", "VIOLET LEAVES": "💜", GERANIUM: "🌺", "ORRIS ROOT": "🌼", BERGAMOT: "🍋", GRAPEFRUIT: "🍊", "MANDARIN ORANGE": "🍊", PINEAPPLE: "🍍", PAPAYA: "🥭", MANGO: "🥭", TANGERINE: "🍊", SAFFRON: "🌾", "SICHUAN PEPPER": "🌶️", PEPPER: "🌶️", CARDAMOM: "🧂", NUTMEG: "🌰", "TONKA BEAN": "🫘", TONKA: "🫘", SANDALWOOD: "🪵", CEDARWOOD: "🌲", OUD: "🪵", "OUD HORIZON": "🪵", OAKMOSS: "🍃", "CRISTAL MOSS": "🍃", AMBER: "🟠", "AMBER WOOD": "🟠", MUSK: "🌫️", "MUSK FACETS": "🌫️", PATCHOULI: "🌿", VANILLA: "🍮", CEDAR: "🌲", DEFAULT: "✨" };
function normalize(str) { return String(str || "").trim().toUpperCase(); }
function getNoteEmoji(note) { if (!note) return NOTE_EMOJI.DEFAULT; const key = note.trim().toUpperCase(); if (NOTE_EMOJI[key]) return NOTE_EMOJI[key]; for (const k of Object.keys(NOTE_EMOJI)) { if (k === "DEFAULT") continue; if (key.includes(k)) return NOTE_EMOJI[k]; } const words = key.split(/\s+/); for (const w of words) { if (NOTE_EMOJI[w]) return NOTE_EMOJI[w]; } return NOTE_EMOJI.DEFAULT; }
const ACCENT_MAP = {
  SHADOW: { primary: "#4a4a58", accent: "#b8b8d0" },
  SUNSET: { primary: "#D95D39", accent: "#FFCB9A" },
  VIGOR: { primary: "#0A8754", accent: "#5BE7C4" },
  "OUD HORIZON": { primary: "#8C5E45", accent: "#F9B572" },
  DEFAULT: { primary: "#333", accent: "#aaa" },
};

/* ------------------ ANIMATION VARIANTS ------------------ */
const wrapperVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.45, 0, 0.55, 1] },
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { duration: 0.5, ease: [0.45, 0, 0.55, 1] },
  }),
};

const imageVariants = {
  enter: (direction) => ({
    opacity: 0,
    scale: 0.8,
    rotateY: direction > 0 ? -45 : 45,
  }),
  center: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
  },
  exit: (direction) => ({
    opacity: 0,
    scale: 0.8,
    rotateY: direction > 0 ? 45 : -45,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const infoVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.08, // This makes child elements animate in sequence
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

/* ------------------ MAIN COMPONENT ------------------ */
export default function ImmersiveProductShowcase() {
  const { products = [] } = useContext(ProductContext);
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [storyExpanded, setStoryExpanded] = useState(false);

  const onNext = useCallback(() => {
    setDirection(1);
    setActiveIdx((i) => (products.length ? (i + 1) % products.length : 0));
    setStoryExpanded(false);
  }, [products.length]);

  const onPrev = useCallback(() => {
    setDirection(-1);
    setActiveIdx((i) =>
      products.length ? (i - 1 + products.length) % products.length : 0
    );
    setStoryExpanded(false);
  }, [products.length]);

  const goToIndex = (i) => {
    setDirection(i > activeIdx ? 1 : -1);
    setActiveIdx(i);
    setStoryExpanded(false);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onNext(),
    onSwipedRight: () => onPrev(),
    trackMouse: true,
  });

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrev]);

  useEffect(() => {
    if (!products || products.length === 0) return;
    if (activeIdx >= products.length) setActiveIdx(0);
  }, [products, activeIdx]);

  const product = products[activeIdx] || {};
  const scent = scentDetails[normalize(product.name)];

  const accent = useMemo(() => {
    const key = normalize(product.name);
    return ACCENT_MAP[key] || ACCENT_MAP.DEFAULT;
  }, [product]);

  const storyText = (scent && scent.story) || product.description || "";
  const teaser = storyText.slice(0, 150).trim();
  const isLongStory = storyText && storyText.length > 150;

  return (
    <>

      <h2
        className="
    text-lg md:text-2xl lg:text-6xl
    font-extrabold uppercase tracking-wider
    block px-3 py-1
    transition-transform duration-200 ease-out
    motion-reduce:transition-none motion-reduce:transform-none
    mx-auto text-center mb-8 mt-18
  "
      >
        EXPLORE OUR SCENTS
      </h2>

      <section
        className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden rounded-md font-sans transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accent.accent}15, ${accent.primary}40, transparent 70%), #f8f9fa`
        }}
      >

        <div
          className="relative w-full max-w-7xl h-full grid grid-cols-1 lg:grid-cols-2 items-center gap-8 px-4 py-16"
          {...swipeHandlers}
        >

          {/* --- LEFT / INFO PANEL --- */}
          <motion.div
            key={activeIdx}
            className="w-full h-full flex flex-col justify-center text-center lg:text-left relative z-10"
            variants={infoVariants}
            initial="hidden"
            animate="visible"
          >


            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={product.name || activeIdx}
                  className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase"
                  style={{ color: accent.primary }}
                  variants={itemVariants}
                >
                  {product.name || "Untitled Scent"}
                </motion.h1>
              </AnimatePresence>
            </div>
            <motion.p variants={itemVariants} className="font-serif text-xl italic mb-2" style={{ color: accent.primary }}>
              {scent?.slogan || "An unforgettable essence"}
            </motion.p>

            <motion.div variants={itemVariants} className="mt-6 text-base text-gray-700 max-w-lg mx-auto lg:mx-0">
              <p id="scent-story" className="transition-all duration-500">
                {storyExpanded ? storyText : teaser + (isLongStory ? "…" : "")}
              </p>
              {isLongStory && (
                <button
                  className="inline-block mt-3 text-sm font-bold tracking-wide transition hover:opacity-70"
                  onClick={() => setStoryExpanded((s) => !s)}
                  style={{ color: accent.primary }}
                  aria-controls="scent-story"
                >
                  {storyExpanded ? "SHOW LESS" : "READ MORE"}
                </button>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-x-6 gap-y-3 mt-8 max-w-sm mx-auto lg:mx-0">
              {(scent?.notes || []).slice(0, 6).map((note, i) => (
                <motion.div
                  key={note + i}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
                >
                  <span className="text-xl">{getNoteEmoji(note)}</span>
                  <span className="text-sm text-neutral-600">{note}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination Dots */}
            <motion.div variants={itemVariants} className="flex justify-center lg:justify-start gap-3 mt-10">
              {products.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${i === activeIdx ? 'scale-125' : 'bg-gray-300 hover:bg-gray-400'}`}
                  style={i === activeIdx ? { backgroundColor: accent.primary } : {}}
                  aria-label={`Go to product ${i + 1}`}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* --- RIGHT / IMAGE CAROUSEL --- */}
          <div className="relative w-full h-[450px] md:h-[600px] flex items-center justify-center perspective-1200">
            {/* Background Typography */}
            <AnimatePresence>
              <motion.div
                key={`${activeIdx}-bg-text`}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-[6rem] md:text-[11rem] font-black uppercase text-center leading-none" style={{ color: `${accent.primary}10` }}>
                  {(product.name || "").slice(0,)}
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* Image */}
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={product.id ?? product.name ?? activeIdx}
                className="absolute w-64 h-96 md:w-80 md:h-[480px] rounded-2xl shadow-2xl overflow-hidden transform-style-3d"
                variants={imageVariants}
                custom={direction}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${product.imageurl?.[0]})` }}
                />
                {!product.imageurl && (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-7xl font-bold" style={{ color: accent.primary }}>
                      {(product.name || "P").slice(0, 1)}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <div className="absolute inset-0 z-20 flex justify-between items-center pointer-events-none px-[-1rem] md:px-0">
              <motion.button
                onClick={onPrev}
                className="pointer-events-auto w-12 h-12 rounded-full bg-white/50 backdrop-blur-sm shadow-lg flex items-center justify-center transition-transform hover:scale-110 hover:bg-white/80"
                aria-label="Previous product"
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft size={24} color={accent.primary} />
              </motion.button>
              <motion.button
                onClick={onNext}
                className="pointer-events-auto w-12 h-12 rounded-full bg-white/50 backdrop-blur-sm shadow-lg flex items-center justify-center transition-transform hover:scale-110 hover:bg-white/80"
                aria-label="Next product"
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight size={24} color={accent.primary} />
              </motion.button>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}