import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useMotionValue } from "framer-motion";
import { gsap } from "gsap";
import "./SwipeDeck.css";

/**
 * Props:
 * - items: array of { id?, imageurl, name? } (id optional but recommended)
 * - visibleCount: how many cards are visible in the stack (default 3)
 * - onChange: callback(index) when top index changes
 *
 * Exposes via ref:
 * - swipeLeft()
 * - swipeRight()
 * - goToIndex(i)
 */
const SwipeDeck = forwardRef(
  ({ items = [], visibleCount = 3, onChange }, ref) => {
    // we keep a rotating index pointer to the 'top' item
    const [startIndex, setStartIndex] = useState(0);
    // active order is a shallow slice (we won't mutate original items)
    const itemCount = items.length;

    // used for programmatic control blocking while animating
    const animating = useRef(false);

    // cardRefs to animate underlying cards with GSAP
    const cardRefs = useRef([]);

    useImperativeHandle(ref, () => ({
      swipeLeft: () => swipe("left"),
      swipeRight: () => swipe("right"),
      goToIndex: (i) => goToIndex(i),
    }));

    // compute visible items: top card is at index startIndex
    const visible = useMemo(() => {
      if (!itemCount) return [];
      const out = [];
      for (let k = 0; k < Math.min(visibleCount, itemCount); k++) {
        const idx = ((startIndex + k) % itemCount + itemCount) % itemCount;
        out.push({ ...items[idx], __origIndex: idx });
      }
      return out;
    }, [items, startIndex, visibleCount, itemCount]);

    useEffect(() => {
      onChange?.(startIndex);
    }, [startIndex, onChange]);

    // helper to advance pointer
    const advance = (dir = "left") => {
      if (dir === "left") {
        setStartIndex((s) => (s + 1) % Math.max(itemCount, 1));
      } else {
        setStartIndex((s) => (s - 1 + itemCount) % Math.max(itemCount, 1));
      }
    };

    // programmatic go to index - will compute shortest rotation
    const goToIndex = (target) => {
      if (animating.current || itemCount === 0) return;
      target = ((target % itemCount) + itemCount) % itemCount;
      if (target === startIndex) return;
      // compute distance forward/backward
      const forwardDist = (target - startIndex + itemCount) % itemCount;
      const backwardDist = (startIndex - target + itemCount) % itemCount;
      // perform multiple advances with small animation (quick)
      animating.current = true;
      const steps = forwardDist <= backwardDist ? forwardDist : -backwardDist;
      const stepCount = Math.abs(steps);
      const dir = steps > 0 ? "left" : "right";

      // animate quickly by using GSAP timeline to nudge cards visually,
      // but we'll simply update startIndex after a short stagger
      let i = 0;
      const tick = () => {
        if (i >= stepCount) {
          animating.current = false;
          return;
        }
        advance(dir);
        i++;
        setTimeout(tick, 140); // small stagger
      };
      tick();
    };

    // main swipe function used by programmatic controls
    const swipe = (dir = "left") => {
      if (animating.current || itemCount === 0) return;
      animating.current = true;

      // animate top card offscreen via GSAP then advance pointer
      const topCard = cardRefs.current[0];
      if (!topCard) {
        advance(dir); // fallback
        animating.current = false;
        return;
      }

      const offX = dir === "left" ? -window.innerWidth * 1.4 : window.innerWidth * 1.4;
      const rotate = dir === "left" ? -18 : 18;

      gsap.to(topCard, {
        x: offX,
        rotation: rotate,
        y: -30,
        duration: 0.45,
        ease: "power3.in",
        onComplete: () => {
          // reset transform quickly (invisible) then advance pointer and clear inline styles
          gsap.set(topCard, { clearProps: "transform" });
          advance(dir);
          animating.current = false;
        },
      });

      // animate underlying cards up a layer for depth
      for (let i = 1; i < cardRefs.current.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        gsap.to(el, {
          scale: 1 - (i - 1) * 0.04,
          y: (i - 1) * 8,
          duration: 0.36,
          ease: "power2.out",
        });
      }
    };

    // Handler when drag ends
    const handleDragEnd = (info, cardIdx) => {
      if (animating.current) return;
      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;
      const threshold = Math.max(120, window.innerWidth * 0.14);
      const shouldSwipe =
        Math.abs(offsetX) > threshold || Math.abs(velocityX) > 800;

      if (!shouldSwipe) {
        // nothing — framer-motion will spring back automatically
        return;
      }
      const dir = offsetX < 0 ? "left" : "right";
      // perform the same offscreen animation used by programmatic swipe
      const topCard = cardRefs.current[0];
      if (!topCard) return;
      animating.current = true;
      const offX = dir === "left" ? -window.innerWidth * 1.4 : window.innerWidth * 1.4;
      const rotate = dir === "left" ? -18 : 18;

      // use GSAP to animate offscreen with a nice ease that respects velocity
      gsap.to(topCard, {
        x: offX,
        rotation: rotate,
        y: -30,
        duration: 0.45,
        ease: "power3.in",
        onComplete: () => {
          gsap.set(topCard, { clearProps: "transform" });
          advance(dir);
          animating.current = false;
        },
      });

      // lift underlying cards visually
      for (let i = 1; i < cardRefs.current.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        gsap.to(el, {
          scale: 1 - (i - 1) * 0.04,
          y: (i - 1) * 8,
          duration: 0.36,
          ease: "power2.out",
        });
      }
    };

    // Render stack: top card is index 0 in visible array
    return (
      <div className="sd-deck-outer" role="region" aria-label="Swipe Deck">
        <div className="sd-deck-inner">
          {visible
            .slice(0)
            .reverse() // render bottom first so top is last in DOM, but we want refs in top-first order; we'll manage refs accordingly
            .map((item, revIdx) => {
              const stackIdx = visible.length - 1 - revIdx; // 0 = top
              const z = 1000 - stackIdx;
              const scale = 1 - stackIdx * 0.04;
              const yOffset = stackIdx * 10;
              const rot = stackIdx * 2; // slight rotation for layered look

              // For refs: we want cardRefs.current[0] to be the top DOM element.
              // Because we've reversed rendering, top is last rendered; we'll set refs after render in effect.
              return (
                <CardItem
                  key={item.id ?? item.__origIndex}
                  item={item}
                  stackIdx={stackIdx}
                  zIndex={z}
                  scale={scale}
                  yOffset={yOffset}
                  rot={rot}
                  onDragEnd={handleDragEnd}
                  cardRefs={cardRefs}
                />
              );
            })}
        </div>

        {/* simple controls for debug / accessibility */}
        <div className="sd-controls" aria-hidden>
          <button
            onClick={() => swipe("right")}
            className="sd-control sd-control-left"
            title="Previous"
          >
            ←
          </button>
          <button
            onClick={() => swipe("left")}
            className="sd-control sd-control-right"
            title="Next"
          >
            →
          </button>
        </div>
      </div>
    );
  }
);

