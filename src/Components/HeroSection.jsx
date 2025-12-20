import React, { useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

// --- ASSETS (Matched to your uploaded files) ---
import bottleMain from "../assets/images/saphire-mist.webp";
import bottleLayer1 from "../assets/images/saphire-mist-2.webp";
import bottleLayer2 from "../assets/images/vigor.webp";

const Herosection = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // --- HANDLERS ---
  const handleScroll = useCallback((targetId) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [navigate]);

  // --- ANIMATION ENGINE ---
  useLayoutEffect(() => {
    // 1. Create a Context (Essential for React StrictMode & Cleanup)
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // 2. INITIAL SETUP (Performance Critical)
      // Hide everything initially using visibility:hidden (autoAlpha: 0)
      // This prevents the browser from trying to paint them before the animation starts.
      gsap.set([".brand-title", ".poetic-line", ".cta-container", ".bottle-group"], { 
        autoAlpha: 0 
      });

      // Force GPU acceleration specifically on the large images
      gsap.set([".bottle-main", ".bottle-layer-1", ".bottle-layer-2"], {
        force3D: true,
        backfaceVisibility: "hidden", 
        transformStyle: "preserve-3d", // Helps flat images render smoother
        willChange: "transform, opacity"
      });

      // 3. SHARED TIMELINE (Text & Header)
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          // Garbage Collection: Release GPU memory when animation is done
          gsap.set("*", { willChange: "auto" });
        }
      });

      // Header Text Reveal
      tl.to(".brand-title", {
        y: 0,
        autoAlpha: 1,
        duration: 1.2,
        stagger: 0.1,
        startAt: { y: -30 }
      });

      // Main Poetic Text Reveal
      tl.to(".poetic-line", {
        y: 0,
        autoAlpha: 1,
        duration: 1.2,
        stagger: 0.1,
        ease: "expo.out",
        startAt: { y: 60 }
      }, "-=0.8");

      // 4. DEVICE-SPECIFIC LOGIC
      mm.add({
        isDesktop: "(min-width: 800px)",
        isMobile: "(max-width: 799px)",
      }, (context) => {
        const { isMobile } = context.conditions;

        if (isMobile) {
          // ===============================================
          // MOBILE SEQUENCE: Text -> Button -> Images
          // STRATEGY: Zero Movement. Opacity Only.
          // ===============================================

          // A. Button appears first (User request)
          tl.to(".cta-container", {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            startAt: { y: 20 } // Small movement for button is okay
          }, "-=0.5");

          // B. Images Fade In (No Stagger)
          // We fade the *container* first to minimize repaints
          tl.to(".bottle-group", { autoAlpha: 1, duration: 0.1 }); 
          
          // Fade images in simultaneously.
          // Moving full rectangular photos on mobile causes lag, so we just fade them.
          tl.to([".bottle-main", ".bottle-layer-1", ".bottle-layer-2"], {
            autoAlpha: 1,
            duration: 1.5,
            ease: "sine.out"
          }, "-=0.2");

        } else {
          // ===============================================
          // DESKTOP SEQUENCE: Text -> Images -> Button
          // STRATEGY: Full VFX. Sliding, Scaling, Floating.
          // ===============================================

          // A. Images Entrance (Complex)
          tl.to(".bottle-group", { autoAlpha: 1, duration: 0.1 });
          
          // Main Bottle: Slide Up + Scale
          tl.to(".bottle-main", {
            scale: 1, autoAlpha: 1, y: 0, duration: 1.5, ease: "expo.out",
            startAt: { scale: 0.9, y: 50 }
          }, "-=1");

          // Side Layers: Slide Out + Rotate
          tl.to([".bottle-layer-1", ".bottle-layer-2"], {
            x: 0, autoAlpha: 1, 
            rotation: (i) => (i === 0 ? -10 : 10),
            duration: 1.8, ease: "expo.out",
            startAt: { x: (i) => (i === 0 ? -40 : 40), rotation: 0 }
          }, "<");

          // B. Expensive Filters (Desktop Only)
          tl.to(".bottle-main", { 
            filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.3))", 
            duration: 1 
          }, "-=1");

          // C. Button (Last on Desktop)
          tl.to(".cta-container", {
            autoAlpha: 1, y: 0, duration: 0.8,
            startAt: { y: 20 }
          }, "-=0.8");

          // D. Continuous Floating Loop (Desktop Only)
          gsap.to(".bottle-main", { y: -15, rotation: 1, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(".bottle-layer-1", { y: 20, rotation: -3, duration: 6, delay: 0.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(".bottle-layer-2", { y: -20, rotation: 3, duration: 7, delay: 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
        }
      });
    }, containerRef); // Scope to container

    return () => ctx.revert(); // Cleanup
  }, []);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col items-center pb-15">
      
      {/* --- STYLES --- */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Montserrat:wght@300;400;500&display=swap');`}
      </style>

      {/* --- HEADER --- */}
      <div className="w-full pt-16 pb-8 text-center relative">
        <h1 className="brand-title text-3xl lg:text-5xl tracking-[0.2em] font-bold text-black uppercase invisible" 
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Devid Aura
        </h1>
        <div className="flex items-center justify-center gap-4 mt-3 opacity-60">
          <span className="brand-title h-[1px] w-8 bg-black invisible"></span>
          <p className="brand-title text-[10px] tracking-[0.4em] text-black uppercase font-medium invisible">
            Is Itself an aura
          </p>
          <span className="brand-title h-[1px] w-8 bg-black invisible"></span>
        </div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-center relative pb-12">
        
        {/* SECTION 1: TEXT & CTA */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left mb-16 lg:mb-0 z-20">
          
          <h2 className="poetic-line text-xs lg:text-sm tracking-[0.4em] uppercase text-[#D4AF37] mb-6 font-bold border border-[#D4AF37]/30 px-4 py-2 rounded-full invisible">
            The Custom Atelier
          </h2>

          <div className="mb-8 space-y-2">
            <div className="overflow-hidden">
              <h1 className="poetic-line text-5xl lg:text-7xl text-black leading-[0.9] invisible" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Don't Wear
              </h1>
            </div>
            <div className="overflow-hidden">
              <h1 className="poetic-line text-5xl lg:text-7xl text-black leading-[0.9] invisible" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                A Scent.
              </h1>
            </div>
            <div className="overflow-hidden pt-2">
              <h1 className="poetic-line text-4xl lg:text-6xl text-gray-400 italic leading-[0.9] invisible" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Build A Legacy.
              </h1>
            </div>
          </div>

          <div className="overflow-hidden max-w-lg">
            <p className="poetic-line text-sm lg:text-base text-gray-600 font-medium leading-loose tracking-wide invisible" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Standard perfume is for the crowd. <br />
              Select your foundation, layer your heart notes, and crown it with an aura that belongs only to you.
            </p>
          </div>

          {/* CTA Button - Invisible initially, handled by GSAP */}
          <div className="cta-container mt-12 invisible">
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

        {/* SECTION 2: BOTTLE COMPOSITION */}
        <div className="w-full lg:w-1/2 relative h-[50vh] lg:h-[70vh] flex items-center justify-center">
          
          {/* 'bottle-group' is the container we use to toggle visibility efficiently */}
          <div className="relative w-full h-full flex items-center justify-center bottle-group invisible">
            
            {/* Desktop Only Blur (Very Expensive - Hidden on Mobile) */}
            <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gray-100 rounded-full blur-3xl -z-10"></div>
            
            {/* Layer 1 (Left) */}
            <img src={bottleLayer1} alt="Base Note" decoding="async"
              className="bottle-layer-1 invisible absolute left-[5%] lg:left-[10%] top-[25%] h-[55%] object-contain opacity-50 lg:opacity-60 lg:blur-[1px]"
              style={{ zIndex: 1 }}
            />

            {/* Layer 2 (Right) */}
            <img src={bottleLayer2} alt="Top Note" decoding="async"
              className="bottle-layer-2 invisible absolute right-[5%] lg:right-[10%] top-[15%] h-[50%] object-contain opacity-50 lg:opacity-60 lg:blur-[1px]"
              style={{ zIndex: 2 }}
            />

            {/* Main Bottle (Center) */}
            <img src={bottleMain} alt="The Signature" decoding="async"
              className="bottle-main invisible relative h-[85%] object-contain"
              style={{ zIndex: 3 }}
            />

            {/* Badge - Clean on Mobile, Blurred on Desktop */}
            <div className="bottle-main invisible absolute bottom-10 bg-white lg:bg-white/80 lg:backdrop-blur-sm border border-white px-6 py-2 rounded-full lg:shadow-sm">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-black">
                The Masterpiece
              </span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Herosection;