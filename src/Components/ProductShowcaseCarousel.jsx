// src/components/ProductSwipeShowcase.jsx
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

/* ------------------ scent + emoji data (can be moved to a separate file) ------------------ */
const scentDetails = {
  SHADOW: {
    slogan: "Where silence lingers longer than light.",
    story: `Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told. It begins with a crisp, cooling rush of peppermint and lavender, stirring curiosity. As it unfolds, earthy oakmoss and sensual sandalwood emerge, grounding the fragrance in sophistication. A warm finish of amber and musk cloaks the wearer like midnight silk. Best worn in evening hours, when the world slows and presence becomes power.`,
    notes: [
      "Peppermint",
      "Lavender Burst",
      "Oakmoss",
      "Geranium",
      "Sandalwood",
      "Amber",
      "Musk Facets",
    ],
  },
  SUNSET: {
    slogan: "Where golden light melts into longing.",
    story: `SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace. It opens with a vivid burst of saffron and grapefruit, laced with sage and bergamot, evoking the golden glow of dusk. The heart blooms with soft magnolia and jasmine, kissed by a hint of pepper — warm, intimate, alive. As it deepens, a rich foundation of oud and patchouli anchors the scent in sensual memory. Best worn at twilight, when the day exhales and romance begins to stir.`,
    notes: [
      "Saffron",
      "Sage",
      "Bergamot",
      "Grapefruit",
      "Magnolia",
      "Pepper",
      "Jasmine",
      "Oud",
      "Cedarwood",
      "Sandalwood",
      "Patchouli",
    ],
  },
  VIGOR: {
    slogan: "Where boldness breaks like sunrise.",
    story: `VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose. It opens in a blaze of grapefruit and pepper, charged with the cool clarity of violet leaves. At its core, clary sage and French lavender pulse with herbal strength, while a powerful base of amber wood and tonka grounds the composition in warmth and persistence. Designed for daylight hours, when ambition sharpens and confidence commands the room.`,
    notes: [
      "Grapefruit",
      "Violet Leaves",
      "Sichuan Pepper",
      "Clary Sage",
      "Geranium",
      "French Lavender",
      "Amber Wood",
      "Tonka Bean",
      "Cristal Moss",
    ],
  },
  "OUD HORIZON": {
    slogan: "Where tropics meet twilight — bold, bright, unforgettable.",
    story: `OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods. It begins with a burst of tropical exuberance: juicy mandarin, pineapple, and papaya, spiced gently by cardamom. A heart of sandalwood and amber follows, warm and magnetic, before settling into a complex tapestry of cedar, musk, and oud — refined, exotic, and lingering. Worn to make an impression, this scent is your signature when you want to arrive without speaking.`,
    notes: [
      "Mandarin Orange",
      "Papaya",
      "Bergamot",
      "Pineapple",
      "Cardamom",
      "Sandalwood",
      "Amber",
      "Musk",
      "Cedar",
      "Oakmoss",
      "Nutmeg",
      "Violet",
      "Orris Root",
      "Jasmine",
      "Lily-of-the-Valley",
    ],
  },
};
const NOTE_EMOJI = {
  PEPPERMINT: "🌿",
  SAGE: "🌿",
  "CLARY SAGE": "🌿",
  "FRENCH LAVENDER": "💜",
  LAVENDER: "💜",
  "LAVENDER BURST": "💜",
  JASMINE: "🌸",
  MAGNOLIA: "🌼",
  "LILY-OF-THE-VALLEY": "🌼",
  VIOLET: "💜",
  "VIOLET LEAVES": "💜",
  GERANIUM: "🌺",
  "ORRIS ROOT": "🌼",
  BERGAMOT: "🍋",
  GRAPEFRUIT: "🍊",
  "MANDARIN ORANGE": "🍊",
  PINEAPPLE: "🍍",
  PAPAYA: "🥭",
  MANGO: "🥭",
  TANGERINE: "🍊",
  SAFFRON: "🌾",
  "SICHUAN PEPPER": "🌶️",
  PEPPER: "🌶️",
  CARDAMOM: "🧂",
  NUTMEG: "🌰",
  "TONKA BEAN": "🫘",
  TONKA: "🫘",
  SANDALWOOD: "🪵",
  CEDARWOOD: "🌲",
  OUD: "🪵",
  "OUD HORIZON": "🪵",
  OAKMOSS: "🍃",
  "CRISTAL MOSS": "🍃",
  AMBER: "🟠",
  "AMBER WOOD": "🟠",
  MUSK: "🌫️",
  "MUSK FACETS": "🌫️",
  PATCHOULI: "🌿",
  VANILLA: "🍮",
  CEDAR: "🌲",
  DEFAULT: "✨",
};
function normalize(str) {
  return String(str || "").trim().toUpperCase();
}

