// src/ScrollToTop.jsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  // "flag" to remember if this is the first load
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 1. If this is the first load (refresh), ignore it.
    // This lets the browser keep you at the Testimonials/Footer.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; 
    }

    // 2. Only scroll to top if it's a REAL navigation (link click)
    // using 'instant' prevents fighting with animations
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" 
    });
    
  }, [pathname]);

  return null;
};

export default ScrollToTop;