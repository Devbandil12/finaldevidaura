import React, { useContext, useEffect, useRef, useState } from "react";
import { ProductContext } from "../contexts/productContext";
import { gsap } from "gsap";
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
  const containerRef = useRef(null);
  const autoplayRef = useRef(null);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? products.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    gsap.fromTo(
      cardRefs.current[currentIndex]?.querySelectorAll(".showcase-content > *"),
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.6,
        ease: "power2.out",
      }
    );
  }, [currentIndex]);

  useEffect(() => {
    const play = () => {
      autoplayRef.current = setInterval(nextCard, 5000);
    };
    const stop = () => clearInterval(autoplayRef.current);

    const el = containerRef.current;
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", play);

    play(); // Start autoplay

    return () => {
      stop();
      el.removeEventListener("mouseenter", stop);
      el.removeEventListener("mouseleave", play);
    };
  }, []);

  return (
    <section className="showcase-wrapper" ref={containerRef}>
      <div className="showcase-heading">Discover the Collection</div>
      <div className="showcase-carousel">
        {products.map((product, i) => {
          const isActive = i === currentIndex;
          const noteList = product.fragranceNotes?.split(",") || [];

          return (
            <div
              className={`showcase-card ${isActive ? "active" : ""}`}
              key={product.id}
              ref={(el) => (cardRefs.current[i] = el)}
            >
              <div className="showcase-image">
                <img src={product.img} alt={product.name} />
              </div>
              <div className="showcase-content">
                <h2 className="product-name">{product.name}</h2>

                {slogans[product.name] && (
                  <p className="slogan">“{slogans[product.name]}”</p>
                )}

                {stories[product.name] && (
                  <p className="story">{stories[product.name]}</p>
                )}

                <p className="description">{product.description}</p>

                <div className="notes-section">
                  {noteList.map((note, index) => (
                    <span className="note-pill" key={index}>
                      {note.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="carousel-controls">
        <button onClick={prevCard}>&larr;</button>
        <div className="carousel-dots">
          {products.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
        <button onClick={nextCard}>&rarr;</button>
      </div>
    </section>
  );
};

export default ProductSwipeShowcase;
