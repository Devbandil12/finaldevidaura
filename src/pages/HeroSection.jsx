import React, { useLayoutEffect, useRef, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowRight } from "lucide-react";

// DEFAULT ASSETS (Replace with your actual paths if needed)
import bottleMain from "../assets/images/SAPPHIRE-MIST.png";
import bottleLayer1 from "../assets/images/PERFUME-B0X.png";
import bottleLayer2 from "../assets/images/PERFUME-B0X.png";

const HeroSection = () => {
  // refs + nav
  const comp = useRef(null);
  const containerRef = useRef(null);
  const bottleRef = useRef(null);
  const layerBackRef = useRef(null);
  const layerMidRef = useRef(null);
  const navigate = useNavigate();

  // state
  const [activeBanner, setActiveBanner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

  // mouse state (normalized [-1,1])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Detect Mobile Device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // fetch banners
  useEffect(() => {
    let isCancelled = false;
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/cms/banners`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          const hero = data.find((b) => b.type === "hero" && b.isActive);
          if (hero) setActiveBanner(hero);
        }
      } catch (err) {
        console.error("Failed to load hero banner:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    fetchBanners();
    return () => { isCancelled = true; };
  }, [BACKEND_URL]);

  // mouse move -> normalized coords
  const handleMouseMove = (e) => {
    if (!containerRef.current || isMobile) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 2; // -1..1
    const y = ((e.clientY - top) / height - 0.5) * 2; // -1..1
    setMousePos({ x, y });
  };

  const displayData = {
    title: activeBanner?.title || "Essence of Light",
    subtitle: activeBanner?.subtitle || "The Radiant Collection",
    poeticLine: activeBanner?.poeticLine || "Where shadow fades and aura begins.",
    description: activeBanner?.description || "A symphony of crushed petals and sun-drenched amber. Designed not just to be worn, but to be felt.",
    buttonText: activeBanner?.buttonText || "Discover Your Scent",
    link: activeBanner?.link || "custom-combo-section",
    image: activeBanner?.imageUrl || bottleMain,
    layer1: activeBanner?.imageLayer1 || (!activeBanner ? bottleLayer1 : null),
    layer2: activeBanner?.imageLayer2 || (!activeBanner ? bottleLayer2 : null),
  };

  const handleLinkAction = useCallback(() => {
    const target = displayData.link;
    if (target.startsWith("http") || target.startsWith("/")) {
      if (target.startsWith("/")) navigate(target);
      else window.location.href = target;
    } else {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayData.link, navigate]);

  // GSAP initial intro, static tilt, & breathing
  useLayoutEffect(() => {
    if (isLoading) return;

    // Ensure we don't start animation logic until we know if it's mobile or not
    if (isMobile === null) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      gsap.set(".hero-text-reveal", { y: 60, opacity: 0 });
      gsap.set(".hero-image-container", { scale: 1.25, opacity: 0 });
      gsap.set(".bg-decoration", { scale: 0.8, opacity: 0 });

      // STATIC TILT for the bottle (Only on Desktop)
      // On mobile, we keep it straight (rotation 0)
      if (!isMobile) {
        gsap.set(bottleRef.current, {
          rotationZ: 6, // Tilt sideways slightly
          rotationY: -8, // Slight 3D turn
          transformPerspective: 1000,
          transformOrigin: "50% 50%"
        });
      }

      // Cinematic Sequence (Intro)
      tl.to(".bg-decoration", { scale: 1, opacity: 1, duration: 2 })
        .to(".hero-image-container", {
          scale: 1,
          opacity: 1,
          duration: 2.2,
          ease: "power2.out"
        }, "-=1.8")
        .to(".hero-text-reveal", {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 1.2
        }, "-=1.0");

      // --- MOBILE FIX: Conditional Animation ---
      // We only run the "Breathing" (floating up and down) on Desktop.
      // On mobile, it stays static.
      if (!isMobile) {
        gsap.to(bottleRef.current, {
          y: -12,
          duration: 4.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        // subtle rotation for background layers
        if (layerBackRef.current) gsap.to(layerBackRef.current, { rotation: 14, duration: 24, repeat: -1, yoyo: true, ease: "linear" });
        if (layerMidRef.current) gsap.to(layerMidRef.current, { rotation: -10, duration: 30, repeat: -1, yoyo: true, ease: "linear" });
      }

    }, comp);

    return () => ctx.revert();
  }, [isLoading, isMobile]);

  // Parallax only (No 3D tilt on mousemove)
  useEffect(() => {
    if (!comp.current) return;

    if (isMobile) {
      gsap.to([".parallax-layer-back", ".parallax-layer-mid", ".parallax-layer-front"], { x: 0, y: 0, duration: 0.5 });
      return;
    }

    // Background Layers Parallax
    gsap.to(".parallax-layer-back", { x: mousePos.x * -30, y: mousePos.y * -18, duration: 0.9, ease: "power2.out" });
    gsap.to(".parallax-layer-mid", { x: mousePos.x * -60, y: mousePos.y * -30, duration: 0.9, ease: "power2.out" });
    gsap.to(".parallax-layer-front", { x: mousePos.x * 24, y: mousePos.y * 14, duration: 0.9, ease: "power2.out" });

  }, [mousePos, isMobile]);

  if (isLoading) return <div className="h-screen w-full bg-[#F9F8F6]" />;

  return (
    <div
      ref={comp}
      className="relative w-full min-h-screen text-[#1a1a1a] overflow-hidden selection:bg-[#D4AF37] selection:text-white"
    >
      {/* BACKGROUND TYPOGRAPHY */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
        <h1 className="text-[20vw] font-serif font-bold tracking-tighter text-black whitespace-nowrap parallax-layer-back">
          DEVID AURA
        </h1>
      </div>

      <main
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative z-10 w-full max-w-[1800px] mx-auto min-h-screen flex flex-col lg:flex-row items-center px-6 lg:px-16 pt-24 lg:pt-0"
      >
        {/* LEFT: content */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center items-center lg:items-start text-center lg:text-left z-20 order-2 lg:order-1 mt-12 lg:mt-0">
          <div className="hero-text-reveal flex items-center gap-3 mb-6">
            <span className="h-[1px] w-12 bg-[#D4AF37]"></span>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#D4AF37]">
              {displayData.subtitle}
            </span>
          </div>

          <div className="overflow-hidden mb-2">
            <h1 className="hero-text-reveal text-5xl lg:text-7xl xl:text-8xl font-serif font-medium leading-[1.2] pb-2 text-gray-900">
              {displayData.title}
            </h1>
          </div>

          <div className="overflow-hidden mb-8">
            <p className="hero-text-reveal text-xl lg:text-2xl font-serif italic text-gray-400">
              {displayData.poeticLine}
            </p>
          </div>

          <div className="overflow-hidden max-w-md mb-10">
            <p className="hero-text-reveal text-sm lg:text-base text-gray-600 leading-relaxed font-light">
              {displayData.description}
            </p>
          </div>

          <div className="hero-text-reveal">
            <button
              onClick={handleLinkAction}
              className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border border-gray-900/10 transition-all hover:border-[#D4AF37]"
              aria-label={displayData.buttonText}
            >
              <div className="absolute inset-0 w-full h-full bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
              <div className="relative flex items-center gap-4">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-900 group-hover:text-[#D4AF37] transition-colors duration-300">
                  {displayData.buttonText}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-900 group-hover:text-white transition-colors duration-300" />
              </div>
            </button>
          </div>
        </div>

        {/* RIGHT: visuals */}
        <div className="w-full lg:w-[50%] h-[50vh] lg:h-[85vh] lg:max-h-[900px] relative flex items-center justify-center lg:items-center order-1 lg:order-2 perspective-1000 lg:pt-24 lg:pr-12 ml-auto ">

          {/* Soft glowing spot */}
          <div className="bg-decoration absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-gradient-to-tr from-[#D4AF37]/28 to-transparent rounded-full blur-3xl opacity-0"></div>

          <div className="hero-image-container relative w-full h-full flex items-center justify-center">

            {/* --- UPDATED BACK LAYERS WITH SHADOWS --- */}

            {/* Box 1 (Left/Back) */}
            {displayData.layer1 && (
              <div
                ref={layerBackRef}
                className="absolute top-[6%] left-[6%] lg:left-[10%] w-[140px] lg:w-[220px] pointer-events-none transform rotate-[10deg] z-0"
              >
                {/* Shadow for Box 1 */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-[20px] bg-black/20 blur-md rounded-[100%] mix-blend-multiply" />

                <img
                  src={displayData.layer1}
                  alt="fragrance notes card"
                  className="relative w-full opacity-50 blur-[1.5px] mix-blend-multiply rounded-lg"
                  style={{ filter: "saturate(0.6) contrast(0.95)" }}
                  loading="lazy"
                />
              </div>
            )}

            {/* Box 2 (Right/Mid) */}
            {displayData.layer2 && (
              <div
                ref={layerMidRef}
                className="absolute bottom-[16%] right-[6%] lg:right-[10%] w-[120px] lg:w-[180px] pointer-events-none transform -rotate-[8deg] z-0"
              >
                {/* Shadow for Box 2 */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-[15px] bg-black/20 blur-md rounded-[100%] mix-blend-multiply" />

                <img
                  src={displayData.layer2}
                  alt="fragrance notes card 2"
                  className="relative w-full opacity-50 blur-[2px] mix-blend-multiply rounded-lg"
                  style={{ filter: "saturate(0.55) contrast(0.9)" }}
                  loading="lazy"
                />
              </div>
            )}

            {/* --- MAIN BOTTLE (FIXED BOTTOM EDGE & SHADOW) --- */}
            <div className=" relative z-10 w-[220px] lg:w-[280px] h-auto aspect-[4/6]">

              {/* 2. INNER FIGURE: Handles Breathing Animation (Up/Down Loop) + Tilt */}
              {/* 'ref={bottleRef}' stays here so GSAP animates this inner part without conflict */}
              <figure
                ref={bottleRef}
                className="w-full h-full cursor-default"
                style={{
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                  perspective: 1200,
                }}
                aria-label="Perfume bottle: Devid Aura Sapphire Mist"
              >
                {/* Shadow */}
                <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-[85%] h-[25px] bg-black/25 blur-xl rounded-[100%] z-0 pointer-events-none mix-blend-multiply" />

                {/* Image */}
                <img
                  src={displayData.image}
                  alt="Devid Aura Sapphire Mist perfume bottle"
                  className="relative z-10 w-full h-full object-contain filter sepia-[0.15] contrast-[1] brightness-[1] blur-[0.2px] ml-8 opacity-85"
                  loading="lazy"
                  style={{
                    maskImage: "linear-gradient(to bottom, black 92%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 92%, transparent 100%)"
                  }}
                />
              </figure>
            </div>
          </div>
        </div>
      </main>

      {/* Footer scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 opacity-40 z-20">
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <div className="w-[1px] h-12 bg-black/20 overflow-hidden">
          <div className="w-full h-full bg-black animate-scroll-down"></div>
        </div>
      </div>

      {/* BOTTOM BLEND */}
      <div className="absolute bottom-0 left-0 w-full h-24 lg:h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>

      {/* Styles */}
      <style>{`
        @keyframes scroll-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scroll-down {
          animation: scroll-down 1.5s cubic-bezier(0.77, 0, 0.175, 1) infinite;
        }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};

export default HeroSection;