// SwipeDeck.jsx
import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import "../style/SwipeDeck.css";

const SwipeDeck = forwardRef(({ items, onChange }, ref) => {
  const [stack, setStack] = useState(items);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRefs = useRef([]);

  useImperativeHandle(ref, () => ({
    swipeLeft: () => handleSwipe("left"),
    swipeRight: () => handleSwipe("right"),
    goToIndex: (index) => handleGoTo(index),
  }));

  useEffect(() => {
    if (onChange) onChange(currentIndex);
  }, [currentIndex]);

  const handleSwipe = (direction) => {
    if (currentIndex >= stack.length || currentIndex < 0) return;

    const card = cardRefs.current[currentIndex];
    if (!card) return;

    const xOffset = direction === "left" ? -window.innerWidth : window.innerWidth;

    gsap.to(card, {
      x: xOffset,
      rotation: direction === "left" ? -15 : 15,
      duration: 0.5,
      ease: "power3.in",
      onComplete: () => {
        const newIndex = direction === "left" ? currentIndex + 1 : currentIndex - 1;
        setCurrentIndex(Math.max(0, Math.min(newIndex, stack.length - 1)));
        gsap.set(card, { x: 0, rotation: 0 });
      },
    });
  };

  const handleGoTo = (index) => {
    if (index >= 0 && index < stack.length) {
      setCurrentIndex(index);
    }
  };

  const handleTouchStart = useRef(0);
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - handleTouchStart.current;
    if (dx < -50) handleSwipe("left");
    else if (dx > 50) handleSwipe("right");
  };

  return (
    <div className="swipe-deck" onTouchStart={(e) => handleTouchStart.current = e.touches[0].clientX} onTouchEnd={handleTouchEnd}>
      {stack.map((item, i) => (
        <div
          key={i}
          className="swipe-card"
          ref={el => cardRefs.current[i] = el}
          style={{ zIndex: stack.length - i, opacity: i < currentIndex ? 0 : 1 }}
        >
          <img src={item.imageurl} alt={item.name} />
        </div>
      ))}
    </div>
  );
});

export default SwipeDeck;
