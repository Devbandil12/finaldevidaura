import React from "react";
import { motion } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger"; // Import ScrollTrigger

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
      // ---------------------------------------------------------
      // THE FIX: Refresh GSAP exactly when the transition ends
      // ---------------------------------------------------------
      onAnimationComplete={(definition) => {
        // Only refresh when the 'in' animation finishes
        if (definition === "in") {
          ScrollTrigger.refresh();
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;