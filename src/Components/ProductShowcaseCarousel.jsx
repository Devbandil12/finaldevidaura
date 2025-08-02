import React, { useContext, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ProductContext } from "../contexts/productContext";
import "../style/ProductSwipeShowcase.css";

// Scent metadata (same as yours)
const scentDetails = {
  SHADOW: {
    slogan: "Where silence lingers longer than light.",
    story: `Crafted for those who speak softly and leave echoes...`,
    notes: ["Peppermint", "Lavender Burst", "Oakmoss", "Geranium", "Sandalwood", "Amber", "Musk Facets"]
  },
  SUNSET: {
    slogan: "Where golden light melts into longing.",
    story: `SUNSET is the perfume of tender transitions...`,
    notes: ["Saffron", "Sage", "Bergamot", "Grapefruit", "Magnolia", "Pepper", "Jasmine", "Oud", "Cedarwood", "Sandalwood", "Patchouli"]
  },
  VIGOR: {
    slogan: "Where boldness breaks like sunrise.",
    story: `VIGOR is a surge of momentum...`,
    notes: ["Grapefruit", "Violet Leaves", "Sichuan Pepper", "Clary Sage", "Geranium", "French Lavender", "Amber Wood", "Tonka Bean", "Cristal Moss"]
  },
  "OUD HORIZON": {
    slogan: "Where tropics meet twilight — bold, bright, unforgettable.",
    story: `OUD HORIZON is an exploration in contrast...`,
    notes: ["Mandarin Orange", "Papaya", "Bergamot", "Pineapple", "Cardamom", "Sandalwood", "Amber", "Musk", "Cedar", "Oakmoss", "Nutmeg", "Violet", "Orris Root", "Jasmine", "Lily-of-the-Valley"]
  }
};

const ProductSwipeShowcase = () => {
  const { products } = useContext(ProductContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const imageRefs = useRef([]);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);
  const total = products.length;

  const nextCard = () => {
    if (!hasInteracted) setHasInteracted(true);
    setCurrentIndex((i) => (i + 1) % total);
  };

  const prevCard = () => {
    if (!hasInteracted) setHasInteracted(true);
    setCurrentIndex((i) => (i - 1 + total) % total);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) prevCard();
    else if (dx < -50) nextCard();
    touchStartX.current = null;
  };

  useEffect(() => {
    if (!hasInteracted) return;
    animateCurrent();
  }, [currentIndex, hasInteracted]);

  const animateCurrent = () => {
    const imageEl = imageRefs.current[currentIndex];
    const contentEls = containerRef.current.querySelectorAll(
      ".showcase-content-info > *"
    );

    gsap.fromTo(
      imageEl,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    gsap.fromTo(
      contentEls,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        delay: 0.2,
        duration: 0.6,
        ease: "power2.out"
      }
    );
  };

  const normalize = (str) => str?.trim().toUpperCase();
  const activeProduct = products[currentIndex];
  const activeScent = scentDetails[normalize(activeProduct.name)];

  return (
    <section
      className="showcase-product-section"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h2 className="showcase-product-heading">Discover Our Scents</h2>

      <div className="showcase-product-container">
        {/* 🖼️ Carousel with Peeking Right Card */}
        <div className="showcase-carousel">
          {products.map((product, i) => {
            const offset = i - currentIndex;
            const isActive = offset === 0;
            const isNext = offset === 1;

            if (!isActive && !isNext) return null;

            return (
              <div
                key={product.id}
                ref={(el) => (imageRefs.current[i] = el)}
                className={`carousel-card ${isActive ? "active" : "peek"}`}
              >
                <img src={product.imageurl} alt={product.name} loading="lazy" />
              </div>
            );
          })}
        </div>

        {/* 📄 Right Side Content */}
        <div className="showcase-content-info">
          <h3 className="product-title">{activeProduct.name}</h3>
          {activeScent ? (
            <>
              <blockquote className="product-slogan">“{activeScent.slogan}”</blockquote>
              <div className="product-story-box">
                <p className="product-story">{activeScent.story}</p>
              </div>
              <div className="showcase-notes-section">
                <h4 className="notes-heading">Fragrance Notes</h4>
                <div className="showcase-notes-pills">
                  {activeScent.notes.map((note, idx) => (
                    <span key={idx} className="note-pill">{note}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p>{activeProduct.description}</p>
          )}
        </div>
      </div>

      {/* ↔️ Navigation Controls */}
      <div className="showcase-nav-controls">
        <button onClick={prevCard}>&larr;</button>
        <div className="showcase-dots">
          {products.map((_, i) => (
            <span
              key={i}
              className={`showcase-dot ${i === currentIndex ? "active" : ""}`}
              onClick={() => {
                setHasInteracted(true);
                setCurrentIndex(i);
              }}
            />
          ))}
        </div>
        <button onClick={nextCard}>&rarr;</button>
      </div>
    </section>
  );
};

export default ProductSwipeShowcase;
