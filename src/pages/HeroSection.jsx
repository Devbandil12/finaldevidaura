import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowRight, Droplet, Clock, Sparkles, ShieldCheck } from "lucide-react";
import { optimizeImage } from "../utils/imageOptimizer";

// DEFAULT ASSETS
import bottleMain from "/images/SAPPHIRE-MIST.webp";
import bottleLayer1 from "../assets/images/PERFUME-B0X.webp";
import bottleLayer2 from "../assets/images/PERFUME-B0X.webp";

const HeroSection = () => {
  const comp = useRef(null);
  const containerRef = useRef(null);
  const bottleRef = useRef(null);
  const layerBackRef = useRef(null);
  const layerMidRef = useRef(null);
  const navigate = useNavigate();

  const [activeBanner, setActiveBanner] = useState(() => {
    try {
      const cached = localStorage.getItem("hero_banner_cache");
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  });

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

  // 1. Fetch Banner Data
  useEffect(() => {
    const controller = new AbortController();
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/cms/banners`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const hero = data.find((b) => b.type === "hero" && b.isActive);
          if (hero) {
            setActiveBanner((prev) => {
              const prevStr = JSON.stringify(prev);
              const newStr = JSON.stringify(hero);
              if (prevStr !== newStr) {
                localStorage.setItem("hero_banner_cache", newStr);
                return hero;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Banner fetch failed:", err);
      }
    };
    fetchBanners();
    return () => controller.abort();
  }, [BACKEND_URL]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. Memoize Display Data
  const displayData = useMemo(() => ({
    title: activeBanner?.title || "Essence of Light",
    subtitle: activeBanner?.subtitle || "The Radiant Collection",
    poeticLine: activeBanner?.poeticLine || "Where shadow fades and aura begins.",
    description: activeBanner?.description || "A symphony of crushed petals and sun-drenched amber. Designed not just to be worn, but to be felt.",
    buttonText: activeBanner?.buttonText || "Discover Your Scent",
    link: activeBanner?.link || "custom-combo-section",
    image: optimizeImage(activeBanner?.imageUrl || bottleMain, 800),
    layer1: optimizeImage(activeBanner?.imageLayer1 || (!activeBanner ? bottleLayer1 : null), 400),
    layer2: optimizeImage(activeBanner?.imageLayer2 || (!activeBanner ? bottleLayer2 : null), 400),
  }), [activeBanner]);

  // 3. Preload Images
  useEffect(() => {
    const imagesToLoad = [displayData.image, displayData.layer1, displayData.layer2].filter(Boolean);
    imagesToLoad.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [displayData]);

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

  // 4. GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      gsap.set(".hero-text-reveal", { y: 60, opacity: 0 });
      gsap.set(".hero-image-container", { scale: 1.1, opacity: 0 });
      gsap.set(".bg-decoration", { scale: 0.8, opacity: 0 });
      gsap.set(".usp-item", { x: 30, y: 20, opacity: 0 });

      // Ensure origin is center for rubber scaling
      gsap.set(".parallax-bg-text", { transformOrigin: "center center" });

      if (!isMobile) {
        gsap.set(bottleRef.current, {
          rotationZ: 6, rotationY: -8, transformPerspective: 1000, transformOrigin: "50% 50%"
        });
      }

      tl.to(".bg-decoration", { scale: 1, opacity: 1, duration: 2 })
        .to(".hero-image-container", { scale: 1, opacity: 1, duration: 2.2, ease: "power2.out" }, "-=1.8")
        .to(".hero-text-reveal", { y: 0, opacity: 1, stagger: 0.1, duration: 1.2 }, "-=1.0")
        .to(".usp-item", { x: 0, y: 0, opacity: 1, stagger: 0.15, duration: 1.4, ease: "power4.out" }, "-=0.8");

      if (!isMobile) {
        gsap.to(bottleRef.current, { y: -12, duration: 4.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
        if (layerBackRef.current) gsap.to(layerBackRef.current, { rotation: 14, duration: 24, repeat: -1, yoyo: true, ease: "linear" });
        if (layerMidRef.current) gsap.to(layerMidRef.current, { rotation: -10, duration: 30, repeat: -1, yoyo: true, ease: "linear" });
      }
    }, comp);
    return () => ctx.revert();
  }, [isMobile]);

  // 5. ⚡ UPDATED: RUBBER STRETCH MOUSE EFFECT
  useEffect(() => {
    if (isMobile || !containerRef.current) return;

    const handleMouseMove = (e) => {
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();

      // Normalize mouse position (-1 to 1)
      const x = ((e.clientX - left) / width - 0.5) * 2;
      const y = ((e.clientY - top) / height - 0.5) * 2;

      // Use gsap.to instead of quickSetter for fluid elasticity
      gsap.to(".parallax-bg-text", {
        x: x * -50,  // Move horizontally
        y: y * -30,  // Move vertically

        // RUBBER EFFECT: Stretch based on distance from center
        scaleX: 1 + Math.abs(x) * 0.15, // Stretch up to 15% wider
        scaleY: 1 + Math.abs(y) * 0.10, // Stretch up to 10% taller

        // SHEAR: Slight skew to feel like material is pulling
        skewX: x * 5,

        duration: 0.8,    // Adds the "heavy" rubber feel
        ease: "power3.out", // Smooth deceleration
        overwrite: "auto"
      });
    };

    const handleMouseLeave = () => {
      // Snap back to original shape when mouse leaves
      gsap.to(".parallax-bg-text", {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        duration: 1.2,
        ease: "elastic.out(1, 0.3)" // Wobbly snap back
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    containerRef.current.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (containerRef.current) containerRef.current.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isMobile]);

  const features = [
    { icon: <Droplet className="w-5 h-5" />, title: "30% Oil", desc: "Premium concentration for elite depth." },
    { icon: <Clock className="w-5 h-5" />, title: "12hr+ Wear", desc: "Guaranteed long-lasting sillage." },
    { icon: <Sparkles className="w-5 h-5" />, title: "Macerated", desc: "30-day aged for smoother notes." },
    { icon: <ShieldCheck className="w-5 h-5" />, title: "Skin Safe", desc: "Pure ethanol & skin-friendly base." }
  ];

  return (
    <div ref={comp} className="relative w-full min-h-screen text-[#1a1a1a] overflow-hidden selection:bg-[#D4AF37] selection:text-white pb-20 lg:pb-0">
      {/* Background Watermark */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
        <h1 className="text-[19vw] font-bold tracking-tighter text-black whitespace-nowrap parallax-bg-text origin-center will-change-transform">DEVID AURA</h1>
      </div>

      <main ref={containerRef} className="relative z-10 w-full max-w-[1800px] mx-auto min-h-screen flex flex-col lg:flex-row items-center px-6 lg:px-16 pt-[80px]">
        {/* LEFT: Content */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center items-center lg:items-start text-center lg:text-left z-20 order-2 lg:order-1 mt-12 lg:mt-0">
          <div className="hero-text-reveal flex items-center gap-3 mb-4 opacity-0">
            <span className="h-[1px] w-12 bg-[#D4AF37]"></span>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#D4AF37]">{displayData.subtitle}</span>
          </div>
          <div className="overflow-hidden mb-2">
            <h1 className="hero-text-reveal text-5xl lg:text-7xl xl:text-8xl font-medium leading-[1.1] pb-2 text-gray-900 opacity-0">
              {displayData.title}
            </h1>
          </div>
          <div className="overflow-hidden mb-8">
            <p className="hero-text-reveal text-xl lg:text-2xl italic text-gray-600 opacity-0">
              {displayData.poeticLine}
            </p>
          </div>
          <div className="overflow-hidden max-w-md mb-10">
            <p className="hero-text-reveal text-sm lg:text-base text-stone-700 leading-relaxed font-light opacity-0">
              {displayData.description}
            </p>
          </div>
          <div className="hero-text-reveal opacity-0 mb-16">
            <button onClick={handleLinkAction} className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border border-gray-900/10 transition-all hover:border-[#D4AF37]">
              <div className="absolute inset-0 w-full h-full bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
              <div className="relative flex items-center gap-4">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-900 group-hover:text-[#D4AF37] transition-colors duration-300">{displayData.buttonText}</span>
                <ArrowRight className="w-4 h-4 text-gray-900 group-hover:text-white transition-colors duration-300" />
              </div>
            </button>
          </div>

          <div className="w-full mt-8 lg:mt-4">
            <div className="flex overflow-x-auto snap-x-mandatory no-scrollbar gap-6 pb-4 lg:grid lg:grid-cols-2 lg:overflow-visible lg:gap-y-8 lg:pb-0">
              {features.map((item, index) => (
                <div key={index} className="usp-item group flex flex-shrink-0 items-start gap-4 opacity-0 w-[280px] snap-center bg-white/50 p-4 rounded-2xl border border-gray-100 lg:w-auto lg:bg-transparent lg:p-0 lg:border-none">
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-[#D4AF37]/5 flex items-center justify-center border border-[#D4AF37]/10 transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:scale-110">
                    <div className="text-[#D4AF37] group-hover:text-white transition-colors duration-300">
                      {item.icon}
                    </div>
                  </div>
                  <div className="text-left flex flex-col justify-center">
                    <h2 className="usp-title text-[22px] mb-1 group-hover:text-[#D4AF37] transition-colors duration-300">{item.title}</h2>
                    <p className="usp-description text-sm opacity-80 text-stone-600 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex lg:hidden justify-center gap-1.5 mt-2">
              {features.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/20" />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Visuals */}
        <div className="w-full lg:w-[50%] h-[50vh] lg:h-[85vh] lg:max-h-[900px] relative flex items-center justify-center lg:items-center order-1 lg:order-2 perspective-1000 lg:pt-15 lg:pr-12 ml-auto">
          <div className="bg-decoration absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-gradient-to-tr from-[#D4AF37]/18 to-transparent rounded-full blur-3xl opacity-0"></div>
          <div className="hero-image-container relative w-full h-full flex items-center justify-center opacity-0 scale-125">
            {displayData.layer1 && (
              <div ref={layerBackRef} className="parallax-layer-back absolute top-[6%] left-[6%] lg:left-[10%] w-[140px] lg:w-[220px] pointer-events-none transform rotate-[10deg] z-0">
                <img
                  src={displayData.layer1}
                  alt="Back Layer"
                  className="relative w-full opacity-50 blur-[1.5px] mix-blend-multiply rounded-lg"
                  style={{ filter: "saturate(0.6) contrast(0.95)" }}
                  fetchPriority="high"
                  decoding="async"
                  loading="eager"
                />
              </div>
            )}
            {displayData.layer2 && (
              <div ref={layerMidRef} className="parallax-layer-mid absolute bottom-[16%] right-[6%] lg:right-[10%] w-[120px] lg:w-[180px] pointer-events-none transform -rotate-[8deg] z-0">
                <img
                  src={displayData.layer2}
                  alt="Front Layer"
                  className="relative w-full opacity-50 blur-[2px] mix-blend-multiply rounded-lg"
                  style={{ filter: "saturate(0.55) contrast(0.9)" }}
                  fetchPriority="high"
                  decoding="async"
                  loading="eager"
                />
              </div>
            )}
            <div className="parallax-layer-front relative z-10 w-[220px] lg:w-[280px] h-auto aspect-[5/5] lg:aspect-[4/6] mt-5 lg:mt-12">
              <figure ref={bottleRef} className="w-full h-full cursor-default" style={{ transformStyle: "preserve-3d", perspective: 1500 }}>
                <img
                  src={displayData.image}
                  alt="Devid Aura Perfume"
                  className="relative z-10 w-full h-full object-contain filter sepia-[0.15] contrast-[1] brightness-[1] ml-10 lg:ml-13 opacity-85"
                  style={{ maskImage: "linear-gradient(to bottom, black 92%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 92%, transparent 100%)" }}
                  loading="eager"
                  width="400"  // Add explicit width approx
                  height="600"
                  fetchPriority="high"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};

export default HeroSection;