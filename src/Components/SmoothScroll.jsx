// src/Components/SmoothScroll.jsx
import { useEffect, useLayoutEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocation, useNavigationType } from 'react-router-dom'; // 1. Import useNavigationType

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const location = useLocation();
  const navType = useNavigationType(); // 2. Get the navigation type (PUSH, POP, or REPLACE)

  useLayoutEffect(() => {
    // Keep this. It prevents the browser from fighting with Lenis.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      // 🟢 GOOD DECISION: smoothTouch: false
      // This forces mobile to use native scrolling. 
      // This is the #1 way to ensure your site is fast/smooth on mobile.
      smoothTouch: false, 
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  // 3. OPTIMIZED SCROLL RESET
  useEffect(() => {
    if (lenisRef.current) {
      // ONLY scroll to top if it's a new page visit (PUSH) or a fresh load.
      // If it's a "Back" button click (POP), let the browser handle the position (or stay where it is).
      if (navType !== 'POP') {
        lenisRef.current.scrollTo(0, { immediate: true });
      }
    }
  }, [location.pathname, navType]); // Add navType to dependencies

  return <div className="w-full min-h-screen">{children}</div>;
}