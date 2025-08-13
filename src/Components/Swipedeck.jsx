import React, { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import "../style/SwipeDeck.css";

gsap.registerPlugin(Draggable);

export default function SwipeDeck({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leftPile, setLeftPile] = useState([]);
  const [rightPile, setRightPile] = useState([]);
  const cardRefs = useRef([]);

  const getOffset = (cardIndex) => {
    const total = items.length;
    let offset = cardIndex - currentIndex;
    if (offset < 0) offset += total;
    return offset;
  };

  // Bind draggable to the current top card
  useEffect(() => {
    const topCard = cardRefs.current[currentIndex];
    if (!topCard) return;

    Draggable.create(topCard, {
      type: "x,y",
      inertia: true,
      onDrag: function () {
        const rotation = this.x / 15;
        gsap.set(topCard, { rotation });
        animateBackCards(this.x);
      },
      onRelease: function () {
        const threshold = window.innerWidth * 0.25;
        if (this.x > threshold) {
          swipe("right");
        } else if (this.x < -threshold) {
          swipe("left");
        } else {
          gsap.to(topCard, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.3,
            ease: "power3.out",
          });
          animateBackCards(0);
        }
      },
    });
  }, [currentIndex]);

  const animateBackCards = (dragX) => {
    items.forEach((_, idx) => {
      const offset = getOffset(idx);
      if (offset === 0) return;
      const card = cardRefs.current[idx];
      if (!card) return;

      const progress = Math.min(Math.abs(dragX) / 150, 1);
      const scale = 1 - offset * 0.05 + (progress * 0.05) / offset;
      const yOffset = -offset * 10 + progress * (10 / offset);
      const tilt = offset * 4 - progress * (4 / offset);

      gsap.to(card, {
        scale,
        y: yOffset,
        rotationX: tilt,
        duration: 0.2,
        ease: "power1.out",
      });
    });
  };

  const swipe = (dir) => {
    const topCard = cardRefs.current[currentIndex];
    if (!topCard) return;

    const isRight = dir === "right";
    const cardData = items[currentIndex];

    gsap.to(topCard, {
      x: isRight ? window.innerWidth * 1.2 : -window.innerWidth * 1.2,
      y: -20,
      rotation: isRight ? 15 : -15,
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => {
        if (isRight) {
          setRightPile((p) => [cardData, ...p].slice(0, 3));
        } else {
          setLeftPile((p) => [cardData, ...p].slice(0, 3));
        }
        setCurrentIndex((prev) => (prev + 1) % items.length);
        gsap.set(topCard, { x: 0, y: 0, rotation: 0 });
      },
    });
  };

  return (
    <div className="swipe-deck-container">
      {/* Left discard pile */}
      <div className="discard-pile left">
        {leftPile.map((card, idx) => (
          <div key={`left-${idx}`} className="swipe-card left-pinned">
            <img src={card.imageurl} alt="" className="swipe-card-image" />
          </div>
        ))}
      </div>

      {/* Main stack */}
      {items.map((item, idx) => {
        const offset = getOffset(idx);
        const zIndex = items.length - offset;
        const scale = 1 - offset * 0.05;
        const yOffset = -offset * 10;
        const tilt = offset * 4;

        return (
          <div
            key={idx}
            ref={(el) => (cardRefs.current[idx] = el)}
            className="swipe-card"
            style={{
              zIndex,
              transform: `perspective(1000px) rotateX(${tilt}deg) translateY(${yOffset}px) scale(${scale})`,
            }}
          >
            <img src={item.imageurl} alt="" className="swipe-card-image" />
          </div>
        );
      })}

      {/* Right discard pile */}
      <div className="discard-pile right">
        {rightPile.map((card, idx) => (
          <div key={`right-${idx}`} className="swipe-card right-pinned">
            <img src={card.imageurl} alt="" className="swipe-card-image" />
          </div>
        ))}
      </div>
    </div>
  );
}
