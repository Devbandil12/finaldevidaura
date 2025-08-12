// src/components/SwipeDeck.jsx
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

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    swipeLeft: () => handleProgrammaticSwipe("left"),
    swipeRight: () => handleProgrammaticSwipe("right"),
    goToIndex: (i) => goToIndex(i),
  }));

  useEffect(() => {
    if (onChange) onChange(current);
  }, [current, onChange]);

  // helper to normalize index into [0..n-1]
  const mod = (n, m) => ((n % m) + m) % m;

  // Programmatic swipe (calls same animation as pointer-based)
  const handleProgrammaticSwipe = (dir) => {
    if (isAnimating.current || items.length <= 1) return;
    const card = cardRefs.current[current];
    if (!card) return;
    isAnimating.current = true;

    const isLeft = dir === "left";
    const endX = isLeft ? -window.innerWidth * 1.3 : window.innerWidth * 1.3;
    const nextIdx = mod(current + (isLeft ? 1 : -1), items.length);

    gsap.to(card, {
      x: endX,
      y: -40,
      rotation: isLeft ? -18 : 18,
      opacity: 0,
      duration: 0.45,
      ease: "power3.in",
      onComplete: () => {
        // reset the card visually and advance current
        gsap.set(card, { x: 0, y: 0, rotation: 0, opacity: 1 });
        setCurrent(nextIdx);
        isAnimating.current = false;
      },
    });
  };

  // Direct jump to an index with a subtle animation
  const goToIndex = (index) => {
    if (index === current || isAnimating.current || items.length <= 1) {
      // still call setCurrent so UI can snap if requested
      setCurrent(mod(index, items.length));
      return;
    }
    // Simple pleasant fade-out / fade-in transition of the whole stack
    isAnimating.current = true;
    const topCard = cardRefs.current[current];
    if (topCard) {
      gsap.to(topCard, {
        opacity: 0,
        scale: 0.96,
        duration: 0.25,
        onComplete: () => {
          setCurrent(mod(index, items.length));
          gsap.fromTo(topCard, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.25, onComplete: () => (isAnimating.current = false) });
        },
      });
    } else {
      setCurrent(mod(index, items.length));
      isAnimating.current = false;
    }
  };

  // pointer drag handling for the active/top card
  useEffect(() => {
    const card = cardRefs.current[current];
    if (!card) return;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    const onPointerDown = (e) => {
      if (isAnimating.current) return;
      dragging = true;
      pointerId = e.pointerId;
      card.setPointerCapture(pointerId);
      startX = e.clientX;
      startY = e.clientY;
      gsap.killTweensOf(card);
    };

    const onPointerMove = (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const rot = dx * 0.05;
      gsap.set(card, { x: dx, y: dy, rotation: rot });
    };

    const onPointerUp = (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;
      try { card.releasePointerCapture(pointerId); } catch (err) {}
      const dx = e.clientX - startX;
      const threshold = Math.max(120, window.innerWidth * 0.18);

      if (Math.abs(dx) > threshold) {
        // swipe it off
        isAnimating.current = true;
        const isLeft = dx < 0;
        const endX = isLeft ? -window.innerWidth * 1.3 : window.innerWidth * 1.3;
        const nextIdx = mod(current + (isLeft ? 1 : -1), items.length);
        gsap.to(card, {
          x: endX,
          y: dyOrDefault(e, startY) - 40,
          rotation: isLeft ? -18 : 18,
          opacity: 0,
          duration: 0.4,
          ease: "power3.in",
          onComplete: () => {
            gsap.set(card, { x: 0, y: 0, rotation: 0, opacity: 1 });
            setCurrent(nextIdx);
            isAnimating.current = false;
          },
        });
      } else {
        // snap back
        gsap.to(card, { x: 0, y: 0, rotation: 0, duration: 0.35, ease: "elastic.out(1, .6)" });
      }
    };

    // helper to safe read dy from pointer event (some browsers)
    const dyOrDefault = (e, start) => {
      try { return e.clientY - start; } catch (err) { return -30; }
    };

    card.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      card.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [current, items.length]);

  // simplified swipe via touch start/end fallback for older browsers (keeps compatibility)
  const startX = useRef(0);
  const handleTouchStart = (e) => (startX.current = e.touches ? e.touches[0].clientX : 0);
  const handleTouchEnd = (e) => {
    const dx = (e.changedTouches ? e.changedTouches[0].clientX : 0) - startX.current;
    if (dx < -80) handleProgrammaticSwipe("left");
    else if (dx > 80) handleProgrammaticSwipe("right");
  };

  return (
    <div
      className="swipe-deck-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {items.map((item, i) => {
        // compute circular offset (so deck looks circular)
        const raw = i - current;
        const half = Math.floor(items.length / 2);
        let offset = raw;
        if (raw > half) offset = raw - items.length;
        if (raw < -half) offset = raw + items.length;

        const isTop = i === current;
        const absOffset = Math.abs(offset);

        const style = {
          zIndex: items.length - absOffset,
          transform: `scale(${1 - absOffset * 0.05}) translateY(${absOffset * 10}px) rotate(${offset * 2}deg)`,
          opacity: absOffset > 2 ? 0 : 1,
          pointerEvents: isTop ? "auto" : "none",
          transition: "transform 0.4s ease, opacity 0.4s ease",
        };

        return (
          <div
            key={i}
            className={`swipe-card ${isTop ? "active" : ""}`}
            ref={(el) => (cardRefs.current[i] = el)}
            style={style}
            aria-hidden={!isTop}
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
