import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import "../style/SwipeDeck.css";

gsap.registerPlugin(Draggable);

/**
 * Usage:
 * <SwipeDeck items={[{imageurl, name?}, ...]} initialSide="right" backCount={12} />
 *
 * Behavior (matches the video):
 * - Front card straight.
 * - Back cards peek from one side, tilted from top.
 * - Swipe left/right -> front card moves to that side's back pile.
 * - Back stack always looks "full" (duplicated feel) and reacts to drag.
 * - If you keep swiping in one direction and run out, cards transfer from the other pile.
 */
export default function SwipeDeck({
  items = [],
  initialSide = "right",
  backCount = 12, // how many peeking cards behind the top to show
}) {
  const N = items.length;
  if (!N) return null;

  // Index of the current "front" card within items
  const [current, setCurrent] = useState(0);

  // Which side the back stack is peeking from right now (affects layout fan direction)
  const [side, setSide] = useState(initialSide); // 'left' | 'right'

  // Piles for discarded cards (they still show peeking from top on their side)
  const [leftPile, setLeftPile] = useState([]);
  const [rightPile, setRightPile] = useState([]);

  // refs
  const topRef = useRef(null);        // DOM node for the active (front) card
  const backRefs = useRef([]);        // DOM nodes for peeking back cards
  const drag = useRef(null);          // GSAP draggable instance
  const wraps = useRef(0);            // track loops around the deck

  // Build a "double-feel" back deck: cards after current, then repeat from start (N*2 window)
  // This ensures a long, rich peeking stack just like the video.
  const backDeck = useMemo(() => {
    const out = [];
    const count = Math.min(backCount, N * 2); // duplicate-feel but bounded
    for (let i = 0; i < count; i++) {
      const idx = (current + 1 + i) % N;
      out.push({ ...items[idx], __k: `b-${current}-${i}-${idx}` });
    }
    return out;
  }, [items, N, current, backCount]);

  // ----------------------------
  // Layout & transforms
  // ----------------------------

  const baseBackTransform = (i, progress = 0) => {
    // i: index in backDeck (0 = closest behind top)
    // progress: 0..1 from live drag (how much to lift/shift back cards)
    const sign = side === "right" ? 1 : -1;

    // Tunable constants to match video feel
    const fanX = 14;   // px shift per card horizontally toward the side
    const peekY = 12;  // px upward peek per card (from top)
    const tiltX = 10;  // deg tilt from top edge
    const fanZ = 0.6;  // deg incremental fan (rotateZ)
    const scaleDrop = 0.03; // scale per depth

    // Base stacked pose
    const baseX = sign * i * fanX;
    const baseY = -i * peekY;
    const baseScale = 1 - i * scaleDrop;
    const baseRz = sign * i * fanZ;

    // Live lift as user drags
    const influence = (backCount - i) / backCount; // nearer ones move more
    const liftY = progress * 8 * influence;
    const shiftX = sign * progress * 6 * influence;
    const scaleAdd = progress * 0.05 * influence;
    const rx = tiltX; // constant tilt from top

    return `translateX(${baseX + shiftX}px) translateY(${baseY + liftY}px) rotateZ(${baseRz}deg) rotateX(${rx}deg) scale(${baseScale + scaleAdd})`;
  };

  const layoutBackCards = (progress = 0) => {
    backRefs.current.forEach((node, i) => {
      if (!node) return;
      gsap.set(node, {
        transform: `perspective(1000px) ${baseBackTransform(i, progress)}`,
        zIndex: 5 - i, // under the top card
        opacity: 1 - Math.min(i * 0.05, 0.35),
      });
    });
    if (topRef.current) gsap.set(topRef.current, { zIndex: 99 });
  };

  // ----------------------------
  // Drag handling
  // ----------------------------

  const killDrag = () => {
    if (drag.current) {
      drag.current.kill();
      drag.current = null;
    }
  };

  const initDrag = () => {
    if (!topRef.current) return;
    killDrag();

    drag.current = Draggable.create(topRef.current, {
      type: "x,y",
      inertia: true,
      onDrag: function () {
        // Tilt the top card based on horizontal drag
        gsap.set(topRef.current, { rotation: this.x / 15 });
        // Live animate the back stack
        const progress = Math.min(Math.abs(this.x) / 160, 1);
        layoutBackCards(progress);
      },
      onRelease: function () {
        const threshold = Math.min(window.innerWidth * 0.22, 180);
        if (this.x > threshold) {
          finalizeSwipe("right");
        } else if (this.x < -threshold) {
          finalizeSwipe("left");
        } else {
          // Snap back to center
          gsap.to(topRef.current, {
            x: 0, y: 0, rotation: 0, duration: 0.28, ease: "power3.out",
            onUpdate: () => layoutBackCards(0),
            onComplete: () => layoutBackCards(0),
          });
        }
      },
    })[0];
  };

  const finalizeSwipe = (dir) => {
    if (!topRef.current) return;
    const isRight = dir === "right";
    const sign = isRight ? 1 : -1;

    // Animate front card to its side pile, then actually move data into that pile
    gsap.to(topRef.current, {
      x: sign * window.innerWidth * 0.55,
      y: -24,
      rotation: sign * 12,
      scale: 0.92,
      duration: 0.38,
      ease: "power3.in",
      onComplete: () => {
        const cardData = items[current];

        if (isRight) {
          setRightPile((p) => [cardData, ...p].slice(0, 24));
        } else {
          setLeftPile((p) => [cardData, ...p].slice(0, 24));
        }

        // New back side is where we're moving toward
        setSide(isRight ? "right" : "left");

        // Advance deck (circular)
        setCurrent((prev) => {
          const next = (prev + 1) % N;
          if (next === 0) wraps.current += 1;

          // Re-balance: if we keep moving right, borrow from left when needed, and vice versa.
          if (isRight) {
            setLeftPile((lp) => {
              if (lp.length > 0 && rightPile.length < backCount) {
                const moved = lp[lp.length - 1];
                setRightPile((rp) => [moved, ...rp].slice(0, 24));
                return lp.slice(0, lp.length - 1);
              }
              return lp;
            });
          } else {
            setRightPile((rp) => {
              if (rp.length > 0 && leftPile.length < backCount) {
                const moved = rp[rp.length - 1];
                setLeftPile((lp) => [moved, ...lp].slice(0, 24));
                return rp.slice(0, rp.length - 1);
              }
              return rp;
            });
          }

          return next;
        });

        // Reset the DOM node so it can become a back card on the next render
        gsap.set(topRef.current, { x: 0, y: 0, rotation: 0, scale: 1 });
        // Relayout back cards now that the stack advanced
        requestAnimationFrame(() => layoutBackCards(0));
      },
    });
  };

  // ----------------------------
  // Effects
  // ----------------------------

  // Position back cards whenever stack/side changes
  useLayoutEffect(() => {
    layoutBackCards(0);
  }, [backDeck.length, side]);

  // Bind Draggable to the new top card each time "current" changes
  useEffect(() => {
    initDrag();
    return killDrag;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // ----------------------------
  // Render
  // ----------------------------

  return (
    <div className="swipe-deck-container">
      {/* Left pile (cards swiped left) */}
      <div className="discard-pile left">
        {leftPile.map((c, i) => {
          // Fan a bit, always peeking from top
          const rz = -6 + i * 0.6;
          const ty = -10 * i;
          const sx = -30 + i * 1.8;
          return (
            <div
              key={`L-${i}`}
              className="pile-card"
              style={{
                transform: `perspective(1000px) translateX(${sx}%) translateY(${ty}px) rotateZ(${rz}deg) rotateX(10deg) scale(0.86)`,
                zIndex: i,
              }}
            >
              <img src={c.imageurl} alt="" className="swipe-card-image" />
            </div>
          );
        })}
      </div>

      {/* Back peeking stack (built from items after current, duplicated feel) */}
      <div className={`back-stack ${side}`}>
        {backDeck.map((c, i) => (
          <div
            key={c.__k}
            ref={(el) => (backRefs.current[i] = el)}
            className="swipe-card back-card"
          >
            <img src={c.imageurl} alt="" className="swipe-card-image" />
          </div>
        ))}
      </div>

      {/* Top/front card (stays straight) */}
      <div className="swipe-card top-card" ref={topRef}>
        <img
          src={items[current].imageurl}
          alt={items[current].name || ""}
          className="swipe-card-image"
        />
      </div>

      {/* Right pile (cards swiped right) */}
      <div className="discard-pile right">
        {rightPile.map((c, i) => {
          const rz = 6 - i * 0.6;
          const ty = -10 * i;
          const sx = 30 - i * 1.8;
          return (
            <div
              key={`R-${i}`}
              className="pile-card"
              style={{
                transform: `perspective(1000px) translateX(${sx}%) translateY(${ty}px) rotateZ(${rz}deg) rotateX(10deg) scale(0.86)`,
                zIndex: i,
              }}
            >
              <img src={c.imageurl} alt="" className="swipe-card-image" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
