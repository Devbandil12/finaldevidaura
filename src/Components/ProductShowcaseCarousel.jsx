import React, { useContext, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ProductContext } from "../contexts/productContext";
import "../style/ProductSwipeShowcase.css";

// Your custom mapping
const slogans = { /* same as before */ };
const stories = { /* same as before */ };

const ProductSwipeShowcase = () => {
  const { products } = useContext(ProductContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRefs = useRef([]);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);
  const autoplayRef = useRef(null);

  const nextCard = () =>
    setCurrentIndex((i) => (i + 1) % products.length);
  const prevCard = () =>
    setCurrentIndex((i) => (i === 0 ? products.length - 1 : i - 1));

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
            const name = product.name?.toUpperCase() || "";
            const notes = (product.fragranceNotes || "").split(",");

            return (
              <div
                key={product.id}
                className={`showcase-product-card ${isActive ? "active" : ""}`}
                ref={(el) => (cardRefs.current[i] = el)}
              >
                <img src={product.imageurl} alt={product.name} className="showcase-product-image" />
                <div className="showcase-card-info">
                  <h3>{product.name}</h3>
                  {slogans[name] && <p className="showcase-slogan">“{slogans[name]}”</p>}
                  {stories[name] && <p className="showcase-story">{stories[name]}</p>}
                  <p className="showcase-description">{product.description}</p>
                  <div className="showcase-notes-pills">
                    {notes.map((n, idx) => (
                      <span key={idx} className="note-pill">{n.trim()}</span>
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
