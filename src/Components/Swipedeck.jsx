// SkipperStyleSwipe.jsx
import React, { useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import "../style/SwipeDeck.css";

const SkipperStyleSwipe = ({ items = [], onChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction) => {
    const newIndex =
      direction === "left"
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length;
    setCurrentIndex(newIndex);
    if (onChange) onChange(newIndex);
  };

  return (
    <div className="skipper-wrapper">
      {items.map((item, i) => {
        const indexOffset = (i - currentIndex + items.length) % items.length;
        if (indexOffset > 2) return null; // show only 3 cards stacked

        const x = useMotionValue(0);
        const rotate = useTransform(x, [-200, 200], [-15, 15]);
        const scale = 1 - indexOffset * 0.05;
        const y = indexOffset * 10;

        return (
          <AnimatePresence key={i}>
            <motion.div
              className="skipper-card"
              style={{
                scale,
                y,
                zIndex: 100 - indexOffset,
              }}
              drag={indexOffset === 0 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(event, info) => {
                if (info.offset.x < -100) handleSwipe("left");
                else if (info.offset.x > 100) handleSwipe("right");
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.img
                src={item.imageurl}
                alt={item.name || "Swipe Card"}
                className="skipper-card-image"
                style={{ rotate, x }}
              />
            </motion.div>
          </AnimatePresence>
        );
      })}
    </div>
  );
};

export default SkipperStyleSwipe;
