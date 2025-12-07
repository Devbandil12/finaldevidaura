import React, { useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

// NOTE: For the best effect, you need THREE DIFFERENT bottle images here. 
import bottleMain from "../assets/images/saphire-mist.webp";
import bottleLayer1 from "../assets/images/saphire-mist-2.webp";
import bottleLayer2 from "../assets/images/vigor.webp";

const Herosection = () => {
  const comp = useRef(null);
  const navigate = useNavigate();

  const handleScroll = useCallback((targetId) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [navigate]);

  useLayoutEffect(() => {
    // GSAP MatchMedia allows us to write different animation logic for Mobile vs Desktop
    let mm = gsap.matchMedia();

    // Context for cleanup
    let ctx = gsap.context(() => {
      
      // Setup elements with will-change to inform browser of upcoming heavy lifting
      gsap.set([".brand-title", ".poetic-line", ".bottle-main", ".bottle-layer-1", ".bottle-layer-2", ".cta-container"], {
        willChange: "transform, opacity",
        force3D: true, 
        backfaceVisibility: "hidden" // Prevents flickering on some mobile browsers
      });

      // --- SHARED TIMELINE (Mobile & Desktop) ---
      const tl = gsap.timeline({ 
        defaults: { ease: "power3.out" },
        // Clear will-change after entrance to save memory, 
        // but re-apply it to floating elements below
        onComplete: () => {
           // Optional: Apply expensive filters ONLY after animation ends to prevent lag
           gsap.to(".bottle-main", { filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.3))", duration: 1 });
        }
      });

      // 1. Brand Reveal
      tl.from(".brand-title", { y: -30, opacity: 0, duration: 1.2, stagger: 0.1 });

      // 2. Text Reveal
      tl.from(".poetic-line", {
        y: 60, // Reduced distance for mobile smoothness
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: "expo.out"
      }, "-=0.8");

      // --- DEVICE SPECIFIC LOGIC ---
      
      mm.add({
        // DESKTOP: Full Complex Animation
        isDesktop: "(min-width: 800px)",
        // MOBILE: Simplified Animation
        isMobile: "(max-width: 799px)",
      }, (context) => {
        let { isMobile } = context.conditions;

        // 3. The Combo Composition Reveal
        tl.from(".bottle-main", {
          scale: 0.9,
          opacity: 0,
          y: 50,
          duration: 1.5,
          ease: "expo.out"
        }, "-=1");

        // Supporting bottles
        tl.from([".bottle-layer-1", ".bottle-layer-2"], {
          x: (index) => index === 0 ? -40 : 40, // Reduced travel distance for mobile
          opacity: 0,
          // On mobile, avoid rotation during entrance to save GPU calculation
          rotation: isMobile ? 0 : ((index) => index === 0 ? -10 : 10), 
          duration: 1.8,
          ease: "expo.out"
        }, "<");

        // 4. CTA Reveal
        tl.from(".cta-container", { opacity: 0, y: 20, duration: 0.8 }, "-=0.8");

        // --- CONTINUOUS FLOATING AMBIANCE ---
        // We use slightly slower, simpler movements on mobile
        
        gsap.to(".bottle-main", {
          y: isMobile ? -8 : -15, // Less movement on mobile
          rotation: isMobile ? 0.5 : 1, // subtle rotation
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(".bottle-layer-1", {
          y: isMobile ? 10 : 20,
          rotation: isMobile ? 0 : -3, // No rotation on mobile side bottles
          duration: 6,
          delay: 0.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(".bottle-layer-2", {
          y: isMobile ? -10 : -20,
          rotation: isMobile ? 0 : 3,
          duration: 7,
          delay: 0.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

    }, comp);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={comp} className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col items-center">

      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Montserrat:wght@300;400;500&display=swap');
      </style>

      {/* --- BRANDING HEADER --- */}
      <div className="w-full pt-16 pb-8 text-center relative ">
        <h1 className="brand-title text-3xl lg:text-5xl tracking-[0.2em] font-bold text-black uppercase" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Devid Aura
        </h1>
        <div className="flex items-center justify-center gap-4 mt-3 opacity-60">
          <span className="brand-title h-[1px] w-8 bg-black"></span>
          <p className="brand-title text-[10px] tracking-[0.4em] text-black uppercase font-medium">is himself a aura</p>
          <span className="brand-title h-[1px] w-8 bg-black"></span>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-center relative pb-12">

        {/* LEFT: POETIC CONTENT & VALUE PROP */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left mb-16 lg:mb-0 z-20">

          <h2 className="poetic-line text-xs lg:text-sm tracking-[0.4em] uppercase text-[#D4AF37] mb-6 font-bold border border-[#D4AF37]/30 px-4 py-2 rounded-full">
            The Custom Atelier
          </h2>

          <div className="mb-8 space-y-2">
            <div className="overflow-hidden">
              <h1 className="poetic-line text-5xl lg:text-7xl text-black leading-[0.9]" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Don't Wear
              </h1>
            </div>
            <div className="overflow-hidden">
              <h1 className="poetic-line text-5xl lg:text-7xl text-black leading-[0.9]" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                A Scent.
              </h1>
            </div>
            <div className="overflow-hidden pt-2">
              <h1 className="poetic-line text-4xl lg:text-6xl text-gray-400 italic leading-[0.9]" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Build A Legacy.
              </h1>
            </div>
          </div>

          <div className="overflow-hidden max-w-lg">
            <p className="poetic-line text-sm lg:text-base text-gray-600 font-medium leading-loose tracking-wide" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Standard perfume is for the crowd. <br />
              Select your foundation, layer your heart notes, and crown it with an aura that belongs only to you.
            </p>
          </div>

          {/* CTA BUTTON */}
          <div className="cta-container mt-12">
            <button
              onClick={() => handleScroll("custom-combo-section")}
              className="group relative px-12 py-5 bg-transparent border border-black overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-[#1A1C20] translate-y-[101%] group-hover:translate-y-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
              <div className="relative z-10 flex items-center gap-3">
                <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#1A1C20] group-hover:text-white transition-colors duration-500 delay-75">
                  Construct Your Signature
                </span>
                <span className="text-[#1A1C20] group-hover:text-[#D4AF37] transition-colors duration-500 delay-75">
                  →
                </span>
              </div>
            </button>
          </div>

        </div>

        {/* RIGHT: THE COMBO VISUAL */}
        <div className="w-full lg:w-1/2 relative h-[50vh] lg:h-[70vh] flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">

            {/* Static background blur (Much faster than CSS filter blur on images) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gray-100 rounded-full blur-3xl -z-10"></div>

            {/* Layer 1 (Back Left) */}
            {/* OPTIMIZATION: Removed heavy filters (grayscale, blur) for mobile performance */}
            <img 
              src={bottleLayer1} 
              alt="Base Note"
              decoding="async" // Helps with main thread jank
              className="bottle-layer-1 absolute left-[5%] lg:left-[10%] top-[25%] h-[55%] object-contain opacity-50 lg:opacity-60 lg:blur-[1px] "
              style={{ zIndex: 1 }} 
            />

            {/* Layer 2 (Back Right) */}
            <img 
              src={bottleLayer2} 
              alt="Top Note"
              decoding="async"
              className="bottle-layer-2 absolute right-[5%] lg:right-[10%] top-[15%] h-[50%] object-contain opacity-50 lg:opacity-60 lg:blur-[1px] "
              style={{ zIndex: 2 }} 
            />

            {/* Main Bottle (Front Center) */}
            {/* OPTIMIZATION: Removed drop-shadow class, adding it via GSAP later */}
            <img 
              src={bottleMain} 
              alt="The Signature"
              decoding="async"
              className="bottle-main relative h-[85%] object-contain"
              style={{ zIndex: 3 }} 
            />

            {/* Interactive Label - Removed backdrop-blur for mobile smoothness */}
            <div className="bottle-main absolute bottom-10 bg-white/90 lg:bg-white/80 lg:backdrop-blur-sm border border-white px-6 py-2 shadow-sm rounded-full">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-black">The Masterpiece</span>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
};

export default Herosection;