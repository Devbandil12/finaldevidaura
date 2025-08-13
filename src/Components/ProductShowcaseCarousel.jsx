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
import "../style/ProductSwipeShowcase.css";

/* ------------------ scent + emoji data (can be moved to a separate file) ------------------ */
const scentDetails = {
  SHADOW: {
    slogan: "Where silence lingers longer than light.",
    story: `Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told.
It begins with a crisp, cooling rush of peppermint and lavender, stirring curiosity. As it unfolds, earthy oakmoss and sensual sandalwood emerge, grounding the fragrance in sophistication. A warm finish of amber and musk cloaks the wearer like midnight silk.
Best worn in evening hours, when the world slows and presence becomes power.`,
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
    story: `SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace. It opens with a vivid burst of saffron and grapefruit, laced with sage and bergamot, evoking the golden glow of dusk.
The heart blooms with soft magnolia and jasmine, kissed by a hint of pepper — warm, intimate, alive. As it deepens, a rich foundation of oud and patchouli anchors the scent in sensual memory.
Best worn at twilight, when the day exhales and romance begins to stir.`,
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
    story: `VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose. It opens in a blaze of grapefruit and pepper, charged with the cool clarity of violet leaves.
At its core, clary sage and French lavender pulse with herbal strength, while a powerful base of amber wood and tonka grounds the composition in warmth and persistence.
Designed for daylight hours, when ambition sharpens and confidence commands the room.`,
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
    story: `OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods. It begins with a burst of tropical exuberance: juicy mandarin, pineapple, and papaya, spiced gently by cardamom.
A heart of sandalwood and amber follows, warm and magnetic, before settling into a complex tapestry of cedar, musk, and oud — refined, exotic, and lingering.
Worn to make an impression, this scent is your signature when you want to arrive without speaking.`,
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

/* ------------------ accent color map for each scent (mood-driven) ------------------ */
const ACCENT_MAP = {
  SHADOW: { primary: "#2b2b2f", accent: "#8f8fa6" }, // charcoal / silver
  SUNSET: { primary: "#7b3f00", accent: "#ffb366" }, // warm gold / coral
  VIGOR: { primary: "#054a45", accent: "#00b39f" }, // teal / amber-ish
  "OUD HORIZON": { primary: "#4b3426", accent: "#c79b59" }, // brown / gold
  DEFAULT: { primary: "#222", accent: "#b76e79" },
};

/* ------------------ small reusable UI components ------------------ */
function Badge({ children, color }) {
  return (
    <span
      className="ps-badge"
      style={
        color
          ? {
              background: `linear-gradient(120deg, ${color}20, ${color}10)`,
              borderColor: `${color}30`,
              color: `${color}`,
            }
          : {}
      }
    >
      {children}
    </span>
  );
}

/* ------------------ main component ------------------ */
export default function ProductSwipeShowcase() {
  const { products = [] } = useContext(ProductContext);
  const [activeIdx, setActiveIdx] = useState(0);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : true
  );

  // refs for keyboard focus and wrapper
  const containerRef = useRef(null);

  // Update isMobile on resize
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Ensure index valid when products change
  useEffect(() => {
    if (!products || products.length === 0) return;
    if (activeIdx >= products.length) setActiveIdx(0);
  }, [products, activeIdx]);

  // Swipe handlers (react-swipeable) - enables touch + mouse drag
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

  // keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrev]);

  // Compose display data for current product
  const product = products[activeIdx] || {};
  const scent = scentDetails[normalize(product.name)];
  const displayNotes = useMemo(() => {
    if (scent && scent.notes) return scent.notes;
    if (product.fragranceNotes) {
      return product.fragranceNotes.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [product, scent]);

  // Dynamic accent
  const accent = useMemo(() => {
    const key = normalize(product.name);
    return ACCENT_MAP[key] || ACCENT_MAP.DEFAULT;
  }, [product]);

  const storyText = (scent && scent.story) || product.description || "";
  const teaser = storyText.slice(0, 220).trim();
  const isLongStory = storyText && storyText.length > 220;

  // dot click
  const goToIndex = (i) => {
    setActiveIdx(i);
    setStoryExpanded(false);
  };

  // small animation variants for framer-motion
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

  // direction for animation based on index change
  const prevIdxRef = useRef(activeIdx);
  const direction =
    activeIdx === prevIdxRef.current
      ? 0
      : activeIdx > prevIdxRef.current
      ? 1
      : -1;
  useEffect(() => {
    prevIdxRef.current = activeIdx;
  }, [activeIdx]);

  return (
    <section className="showcase-product-section">
      <h2 className="showcase-product-heading">Discover Our Scents</h2>

      <div
        className="showcase-product-container"
        ref={containerRef}
        style={{ ["--accent-primary"]: accent.primary, ["--accent-color"]: accent.accent }}
      >
        {/* CAROUSEL / SWIPE AREA */}
        <div
          className="swipe-deck-wrapper"
          {...swipeHandlers}
          aria-roledescription="carousel"
          aria-label="Product carousel"
        >
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.div
              key={product.id ?? product.name ?? activeIdx}
              className="carousel-card"
              variants={cardVariants}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
            >
              {/* Product visual: placeholder image or product.image */}
              <div
                className="product-visual"
                role="img"
                aria-label={product.name || "Product image"}
                style={{
                  backgroundImage: product.image ? `url(${product.image})` : undefined,
                }}
              >
                {!product.image && (
                  <div className="product-visual-fallback">
                    <div className="initial">{(product.name || "").slice(0, 1)}</div>
                  </div>
                )}
              </div>

              {/* subtle overlay for mood / accent */}
              <div
                className="visual-accent"
                style={{
                  background: `linear-gradient(180deg, ${accent.primary}08, transparent)`,
                }}
                aria-hidden
              />
            </motion.div>
          </AnimatePresence>

          {/* desktop nav arrows overlay */}
          <div className="deck-overlay-controls">
            <button
              className="overlay-nav prev"
              aria-label="Previous product"
              onClick={onPrev}
            >
              ‹
            </button>
            <button
              className="overlay-nav next"
              aria-label="Next product"
              onClick={onNext}
            >
              ›
            </button>
          </div>
        </div>

        {/* INFO PANEL */}
        <div className="showcase-card-info">
          <div className="info-top-row">
            <h3 className="product-name">{product.name || "Untitled"}</h3>
            <div
              className="accent-pill"
              style={{ borderColor: `${accent.accent}33`, color: accent.primary }}
            >
              {scent ? "Signature" : "Fragrance"}
            </div>
          </div>

          {scent && <p className="showcase-slogan">“{scent.slogan}”</p>}

          {/* personality badges (simple heuristics or from product.tags) */}
          <div className="badges-row" aria-hidden>
            {product.tags?.slice(0, 3)?.map((t, i) => (
              <Badge key={i} color={accent.primary}>
                {t}
              </Badge>
            ))}

            {/* fallback badges derived from notes */}
            {!product.tags &&
              displayNotes.slice(0, 3).map((n, i) => (
                <Badge key={i} color={accent.primary}>
                  {n.split(/\s+/)[0]}
                </Badge>
              ))}
          </div>

          {/* story teaser + reveal */}
          <div className="story-wrap">
            <p
              className={`showcase-story ${storyExpanded ? "expanded" : "clamped"}`}
              aria-expanded={storyExpanded}
              id="scent-story"
            >
              {storyExpanded ? storyText : teaser + (isLongStory ? "…" : "")}
            </p>

            {isLongStory && (
              <button
                className="read-more-btn"
                onClick={() => setStoryExpanded((s) => !s)}
                aria-expanded={storyExpanded}
                aria-controls="scent-story"
                style={{ color: accent.accent }}
              >
                {storyExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          {/* notes grid */}
          <div className="notes-grid" aria-hidden>
            {displayNotes.map((n, i) => (
              <div
                key={i}
                className="note-card"
                style={{
                  borderColor: `${accent.primary}20`,
                  boxShadow: `0 6px 18px ${accent.primary}08`,
                }}
              >
                <div className="note-emoji">{getNoteEmoji(n)}</div>
                <div className="note-body">
                  <div className="note-name">{n}</div>
                  <div className="note-kind">Note</div>
                </div>
              </div>
            ))}
          </div>

          {/* dots & simple nav for accessibility */}
          <div className="showcase-nav-controls">
            <div className="showcase-dots" role="tablist" aria-label="Select product">
              {products.map((_, i) => (
                <button
                  key={i}
                  className={`showcase-dot ${i === activeIdx ? "active" : ""}`}
                  onClick={() => goToIndex(i)}
                  aria-label={`Go to ${i + 1}`}
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
