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
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  const normalize = (str) => str?.trim().toUpperCase();
  const product = products[currentIndex];
  const scent = scentDetails[normalize(product.name)];

  const animateImage = (direction, onComplete) => {
    const el = imageRef.current;
    if (!el) return;

    gsap.to(el, {
      x: direction * -window.innerWidth,
      opacity: 0,
      duration: 0.4,
      ease: "power2.inOut",
      onComplete: () => {
        onComplete?.();
        gsap.fromTo(
          el,
          { x: direction * window.innerWidth, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );
      }
    });
  };

  const goTo = (newIndex) => {
    if (newIndex === currentIndex) return;
    const direction = newIndex > currentIndex ? -1 : 1;
    animateImage(direction, () => setCurrentIndex(newIndex));
  };

  const nextCard = () => goTo((currentIndex + 1) % products.length);
  const prevCard = () => goTo((currentIndex - 1 + products.length) % products.length);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) nextCard();
    else if (dx > 50) prevCard();
  };

  useEffect(() => {
    const el = containerRef.current;
    el.addEventListener("touchstart", onTouchStart);
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [currentIndex]);

  return (
    <section className="showcase-product-section" ref={containerRef}>
      <h2 className="showcase-product-heading">Discover Our Scents</h2>

      <div className="showcase-product-container">
        <div className="showcase-product-card">
          <div className="showcase-image-container">
            <img
              ref={imageRef}
              src={product.imageurl}
              alt={product.name}
              className="showcase-product-image"
            />
          </div>

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

        <div className="showcase-nav-controls">
          <button onClick={prevCard}>&larr;</button>
          <div className="showcase-dots">
            {products.map((_, i) => (
              <span
                key={i}
                className={`showcase-dot ${i === currentIndex ? "active" : ""}`}
                onClick={() => goTo(i)}
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
