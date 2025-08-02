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
  const normalize = (str) => str?.trim().toUpperCase();

  const loopedProducts = [
    products[products.length - 1],
    ...products,
    products[0],
  ];

  const [currentIndex, setCurrentIndex] = useState(1);
  const sliderRef = useRef(null);
  const imageWidth = useRef(0);
  const touchStartX = useRef(0);

  const slideTo = (index, instant = false) => {
    if (!sliderRef.current) return;
    const distance = -index * imageWidth.current;
    gsap.to(sliderRef.current, {
      x: distance,
      duration: instant ? 0 : 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        if (index === 0) {
          setCurrentIndex(products.length);
          gsap.set(sliderRef.current, {
            x: -products.length * imageWidth.current
          });
        } else if (index === products.length + 1) {
          setCurrentIndex(1);
          gsap.set(sliderRef.current, {
            x: -imageWidth.current
          });
        }
      }
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (!sliderRef.current) return;
      const totalWidth = sliderRef.current.offsetWidth;
      imageWidth.current = totalWidth / loopedProducts.length;
      slideTo(currentIndex, true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [products.length]);

  useEffect(() => {
    slideTo(currentIndex);
  }, [currentIndex]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) setCurrentIndex((i) => i + 1);
    else if (dx > 50) setCurrentIndex((i) => i - 1);
  };

  const currentProduct = products[(currentIndex - 1 + products.length) % products.length];
  const scent = scentDetails[normalize(currentProduct.name)];

  return (
    <section className="showcase-product-section">
      <h2 className="showcase-product-heading">Discover Our Scents</h2>

      <div className="showcase-product-container">
        {/* IMAGE SLIDER */}
        <div
          className="showcase-image-wrapper"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="showcase-slider" ref={sliderRef}>
            {loopedProducts.map((p, i) => (
              <img
                key={i}
                src={p.imageurl}
                alt={p.name}
                className="showcase-slider-image"
              />
            ))}
          </div>
        </div>

        {/* TEXT */}
        <div className="showcase-card-info">
          <h3>{currentProduct.name}</h3>
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
              <p className="showcase-description">{currentProduct.description}</p>
              {currentProduct.fragranceNotes && (
                <div className="showcase-notes-pills">
                  {currentProduct.fragranceNotes.split(",").map((note, idx) => (
                    <span key={idx} className="note-pill">{note.trim()}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="showcase-nav-controls">
        <button onClick={() => setCurrentIndex((i) => i - 1)}>&larr;</button>
        <div className="showcase-dots">
          {products.map((_, i) => (
            <span
              key={i}
              className={`showcase-dot ${i === (currentIndex - 1 + products.length) % products.length ? 'active' : ''}`}
              onClick={() => setCurrentIndex(i + 1)}
            />
          ))}
        </div>
        <button onClick={() => setCurrentIndex((i) => i + 1)}>&rarr;</button>
      </div>
    </section>
  );
};

export default ProductSwipeShowcase;
