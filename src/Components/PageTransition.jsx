import React from "react";
import { motion } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1,
  },
};

const pageTransition = {
  type: "tween",
  ease: "circOut",
  duration: 0.5,
};

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: "100%" }}
      onAnimationComplete={(definition) => {
        if (definition === "in") {
          // ⚠️ CRITICAL FIX FOR GSAP SCROLLTRIGGER
          // Framer Motion leaves a 'transform: none' or matrix style that 
          // creates a new stacking context, breaking 'position: fixed' inside.
          // We manually remove it after the animation ends.
          const element = document.querySelector(".page-transition-container");
          if (element) {
            element.style.transform = ""; 
          }
          ScrollTrigger.refresh();
        }
      }}
      className="page-transition-container" // Added class for selection
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;