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
  const stackSize = 4; // visible cards at once

  const visibleCards = [];
  for (let i = 0; i < stackSize; i++) {
    visibleCards.push(items[(currentIndex + i) % items.length]);
  }

  useEffect(() => {
    initDraggable();
  }, [currentIndex]);

  const initDraggable = () => {
    const topCard = cardRefs.current[0];
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
            ease: "power3.out"
          });
          animateBackCards(0);
        }
      }
    });
  };

  const animateBackCards = (dragX) => {
    for (let i = 1; i < stackSize; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      const progress = Math.min(Math.abs(dragX) / 150, 1);
      const scale = 1 - (i - 1) * 0.05 + progress * 0.05;
      const yOffset = -i * 10 + progress * 10;
      const tilt = i * 4 - progress * 4;
      gsap.to(card, {
        scale,
        y: yOffset,
        rotationX: tilt,
        duration: 0.2,
        ease: "power1.out"
      });
    }
  };

  const swipe = (dir) => {
    const topCard = cardRefs.current[0];
    if (!topCard) return;

    const isRight = dir === "right";
    gsap.to(topCard, {
      x: isRight ? window.innerWidth * 1 : -window.innerWidth * 1,
      y: -20,
      rotation: isRight ? 15 : -15,
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => {
        if (isRight) {
          setRightPile((p) => [visibleCards[0], ...p].slice(0, 3));
        } else {
          setLeftPile((p) => [visibleCards[0], ...p].slice(0, 3));
        }
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }
    });
  };

  return (
    <div className="swipe-deck-container">
      {/* Left discard pile */}
      <div className="discard-pile left">
        {leftPile.map((card, idx) => (
          <div key={idx} className="swipe-card left-pinned">
            <img src={card.imageurl} alt="" className="swipe-card-image" />
          </div>
        ))}
      </div>

      {/* Active stack */}
      <div className="active-stack">
        {visibleCards.map((item, i) => (
          <div
            key={i}
            ref={(el) => (cardRefs.current[i] = el)}
            className="swipe-card"
            style={{
              zIndex: stackSize - i,
              transform: `perspective(1000px) rotateX(${i * 4}deg) translateY(${
                -i * 10
              }px) scale(${1 - i * 0.05})`
            }}
          >
            <img src={item.imageurl} alt="" className="swipe-card-image" />
          </div>
        ))}
      </div>

      {/* Right discard pile */}
      <div className="discard-pile right">
        {rightPile.map((card, idx) => (
          <div key={idx} className="swipe-card right-pinned">
            <img src={card.imageurl} alt="" className="swipe-card-image" />
          </div>
        ))}
      </div>
    </div>
  );
}