export default SwipeDeck;

/* ----- CardItem component ----- */
function CardItem({ item, stackIdx, zIndex, scale, yOffset, rot, onDragEnd, cardRefs }) {
  // we want only the top card to be draggable. top = stackIdx === 0
  const isTop = stackIdx === 0;
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const ref = useRef(null);

  // register ref in cardRefs: ensure top is index 0
  useEffect(() => {
    // place elements in array such that index 0 is top
    // cardRefs.current[stackIdx] = ref.current would put top at 0 when stackIdx===0
    cardRefs.current[stackIdx] = ref.current;
    // cleanup on unmount
    return () => {
      // remove by reference
      cardRefs.current = cardRefs.current.filter((r) => r !== ref.current);
    };
  }, [stackIdx, cardRefs]);

  // framer motion drag constraints: we don't want axis restriction; but dragElastic helps bounce
  return (
    <motion.div
      ref={ref}
      className="sd-card"
      style={{
        zIndex,
        scale,
        translateY: yOffset,
        rotate: rot,
        x,
        y,
        boxShadow: isTop ? "0 22px 60px rgba(0,0,0,0.22)" : "0 10px 30px rgba(0,0,0,0.12)",
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.12}
      dragSnapToOrigin={false}
      whileTap={isTop ? { scale: 0.985, rotate: 0 } : {}}
      onDragEnd={(e, info) => {
        if (!isTop) return;
        onDragEnd(info, stackIdx);
      }}
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale, y: yOffset }}
      transition={{ type: "spring", stiffness: 450, damping: 40 }}
    >
      <img
        src={item.imageurl}
        alt={item.name ?? "card image"}
        className="sd-card-image"
        draggable={false}
        onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
      />
    </motion.div>
  );
}
