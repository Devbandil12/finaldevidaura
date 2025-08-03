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
  const [current, setCurrent] = useState(1); // start on real first
  const deck = useRef();
  const isAnimating = useRef(false);
  const transitionTime = 0.4;

  const extended = [items[items.length - 1], ...items, items[0]];

  useImperativeHandle(ref, () => ({
    swipeLeft: () => slideTo(current + 1),
    swipeRight: () => slideTo(current - 1),
    goToIndex: (i) => slideTo(i + 1),
  }));

  useEffect(() => {
    if (onChange) onChange(toRealIndex(current));
  }, [current]);

  const toRealIndex = (i) =>
    i === 0 ? items.length - 1 : i === items.length + 1 ? 0 : i - 1;

  const slideTo = (target) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    gsap.to(deck.current, {
      x: `-${target * 100}%`,
      duration: transitionTime,
      ease: "power3.inOut",
      onComplete: () => {
        let idx = target;
        if (target === 0) idx = items.length;
        if (target === items.length + 1) idx = 1;
        setCurrent(idx);
        gsap.set(deck.current, { x: `-${idx * 100}%`, clearProps: "transition" });
        isAnimating.current = false;
      },
    });
  };

  // Touch swipe support
  const startX = useRef(0);
  const handleTouchStart = (e) => (startX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -50) slideTo(current + 1);
    else if (dx > 50) slideTo(current - 1);
  };

  return (
    <div
      className="swipe-deck-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="swipe-deck"
        ref={deck}
        style={{ x: `-${current * 100}%` }}
      >
        {extended.map((item, idx) => (
          <div className="swipe-card" key={idx}>
            <img
              src={item.imageurl}
              alt={item.name || "Product Image"}
              className="swipe-card-image"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder.jpg";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default SwipeDeck;
