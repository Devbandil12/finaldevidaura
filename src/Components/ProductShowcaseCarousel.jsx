// src/components/ProductSwipeShowcase.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { ProductContext } from "../contexts/productContext";
import SwipeDeck from "./Swipedeck";
import "../style/ProductSwipeShowcase.css";

/* -------- scentDetails (use your original content) -------- */
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
/* --------------------------------------------------------- */

const normalize = (str) => str?.trim().toUpperCase();

/* -------- emoji mapping for notes (fuzzy matching) -------- */
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

export default function ProductSwipeShowcase() {
  const { products = [] } = useContext(ProductContext);
  const deckRef = useRef();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // story expand/collapse
  const [storyExpanded, setStoryExpanded] = useState(false);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // reset when active card changes
  useEffect(() => {
    setStoryExpanded(false);
  }, [activeIdx]);

  // ensure activeIdx stays in range when products change
  useEffect(() => {
    if (products.length && activeIdx >= products.length) setActiveIdx(0);
  }, [products, activeIdx]);

  if (!products || products.length === 0) {
    return (
      <section className="showcase-product-section">
        <h2 className="showcase-product-heading">Discover Our Scents</h2>
        <p>No products available.</p>
      </section>
    );
  }

  const product = products[activeIdx] || {};
  const scent = scentDetails[normalize(product.name)];
  const storyText = (scent && scent.story) || product.description || "";

  const SHOW_READ_MORE_THRESHOLD = 220; // characters; tweak for your font/container
  const isLongStory = storyText && storyText.length > SHOW_READ_MORE_THRESHOLD;

  return (
    <section className="showcase-product-section">
      <h2 className="showcase-product-heading">Discover Our Scents</h2>

      <div className="showcase-product-container">
        <div className="swipe-deck-wrapper">
          <SwipeDeck items={products} ref={deckRef} onChange={(idx) => setActiveIdx(idx)} />
        </div>

        <div className="showcase-card-info">
          <h3>{product.name}</h3>

          {scent ? (
            <>
              <p className="showcase-slogan">“{scent.slogan}”</p>

              <p
                id="scent-story"
                className={`showcase-story ${storyExpanded ? "expanded" : "clamped"}`}
                aria-expanded={storyExpanded}
                aria-controls="scent-story"
              >
                {storyText}
              </p>

              {isLongStory && (
                <button
                  className="read-more-btn"
                  onClick={() => setStoryExpanded((s) => !s)}
                  aria-expanded={storyExpanded}
                  aria-controls="scent-story"
                >
                  {storyExpanded ? "Show less" : "Read more"}
                </button>
              )}

              <div className="showcase-notes-pills">
                {scent.notes.map((n, i) => (
                  <span key={i} className="note-pill">
                    <span className="note-emoji" aria-hidden>
                      {getNoteEmoji(n)}
                    </span>
                    <span className="note-text">{n}</span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p
                id="scent-story"
                className={`showcase-story ${storyExpanded ? "expanded" : "clamped"}`}
                aria-expanded={storyExpanded}
                aria-controls="scent-story"
              >
                {storyText}
              </p>

              {isLongStory && (
                <button
                  className="read-more-btn"
                  onClick={() => setStoryExpanded((s) => !s)}
                  aria-expanded={storyExpanded}
                  aria-controls="scent-story"
                >
                  {storyExpanded ? "Show less" : "Read more"}
                </button>
              )}

              <div className="showcase-notes-pills">
                {(product.fragranceNotes || "")
                  .split(",")
                  .map((n) => n && n.trim())
                  .filter(Boolean)
                  .map((n, i) => (
                    <span key={i} className="note-pill">
                      <span className="note-emoji" aria-hidden>
                        {getNoteEmoji(n)}
                      </span>
                      <span className="note-text">{n}</span>
                    </span>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="showcase-nav-controls">
        {!isMobile && (
          <>
            <button
              className="nav-btn"
              aria-label="Previous"
              onClick={() => deckRef.current?.swipeRight?.()}
            >
              ←
            </button>

            <div className="showcase-dots" aria-hidden>
              {products.map((_, i) => (
                <button
                  key={i}
                  className={`showcase-dot ${i === activeIdx ? "active" : ""}`}
                  onClick={() => deckRef.current?.goToIndex?.(i)}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))}
            </div>

            <button
              className="nav-btn"
              aria-label="Next"
              onClick={() => deckRef.current?.swipeLeft?.()}
            >
              →
            </button>
          </>
        )}

        {isMobile && (
          <div className="mobile-dots" aria-hidden>
            {products.map((_, i) => (
              <span
                key={i}
                className={`showcase-dot ${i === activeIdx ? "active" : ""}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
