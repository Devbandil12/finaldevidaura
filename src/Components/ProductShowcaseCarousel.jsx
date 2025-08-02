import React, { useContext, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ProductContext } from "../contexts/productContext";
import "../style/ProductSwipeShowcase.css";

// Combined scent metadata
const scentDetails = {
  SHADOW: {
    slogan: "Where silence lingers longer than light.",
    story: `Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told.
    It begins with a crisp, cooling rush of peppermint and lavender, stirring curiosity. As it unfolds, earthy oakmoss and sensual sandalwood emerge, grounding the fragrance in sophistication. A warm finish of amber and musk cloaks the wearer like midnight silk.
    Best worn in evening hours, when the world slows and presence becomes power.`,
    notes: [
      "Peppermint", "Lavender Burst",
      "Oakmoss", "Geranium", "Sandalwood",
      "Amber", "Musk Facets"
    ]
  },
  SUNSET: {
    slogan: "Where golden light melts into longing.",
    story: `SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace. It opens with a vivid burst of saffron and grapefruit, laced with sage and bergamot, evoking the golden glow of dusk.
    The heart blooms with soft magnolia and jasmine, kissed by a hint of pepper — warm, intimate, alive. As it deepens, a rich foundation of oud and patchouli anchors the scent in sensual memory.
    Best worn at twilight, when the day exhales and romance begins to stir.`,
    notes: [
      "Saffron", "Sage", "Bergamot", "Grapefruit",
      "Magnolia", "Pepper", "Jasmine",
      "Oud", "Cedarwood", "Sandalwood", "Patchouli"
    ]
  },
  VIGOR: {
    slogan: "Where boldness breaks like sunrise.",
    story: `VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose. It opens in a blaze of grapefruit and pepper, charged with the cool clarity of violet leaves.
    At its core, clary sage and French lavender pulse with herbal strength, while a powerful base of amber wood and tonka grounds the composition in warmth and persistence.
    Designed for daylight hours, when ambition sharpens and confidence commands the room.`,
    notes: [
      "Grapefruit", "Violet Leaves", "Sichuan Pepper",
      "Clary Sage", "Geranium", "French Lavender",
      "Amber Wood", "Tonka Bean", "Cristal Moss"
    ]
  },
  "OUD HORIZON": {
    slogan: "Where tropics meet twilight — bold, bright, unforgettable.",
    story: `OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods. It begins with a burst of tropical exuberance: juicy mandarin, pineapple, and papaya, spiced gently by cardamom.
    A heart of sandalwood and amber follows, warm and magnetic, before settling into a complex tapestry of cedar, musk, and oud — refined, exotic, and lingering.
    Worn to make an impression, this scent is your signature when you want to arrive without speaking.`,
    notes: [
      "Mandarin Orange", "Papaya", "Bergamot", "Pineapple", "Cardamom",
      "Sandalwood", "Amber", "Musk", "Cedar", "Oakmoss",
      "Nutmeg", "Violet", "Orris Root", "Jasmine", "Lily-of-the-Valley"
    ]
  }
};

const ProductSwipeShowcase = () => {
  const { products } = useContext(ProductContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRefs = useRef([]);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);
  const autoplayRef = useRef(null);

  const nextCard = () => setCurrentIndex((i) => (i + 1) % products.length);
  const prevCard = () => setCurrentIndex((i) => (i === 0 ? products.length - 1 : i - 1));

  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) prevCard();
    else if (dx < -50) nextCard();
    touchStartX.current = null;
  };

  useEffect(() => {
    gsap.set(cardRefs.current, { zIndex: (_, i) => products.length - i });
    cardRefs.current.forEach((card, i) => {
      const offset = i - currentIndex;
      gsap.to(card, {
        x: offset * 20,
        scale: offset === 0 ? 1 : 0.95,
        rotation: offset * 1.2,
        opacity: offset < -2 || offset > 2 ? 0 : 1,
        duration: 0.4,
        ease: "power3.out",
      });
    });

    const contentEls = cardRefs.current[currentIndex]?.querySelectorAll(".showcase-card-info > *");
    gsap.fromTo(
      contentEls,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "power2.out" }
    );
  }, [currentIndex, products]);

  useEffect(() => {
    const start = () => (autoplayRef.current = setInterval(nextCard, 5000));
    const stop = () => clearInterval(autoplayRef.current);
    const el = containerRef.current;
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", start);
    start();
    return () => {
      stop();
      el.removeEventListener("mouseenter", stop);
      el.removeEventListener("mouseleave", start);
    };
  }, []);

  return (
    <section
      className="showcase-product-section"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h2 className="showcase-product-heading">Discover Our Scents</h2>
      <div className="showcase-product-container">
        <div className="showcase-card-stack">
          {products.map((product, i) => {
            const isActive = i === currentIndex;
  const normalize = (str) => str?.trim().toUpperCase();
  const scent = scentDetails[normalize(product.name)];

            
            return (
              <div
                key={product.id}
                className={`showcase-product-card ${isActive ? "active" : ""}`}
                ref={(el) => (cardRefs.current[i] = el)}
              >
                <img src={product.imageurl} alt={product.name} className="showcase-product-image" />
                <div className="showcase-card-info">
                  <h3>{product.name}</h3>
                  {scent ? (
                    <>
                      <p className="showcase-slogan">“{scent.slogan}”</p>
                      <p className="showcase-story">{scent.story}</p>
                      <div className="showcase-notes-pills">
                        {scent.notes.map((n, idx) => (
                          <span key={idx} className="note-pill">{n}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="showcase-description">{product.description}</p>
                      {product.fragranceNotes && (
                        <div className="showcase-notes-pills">
                          {product.fragranceNotes.split(",").map((note, idx) => (
                            <span key={idx} className="note-pill">{note.trim()}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="showcase-nav-controls">
          <button onClick={prevCard}>&larr;</button>
          <div className="showcase-dots">
            {products.map((_, i) => (
              <span
                key={i}
                className={`showcase-dot ${i === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
          <button onClick={nextCard}>&rarr;</button>
        </div>
      </div>
    </section>
  );
};

export default ProductSwipeShowcase;
