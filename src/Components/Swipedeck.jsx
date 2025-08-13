import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import "../style/SwipeDeck.css"; // adjust import path as needed

gsap.registerPlugin(Draggable);

/*
 Props:
  - items: [{ imageurl: string, name?: string, ... }, ...]
  - initialSide: 'right' | 'left'  (which queue starts populated)
  - backCount: number (how many peeking cards behind the top to render)
*/
export default function SwipeDeck({ items = [], initialSide = "right", backCount = 10 }) {
  const N = items.length;
  if (N === 0) return null;

  // give items stable IDs if not present
  const withIds = useMemo(
    () => items.map((it, i) => ({ ...it, __id: it.__id ?? `card-${i}` })),
    [items]
  );

  // Two queues: left and right. Put all initial cards on `initialSide`.
  const [leftQ, setLeftQ] = useState(initialSide === "left" ? [...withIds] : []);
  const [rightQ, setRightQ] = useState(initialSide === "right" ? [...withIds] : []);
  const [activeSide, setActiveSide] = useState(initialSide); // where back stack peeks from

  // Refs for DOM nodes and draggable
  const topRef = useRef(null);
  const backRefs = useRef([]); // DOM refs for back cards
  const dragInstance = useRef(null);

  // Convenience refs to use inside closures
  const leftRef = useRef(leftQ);
  const rightRef = useRef(rightQ);
  useEffect(() => { leftRef.current = leftQ; }, [leftQ]);
  useEffect(() => { rightRef.current = rightQ; }, [rightQ]);

  // Compute the front card: head of active queue. If active queue empty, flip active side if opp has cards.
  const activeQ = activeSide === "right" ? rightQ : leftQ;
  const oppQ = activeSide === "right" ? leftQ : rightQ;

  const [frontCard, setFrontCard] = useState(null);
  useEffect(() => {
    if (activeQ.length > 0) {
      setFrontCard(activeQ[0]);
    } else if (oppQ.length > 0) {
      // If active queue empty but opposite has cards, flip activeSide so we can continue.
      setActiveSide((s) => (s === "right" ? "left" : "right"));
    } else {
      setFrontCard(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide, leftQ.length, rightQ.length]);

  // Build backDeck: next items from active queue (after head), spilling over from opposite queue to fill backCount
  const backDeck = useMemo(() => {
    if (!frontCard) return [];
    const act = activeSide === "right" ? rightRef.current : leftRef.current;
    const opp = activeSide === "right" ? leftRef.current : rightRef.current;

    const nextFromActive = act.slice(1); // items after the front
    const need = Math.max(0, backCount - nextFromActive.length);
    const takeFromOpp = need > 0 ? opp.slice(0, need) : [];
    return [...nextFromActive, ...takeFromOpp].slice(0, backCount);
  }, [frontCard, activeSide, backCount, leftQ, rightQ]);

  // ---- visual layout helpers (tweak constants to fine-tune feel) ----
  const baseBackTransform = (i, progress = 0) => {
    // i = 0 is closest behind the top
    const sign = activeSide === "right" ? 1 : -1;
    const fanX = 14;   // horizontal fan px per card toward side
    const peekY = 12;  // upward peek px per card
    const tiltX = 10;  // rotateX degrees (top-edge tilt)
    const fanZ = 0.6;  // rotateZ degrees per depth
    const scaleDrop = 0.03;

    const baseX = sign * i * fanX;
    const baseY = -i * peekY;
    const baseScale = 1 - i * scaleDrop;
    const baseRz = sign * i * fanZ;

    // live drag influence
    const influence = (backCount - i) / backCount;
    const liftY = progress * 8 * influence;
    const shiftX = sign * progress * 6 * influence;
    const scaleAdd = progress * 0.05 * influence;

    return `translateX(${baseX + shiftX}px) translateY(${baseY + liftY}px) rotateZ(${baseRz}deg) rotateX(${tiltX}deg) scale(${baseScale + scaleAdd})`;
  };

  const layoutBackCards = (progress = 0) => {
    backRefs.current.forEach((node, i) => {
      if (!node) return;
      gsap.set(node, {
        transform: `perspective(1000px) ${baseBackTransform(i, progress)}`,
        zIndex: backDeck.length - i,
        opacity: 1 - Math.min(i * 0.05, 0.35),
      });
    });
    if (topRef.current) gsap.set(topRef.current, { zIndex: 999 });
  };

  // ---- Draggable lifecycle ----
  const killDrag = () => {
    if (dragInstance.current) {
      dragInstance.current.kill();
      dragInstance.current = null;
    }
  };

  const bindDrag = () => {
    if (!topRef.current || !frontCard) return;
    killDrag();

    dragInstance.current = Draggable.create(topRef.current, {
      type: "x,y",
      inertia: true,
      onDrag: function () {
        const rotation = this.x / 15;
        gsap.set(topRef.current, { rotation });
        const progress = Math.min(Math.abs(this.x) / 160, 1);
        layoutBackCards(progress);
      },
      onRelease: function () {
        const threshold = Math.min(window.innerWidth * 0.22, 180);
        if (this.x > threshold) {
          finishSwipe("right");
        } else if (this.x < -threshold) {
          finishSwipe("left");
        } else {
          gsap.to(topRef.current, {
            x: 0, y: 0, rotation: 0, duration: 0.28, ease: "power3.out",
            onUpdate: () => layoutBackCards(0),
            onComplete: () => layoutBackCards(0),
          });
        }
      },
    })[0];
  };

  useEffect(() => {
    bindDrag();
    return killDrag;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontCard && frontCard.__id, activeSide]);

  // Lay out back cards initially / when backDeck changes
  useLayoutEffect(() => {
    layoutBackCards(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backDeck.length, activeSide]);

  // ---- Move card between queues (no modulo) ----
  const finishSwipe = (dir) => {
    if (!topRef.current || !frontCard) return;
    const isRight = dir === "right";
    const sign = isRight ? 1 : -1;

    gsap.to(topRef.current, {
      x: sign * window.innerWidth * 0.55,
      y: -22,
      rotation: sign * 12,
      scale: 0.92,
      duration: 0.36,
      ease: "power3.in",
      onComplete: () => {
        const id = frontCard.__id;

        // Update queues in a safe, synchronous way:
        setLeftQ((Lprev) => {
          return setRightQ((Rprev) => {
            // Work on copies
            let L = [...Lprev];
            let R = [...Rprev];

            // Remove the front card from whichever queue holds it at head (should be active)
            if (activeSide === "right") {
              if (R.length > 0 && R[0].__id === id) R = R.slice(1);
            } else {
              if (L.length > 0 && L[0].__id === id) L = L.slice(1);
            }

            // Place the card to the tail of the side corresponding to swipe direction
            if (isRight) R = [...R, frontCard];
            else L = [...L, frontCard];

            // After moving, set active side = swipe direction
            setActiveSide(isRight ? "right" : "left");

            // Rebalance (pull from opposite queue head if needed to keep a nice back deck)
            const want = isRight ? R : L;
            const other = isRight ? L : R;
            const need = Math.max(0, backCount + 1 - want.length); // +1 includes top
            if (need > 0 && other.length > 0) {
              const move = other.splice(0, Math.min(need, other.length));
              if (isRight) R = [...R, ...move];
              else L = [...L, ...move];
            }

            // commit both states by returning them from setters
            // Note: we must return the left queue for the outer setter (setLeftQ)
            // and we've already called setRightQ inside closure by returning newR.
            // To do both reliably, we call setRightQ explicitly and return new left.
            // But since we're inside setLeftQ -> setRightQ nested, ensure right gets set.
            // We'll set right separately to avoid nested complexity: call outside.
            // However React state setter inside setter is tricky; simplify: update both after computing.
            // To simplify, we'll compute finalL, finalR here and then call setLeftQ/setRightQ below.
            // So instead of nested approach, we fallback to simpler route:
            return L; // placeholder; actual L/R update done outside below (we'll recompute)
          });
        });
        // Because nested setter approach above is messy, we recompute both queues clearly:
        setLeftQ((prevL) => {
          setRightQ((prevR) => {
            // Build fresh copies from current refs to be safe
            let L = [...leftRef.current];
            let R = [...rightRef.current];

            // Remove front card from active side head
            if (activeSide === "right") {
              if (R.length > 0 && R[0].__id === id) R = R.slice(1);
            } else {
              if (L.length > 0 && L[0].__id === id) L = L.slice(1);
            }

            // Append to tail of swipe side
            if (isRight) R = [...R, frontCard];
            else L = [...L, frontCard];

            // Rebalance: ensure want side has at least backCount+1 items if possible
            const want = isRight ? R : L;
            const other = isRight ? L : R;
            const need = Math.max(0, backCount + 1 - want.length);
            if (need > 0 && other.length > 0) {
              const move = other.splice(0, Math.min(need, other.length));
              if (isRight) R = [...R, ...move];
              else L = [...L, ...move];
            }

            // Final commit
            setActiveSide(isRight ? "right" : "left");
            // Set both states
            setLeftQ(L);
            setRightQ(R);
            // return for setLeftQ outer (ignored)
            return L;
          });
          // return for setLeftQ outer (ignored)
          return prevL;
        });

        // Reset top DOM element transform (it will become a back card on next render)
        gsap.set(topRef.current, { x: 0, y: 0, rotation: 0, scale: 1 });
        requestAnimationFrame(() => layoutBackCards(0));
      },
    });
  };

  // ---- Render ----
  return (
    <div className="swipe-deck-container">
      {/* Left pile (fan all cards in leftQ) */}
      <div className="discard-pile left">
        {leftQ.map((c, i) => {
          const rz = -6 + i * 0.6;
          const ty = -10 * i;
          const sx = -30 + i * 1.8;
          return (
            <div
              key={`L-${c.__id}-${i}`}
              className="pile-card"
              style={{
                transform: `perspective(1000px) translateX(${sx}%) translateY(${ty}px) rotateZ(${rz}deg) rotateX(10deg) scale(0.86)`,
                zIndex: i,
              }}
            >
              <img src={c.imageurl} alt={c.name || ""} className="swipe-card-image" />
            </div>
          );
        })}
      </div>

      {/* Back peeking stack from the active side (composed from activeQ then spill from opposite) */}
      <div className={`back-stack ${activeSide}`}>
        {backDeck.map((c, i) => (
          <div
            key={`B-${c.__id}-${i}`}
            ref={(el) => (backRefs.current[i] = el)}
            className="swipe-card back-card"
          >
            <img src={c.imageurl} alt={c.name || ""} className="swipe-card-image" />
          </div>
        ))}
      </div>

      {/* Top card (flat center, draggable) */}
      {frontCard && (
        <div className="swipe-card top-card" ref={topRef}>
          <img src={frontCard.imageurl} alt={frontCard.name || ""} className="swipe-card-image" />
        </div>
      )}

      {/* Right pile (fan all cards in rightQ) */}
      <div className="discard-pile right">
        {rightQ.map((c, i) => {
          const rz = 6 - i * 0.6;
          const ty = -10 * i;
          const sx = 30 - i * 1.8;
          return (
            <div
              key={`R-${c.__id}-${i}`}
              className="pile-card"
              style={{
                transform: `perspective(1000px) translateX(${sx}%) translateY(${ty}px) rotateZ(${rz}deg) rotateX(10deg) scale(0.86)`,
                zIndex: i,
              }}
            >
              <img src={c.imageurl} alt={c.name || ""} className="swipe-card-image" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
