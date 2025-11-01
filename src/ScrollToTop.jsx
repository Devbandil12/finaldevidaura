// src/ScrollToTop.jsx
import { useEffect, useRef } from "react"; 
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef(null); 

  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" }); 
    }
    
    prevPathnameRef.current = pathname;
  }, [pathname]); 

  return null;
};

export default ScrollToTop;
