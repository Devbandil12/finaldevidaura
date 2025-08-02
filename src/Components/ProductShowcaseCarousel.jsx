// src/Components/ProductSwipeShowcase.jsx
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ProductContext } from "../contexts/productContext";

import "../style/ProductSwipeShowcase.css"; // you’ll create this next

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
          scale: offset === 0 ? 1 : 0.9,
          rotation: offset * 1.5,
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
    <section className="swipe-showcase">
      <div className="swipe-container">
        <div className="card-stack">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="product-card"
              ref={(el) => (cardRefs.current[i] = el)}
            >
              <img src={product.image} alt={product.name} />
              <div className="card-info">
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <ul className="notes">
                  <li><strong>Top:</strong> {product.topNotes}</li>
                  <li><strong>Heart:</strong> {product.heartNotes}</li>
                  <li><strong>Base:</strong> {product.baseNotes}</li>
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="nav-controls">
          <button onClick={prevCard}>&larr;</button>
          <div className="dots">
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
      </div>
    </section>
  );
};

export default ProductSwipeShowcase;
