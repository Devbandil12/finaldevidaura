import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { gsap } from "gsap";
import "../style/SwipeDeck.css";

const SwipeDeck = forwardRef(({ items = [], onChange }, ref) => {
  const [current, setCurrent] = useState(0);
  const cardRefs = useRef([]);
  const isAnimating = useRef(false);

  // Expose controls to parent
  useImperativeHandle(ref, () => ({
    swipeLeft: () => handleSwipe("left"),
    swipeRight: () => handleSwipe("right"),
    goToIndex: (i) => jumpTo(i),
  }));

  useEffect(() => {
    if (onChange) onChange(current);
  }, [current]);

  const getRealIndex = (index) =>
    ((index % items.length) + items.length) % items.length;

  const handleSwipe = (dir) => {
    if (isAnimating.current || items.length <= 1) return;

    const isLeft = dir === "left";
    const nextIdx = getRealIndex(current + (isLeft ? 1 : -1));
    const card = cardRefs.current[current];

    if (!card) return;

    isAnimating.current = true;

    gsap.to(card, {
      x: isLeft ? -window.innerWidth * 1.2 : window.innerWidth * 1.2,
      y: -30,
      rotation: isLeft ? -15 : 15,
      duration: 0.45,
      ease: "power3.in",
      onComplete: () => {
        gsap.set(card, {
          x: 0,
          y: 0,
          rotation: 0,
        });
        setCurrent(nextIdx);
        isAnimating.current = false;
      },
    });
  };

  const jumpTo = (index) => {
    if (index === current || isAnimating.current) return;
    const direction = index > current ? "left" : "right";
    handleSwipe(direction);
    setTimeout(() => setCurrent(index), 450);
  };

  // Touch handling
  const startX = useRef(0);
  const handleTouchStart = (e) => (startX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -50) handleSwipe("left");
    else if (dx > 50) handleSwipe("right");
  };

  return (
    <div
      className="swipe-deck-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
     {items.map((item, i) => {
  const offset = (() => {
    let raw = i - current;
    if (raw > items.length / 2) return raw - items.length;
    if (raw < -items.length / 2) return raw + items.length;
    return raw;
  })();

  const isTop = i === current;

  const style = {
    zIndex: items.length - Math.abs(offset),
    transform: `scale(${1 - Math.abs(offset) * 0.05}) translateY(${Math.abs(offset) * 10}px) rotate(${offset * 2}deg)`,
    opacity: Math.abs(offset) > 2 ? 0 : 1,
    pointerEvents: isTop ? "auto" : "none",
    
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
        alt={item.name || "Fragrance Image"}
        className="swipe-card-image"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/placeholder.jpg";
        }}
      />
    </div>
  );
})}

    </div>
  );
});

export default SwipeDeck;
