import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import "../style/SwipeDeck.css";

export default function SwipeDeck({ cards = [] }) {
  const [index, setIndex] = useState(0);
  const deckRef = useRef(null);

  const modIndex = (n) => ((n % cards.length) + cards.length) % cards.length;

  const handleSwipe = (dir) => {
    if (dir === "left") {
      setIndex((prev) => modIndex(prev + 1));
    } else {
      setIndex((prev) => modIndex(prev - 1));
    }
  };

  return (
    <div className="swipe-deck-container">
      <AnimatePresence>
        {[ -1, 0, 1 ].map((offset) => {
          const cardIndex = modIndex(index + offset);
          const isCenter = offset === 0;
          const zIndex = isCenter ? 3 : offset === -1 ? 2 : 1;

          return (
            <motion.div
              key={cardIndex}
              className={`swipe-card ${isCenter ? "center" : offset === -1 ? "left" : "right"}`}
              drag={isCenter ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -100 || velocity.x < -500) {
                  handleSwipe("left");
                } else if (offset.x > 100 || velocity.x > 500) {
                  handleSwipe("right");
                }
              }}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{
                opacity: 1,
                scale: isCenter ? 1 : 0.9,
                y: isCenter ? 0 : 30,
                boxShadow: isCenter
                  ? "0 15px 30px rgba(0,0,0,0.3)"
                  : "0 5px 15px rgba(0,0,0,0.15)",
                filter: isCenter ? "blur(0px)" : "blur(1px)",
                zIndex
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
            >
              <img src={cards[cardIndex].img} alt={cards[cardIndex].title} />
              <div className="card-info">
                <h3>{cards[cardIndex].title}</h3>
                <p>{cards[cardIndex].price}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
