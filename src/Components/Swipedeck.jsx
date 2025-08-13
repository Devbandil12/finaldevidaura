import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import "../style/SwipeDeck.css";

gsap.registerPlugin(Draggable);

const SwipeDeck = forwardRef(({ items = [], onChange }, ref) => {
  const [current, setCurrent] = useState(0);
  const cardRefs = useRef([]);
  const isAnimating = useRef(false);

  // Duplicate deck for infinite feel
  const visibleCards = [...items, ...items];

  useImperativeHandle(ref, () => ({
    swipeLeft: () => flingCard("left"),
    swipeRight: () => flingCard("right"),
  }));

  useEffect(() => {
    if (onChange) onChange(current % items.length);
  }, [current]);

  useEffect(() => {
    if (cardRefs.current[current % visibleCards.length]) {
      makeDraggable(cardRefs.current[current % visibleCards.length]);
    }
  }, [current]);

  const flingCard = (dir) => {
    if (isAnimating.current) return;
    const card = cardRefs.current[current % visibleCards.length];
    if (!card) return;

    isAnimating.current = true;
    const isLeft = dir === "left";

    gsap.to(card, {
      x: isLeft ? -window.innerWidth * 0.4 : window.innerWidth * 0.4,
      y: -20,
      rotation: isLeft ? -10 : 10,
      scale: 0.9,
      duration: 0.45,
      ease: "power3.out",
      onComplete: () => {
        setCurrent((prev) => prev + 1);
        isAnimating.current = false;
      },
    });
  };

  const makeDraggable = (card) => {
    Draggable.create(card, {
      type: "x,y",
      inertia: true,
      onDrag: function () {
        // Rotate based on horizontal movement
        gsap.set(card, { rotation: this.x / 15 });
      },
      onRelease: function () {
        const threshold = window.innerWidth * 0.25;
        if (Math.abs(this.x) > threshold) {
          flingCard(this.x < 0 ? "left" : "right");
        } else {
          // Snap back
          gsap.to(card, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.3,
            ease: "power3.out",
          });
        }
      },
    });
  };

  return (
    <div className="swipe-deck-container">
      {visibleCards.map((item, i) => {
        const idx = i - current;
        const isTop = i === current;
        const depth = Math.min(Math.max(idx, 0), 3);

        const style = {
          zIndex: visibleCards.length - i,
          transform: isTop
            ? `translateY(0px) scale(1)`
            : `perspective(1000px) rotateX(${depth * 4}deg) translateY(${depth * -10}px) scale(${1 - depth * 0.05})`,
          opacity: idx > 3 ? 0 : 1,
          pointerEvents: isTop ? "auto" : "none",
          transition: isTop ? "none" : "transform 0.35s ease",
        };

        return (
          <div
            key={i}
            className={`swipe-card ${isTop ? "active" : ""}`}
            ref={(el) => (cardRefs.current[i] = el)}
            style={style}
          >
            <img
              src={item.imageurl}
              alt={item.name || "Card image"}
              className="swipe-card-image"
            />
          </div>
        );
      })}
    </div>
  );
});

export default SwipeDeck;
