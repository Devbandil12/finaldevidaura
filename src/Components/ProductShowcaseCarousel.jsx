import React, { useContext, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ProductContext } from "../contexts/productContext";
import "../style/ProductSwipeShowcase.css";

const slogans = {
  SHADOW: "Where silence lingers longer than light.",
  SUNSET: "Where golden light melts into longing.",
  VIGOR: "Where boldness breaks like sunrise.",
  "OUD HORIZON": "Where tropics meet twilight — bold, bright, unforgettable.",
};

const stories = {
  SHADOW:
    "Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told...",
  SUNSET:
    "SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace...",
  VIGOR:
    "VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose...",
  "OUD HORIZON":
    "OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods...",
};

const ProductSwipeShowcase = () => {
  const { products } = useContext(ProductContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRefs = useRef([]);

  useEffect(() => {
    gsap.set(cardRefs.current, { zIndex: (i) => products.length - i });

    const animateStack = () => {
      cardRefs.current.forEach((card, i) => {
        const offset = i - currentIndex;
        gsap.to(card, {
          x: offset * 20,
          scale: offset === 0 ? 1 : 0.95,
          rotation: offset * 1.2,
          duration: 0.4,
          ease: "power3.out",
          opacity: offset < -2 || offset > 2 ? 0 : 1,
          zIndex: products.length - Math.abs(offset),
        });
      });
    };

    animateStack();
  }, [currentIndex, products]);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? products.length - 1 : prev - 1
    );
  };

  return (
    <section className="showcase-product-section">
      <h2 className="showcase-product-heading">Discover Our Scents</h2>

      <div className="showcase-product-container">
        <div className="showcase-card-stack">
          {products.map((product, i) => {
            const notes = product.fragranceNotes?.split(",") || [];

            return (
              <div
                key={product.id}
                className="showcase-product-card"
                ref={(el) => (cardRefs.current[i] = el)}
              >
                <img
                  src={product.img}
                  alt={product.name}
                  className="showcase-product-image"
                />

                <div className="showcase-card-info">
                  <h3>{product.name}</h3>

                  {slogans[product.name] && (
                    <p className="showcase-slogan">“{slogans[product.name]}”</p>
                  )}

                  {stories[product.name] && (
                    <p className="showcase-story">{stories[product.name]}</p>
                  )}

                  <p className="showcase-description">{product.description}</p>

                  <div className="showcase-notes-pills">
                    {notes.map((note, idx) => (
                      <span key={idx} className="note-pill">
                        {note.trim()}
                      </span>
                    ))}
                  </div>
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
                className={`showcase-dot ${
                  i === currentIndex ? "active" : ""
                }`}
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