function getNoteEmoji(note) {
  if (!note) return NOTE_EMOJI.DEFAULT;
  const key = note.trim().toUpperCase();
  if (NOTE_EMOJI[key]) return NOTE_EMOJI[key];
  for (const k of Object.keys(NOTE_EMOJI)) {
    if (k === "DEFAULT") continue;
    if (key.includes(k)) return NOTE_EMOJI[k];
  }
  const words = key.split(/\s+/);
  for (const w of words) {
    if (NOTE_EMOJI[w]) return NOTE_EMOJI[w];
  }
  return NOTE_EMOJI.DEFAULT;
}

const ACCENT_MAP = {
  SHADOW: { primary: "#2b2b2f", accent: "#8f8fa6" },
  SUNSET: { primary: "#7b3f00", accent: "#ffb366" },
  VIGOR: { primary: "#054a45", accent: "#00b39f" },
  "OUD HORIZON": { primary: "#4b3426", accent: "#c79b59" },
  DEFAULT: { primary: "#222", accent: "#b76e79" },
};

/* ------------------ main component ------------------ */
export default function ProductShowcaseCarousel() {
  const { products = [] } = useContext(ProductContext);
  const [activeIdx, setActiveIdx] = useState(0);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const containerRef = useRef(null);

  const onNext = useCallback(() => {
    setActiveIdx((i) => (products.length ? (i + 1) % products.length : 0));
    setStoryExpanded(false);
  }, [products.length]);

  const onPrev = useCallback(() => {
    setActiveIdx((i) =>
      products.length ? (i - 1 + products.length) % products.length : 0
    );
    setStoryExpanded(false);
  }, [products.length]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onNext(),
    onSwipedRight: () => onPrev(),
    trackMouse: true,
    trackTouch: true,
    delta: 10,
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

  const displayNotes = useMemo(() => {
    if (scent && scent.notes) return scent.notes;
    if (product.fragranceNotes) {
      return product.fragranceNotes.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [product, scent]);

  const accent = useMemo(() => {
    const key = normalize(product.name);
    return ACCENT_MAP[key] || ACCENT_MAP.DEFAULT;
  }, [product]);

  const storyText = (scent && scent.story) || product.description || "";
  const teaser = storyText.slice(0, 220).trim();
  const isLongStory = storyText && storyText.length > 220;

  const goToIndex = (i) => {
    setActiveIdx(i);
    setStoryExpanded(false);
  };

  const cardVariants = {
    enter: (direction) => ({
      opacity: 0,
      x: direction > 0 ? 80 : -80,
      scale: 0.98,
    }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (direction) => ({
      opacity: 0,
      x: direction > 0 ? -80 : 80,
      scale: 0.98,
    }),
  };

  const prevIdxRef = useRef(activeIdx);
  const direction =
    activeIdx === prevIdxRef.current ? 0 : activeIdx > prevIdxRef.current ? 1 : -1;
  useEffect(() => {
    prevIdxRef.current = activeIdx;
  }, [activeIdx]);

  return (
    <section className="bg-gray-50 py-14 font-sans text-gray-900">
      <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 mb-8">
        Discover Our Scents
      </h2>
      <div
        className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:items-start gap-8 px-4"
        ref={containerRef}
        style={{ ["--accent-primary"]: accent.primary, ["--accent-color"]: accent.accent }}
      >
        {/* CAROUSEL / SWIPE AREA */}
        <div
          className="relative w-full max-w-sm h-[480px] lg:h-[550px] flex items-center justify-center rounded-2xl bg-white shadow-xl perspective-1200"
          {...swipeHandlers}
          aria-roledescription="carousel"
          aria-label="Product carousel"
        >
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.div
              key={product.id ?? product.name ?? activeIdx}
              className="absolute w-[90%] h-[90%] rounded-xl overflow-hidden flex items-center justify-center transform-gpu"
              variants={cardVariants}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
            >
              <div
                className="w-full h-full bg-cover bg-center flex items-center justify-center"
                role="img"
                aria-label={product.name || "Product image"}
                style={{ backgroundImage: product.imageurl ? `url(${product.imageurl})` : undefined }}
              >
                {!product.imageurl && (
                  <div className="w-36 h-36 rounded-full bg-gray-200 border border-gray-300 shadow-md flex items-center justify-center">
                    <span className="text-6xl font-bold text-gray-500">
                      {(product.name || "").slice(0, 1)}
                    </span>
                  </div>
                )}
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, ${accent.primary}08, transparent)`,
                }}
                aria-hidden
              />
            </motion.div>
          </AnimatePresence>

          {/* Nav Arrows */}
          <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-2">
            <button
              className="pointer-events-auto w-12 h-12 rounded-full bg-white/80 shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 hover:bg-white"
              aria-label="Previous product"
              onClick={onPrev}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="pointer-events-auto w-12 h-12 rounded-full bg-white/80 shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 hover:bg-white"
              aria-label="Next product"
              onClick={onNext}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* INFO PANEL */}
        <div className="w-full lg:w-1/2 text-left p-2">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-3xl font-extrabold text-gray-900" style={{ color: accent.primary }}>
              {product.name || "Untitled"}
            </h3>
            <div
              className="ml-auto px-3 py-1 text-sm font-semibold rounded-full border"
              style={{ borderColor: `${accent.accent}33`, color: accent.primary }}
            >
              {scent ? "Signature" : "Fragrance"}
            </div>
          </div>

          {scent && <p className="text-lg italic text-gray-600 mb-4">“{scent.slogan}”</p>}

          <div className="flex flex-wrap gap-2 mb-4" aria-hidden>
            {product.tags?.slice(0, 3)?.map((t, i) => (
              <span
                key={i}
                className="px-4 py-2 text-sm font-semibold rounded-full border transition-transform hover:-translate-y-1"
                style={{
                  background: `linear-gradient(120deg, ${accent.primary}20, ${accent.primary}10)`,
                  borderColor: `${accent.primary}30`,
                  color: accent.primary,
                }}
              >
                {t}
              </span>
            ))}
            {!product.tags &&
              displayNotes.slice(0, 3).map((n, i) => (
                <span
                  key={i}
                  className="px-4 py-2 text-sm font-semibold rounded-full border transition-transform hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(120deg, ${accent.primary}20, ${accent.primary}10)`,
                    borderColor: `${accent.primary}30`,
                    color: accent.primary,
                  }}
                >
                  {n.split(/\s+/)[0]}
                </span>
              ))}
          </div>

          <div className="relative mt-6 mb-4">
            <p
              className={`text-base leading-relaxed text-gray-700 transition-[max-height,opacity] duration-300 overflow-hidden ${storyExpanded ? "max-h-[500px]" : "max-h-[72px]"}`}
              aria-expanded={storyExpanded}
              id="scent-story"
            >
              {storyExpanded ? storyText : teaser + (isLongStory ? "…" : "")}
            </p>
            {isLongStory && (
              <button
                className="inline-block mt-2 text-sm font-bold bg-transparent border-none cursor-pointer p-0 hover:underline"
                onClick={() => setStoryExpanded((s) => !s)}
                aria-expanded={storyExpanded}
                aria-controls="scent-story"
                style={{ color: accent.accent }}
              >
                {storyExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {displayNotes.map((n, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm transition-transform hover:translate-y-[-4px] hover:shadow-md"
                style={{
                  borderColor: `${accent.primary}20`,
                  boxShadow: `0 6px 18px ${accent.primary}08`,
                }}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-md border text-xl" style={{ borderColor: `${accent.primary}20` }}>
                  {getNoteEmoji(n)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{n}</div>
                  <div className="text-xs text-gray-500">Note</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center lg:justify-start mt-8">
            <div className="flex gap-2">
              {products.map((_, i) => (
                <button
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${i === activeIdx ? "scale-125" : "bg-gray-300"}`}
                  onClick={() => goToIndex(i)}
                  aria-label={`Go to product ${i + 1}`}
                  aria-selected={i === activeIdx}
                  style={i === activeIdx ? { background: accent.accent } : {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
