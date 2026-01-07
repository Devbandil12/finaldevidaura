// src/Components/SmoothScroll.jsx
import { useEffect, useLayoutEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocation } from 'react-router-dom';

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const location = useLocation();

  // 1. Disable browser's automatic scroll restoration so we can control it manually
  // This stops the "double jump" effect.
  useLayoutEffect(() => {
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

  // 2. THIS IS KEY: Reset scroll only on route change, via Lenis
  useEffect(() => {
    if (lenisRef.current) {
        // If it's NOT the first load (handled by browser), scroll to top
        // But since we set scrollRestoration to manual, we might actually WANT 
        // to force top on refresh IF you prefer that. 
        // However, to keep your position on refresh, we usually DON'T call this on mount.
        
        // This effect runs on location change.
        lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [location.pathname]);

  return <div className="w-full min-h-screen">{children}</div>;
}