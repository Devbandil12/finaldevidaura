// src/Components/SmoothScroll.jsx
import { useEffect, useLayoutEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const location = useLocation();
  const navType = useNavigationType();

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
      // 🟢 ADD THIS BLOCK: Global Prevent Logic
      prevent: (node) => {
        return (
          node.nodeName === 'VERCEL-LIVE-FEEDBACK' ||
          node.id === 'the-id' ||
          // 1. Automatically ignore elements with these Tailwind classes
          node.classList?.contains('overflow-y-auto') ||
          node.classList?.contains('overflow-scroll') ||
          // 2. Check if any parent element has these classes (safe fallback)
          node.closest?.('.overflow-y-auto') ||
          node.closest?.('.overflow-scroll') ||
          // 3. Specifically ignore your Sidebar and Notification dropdowns
          node.closest?.('.sidebar') ||
          node.closest?.('.notification-list') ||
          node.closest?.('.react-datepicker') 
        );
      },
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

  useEffect(() => {
    if (lenisRef.current) {
      if (navType !== 'POP') {
        lenisRef.current.scrollTo(0, { immediate: true });
      }
    }
  }, [location.pathname, navType]);

  return <div className="w-full min-h-screen">{children}</div>;
}