// src/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // We use "instant" behavior here because we are using Framer Motion
    // for page transitions.
    
    // If we used "smooth", the browser would try to scroll up slowly 
    // WHILE the page fade-in animation is happening, which looks 
    // jittery and unprofessional.
    
    // "Instant" snaps the new page to the top immediately, so the 
    // "Lift Up/Fade In" animation starts from the perfect position.
    window.scrollTo({ 
      top: 0, 
      left: 0, 
      behavior: "instant" 
    });
    
  }, [pathname]); // This effect only runs when 'pathname' changes

  return null;
};

export default ScrollToTop;