import React, { useContext, useEffect, useRef, useState } from "react";
import { ProductContext } from "../contexts/productContext";
import SwipeDeck from "./Swipedeck";
import "../style/ProductSwipeShowcase.css";

const scentDetails = {
  SHADOW: {
    slogan: "Where silence lingers longer than light.",
    story: `Crafted for those who speak softly and leave echoes...`,
    notes: ["Peppermint", "Lavender Burst", "Oakmoss", "Geranium", "Sandalwood", "Amber", "Musk Facets"]
  },
  SUNSET: {
    slogan: "Where golden light melts into longing.",
    story: `SUNSET is the perfume of tender transitions...`,
    notes: ["Saffron", "Sage", "Bergamot", "Grapefruit", "Magnolia", "Pepper", "Jasmine", "Oud", "Cedarwood", "Patchouli"]
  },
  VIGOR: {
    slogan: "Where boldness breaks like sunrise.",
    story: `VIGOR is a surge of momentum...`,
    notes: ["Grapefruit", "Violet Leaves", "Sichuan Pepper", "Clary Sage", "Geranium", "French Lavender", "Amber Wood", "Tonka Bean", "Cristal Moss"]
  },
  "OUD HORIZON": {
    slogan: "Where tropics meet twilight — bold, bright, unforgettable.",
    story: `OUD HORIZON is an exploration in contrast...`,
    notes: ["Mandarin Orange", "Papaya", "Bergamot", "Pineapple", "Cardamom", "Sandalwood", "Amber", "Musk", "Cedar", "Oakmoss"]
  }
};

const normalize = (str) => str?.trim().toUpperCase();

export default function ProductSwipeShowcase() {
  const { products } = useContext(ProductContext);
  const deckRef = useRef();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const product = products[activeIdx] || {};
  const scent = scentDetails[normalize(product.name)];

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <section className="showcase-product-section">
      <h2 className="showcase-product-heading">Discover Our Scents</h2>

      <div className="showcase-product-container">
        <div className="swipe-deck-wrapper">
          <SwipeDeck
            items={products}
            ref={deckRef}
            onChange={setActiveIdx}
          />
        </div>

        <div className="showcase-card-info">
          <h3>{product.name}</h3>
          {scent ? (
            <>
              <p className="showcase-slogan">“{scent.slogan}”</p>
              <p className="showcase-story">{scent.story}</p>
              <div className="showcase-notes-pills">
                {scent.notes.map((n, i) => (
                  <span key={i} className="note-pill">{n}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="showcase-description">{product.description}</p>
              <div className="showcase-notes-pills">
                {(product.fragranceNotes || "").split(",").map((n, i) => (
                  <span key={i} className="note-pill">{n.trim()}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="showcase-nav-controls">
        {!isMobile && (
          <>
            <button onClick={() => deckRef.current.swipeRight()}>&larr;</button>
            <div className="showcase-dots">
              {products.map((_, i) => (
                <span
                  key={i}
                  className={`showcase-dot ${i === activeIdx ? "active" : ""}`}
                  onClick={() => deckRef.current.goToIndex(i)}
                />
              ))}
            </div>
            <button onClick={() => deckRef.current.swipeLeft()}>&rarr;</button>
          </>
        )}
        {isMobile && (
          <div className="showcase-dots">
            {products.map((_, i) => (
              <span
                key={i}
                className={`showcase-dot ${i === activeIdx ? "active" : ""}`}
                onClick={() => deckRef.current.goToIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
