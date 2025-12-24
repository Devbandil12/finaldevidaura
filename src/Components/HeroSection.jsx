import React, { useLayoutEffect, useRef, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import HeroButton from './HeroButton';

// DEFAULT ASSETS (Fallbacks)
import bottleMain from "../assets/images/saphire-mist.webp";
import bottleLayer1 from "../assets/images/saphire-mist-2.webp";
import bottleLayer2 from "../assets/images/vigor.webp";

const HeroSection = () => {
  const comp = useRef(null);
  const navigate = useNavigate();
  
  // --- CMS STATE ---
  const [activeBanner, setActiveBanner] = useState(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

  // --- FETCH CMS BANNERS ---
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/cms/banners`);
        if (res.ok) {
          const data = await res.json();
          // Find the active banner specifically for 'hero' section
          const hero = data.find(b => b.type === 'hero' && b.isActive);
          if (hero) setActiveBanner(hero);
        }
      } catch (err) {
        console.error("Failed to load hero banner:", err);
      }
    };
    fetchBanners();
  }, []);

  // --- LOGIC: CHECK LAYOUT MODE ---
  const isFullBanner = activeBanner?.layout === 'full';

  // ==========================================
  // MODE 1: FULL BANNER RENDER
  // ==========================================
  if (isFullBanner) {
      return (
        <section className="relative h-[85vh] w-full overflow-hidden bg-black">
           {/* Background Image */}
           <img 
             src={activeBanner.imageUrl} 
             alt="Banner" 
             className="absolute inset-0 w-full h-full object-cover opacity-80" 
           />
           
           {/* Centered Text Content */}
           <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white p-4 animate-in fade-in duration-1000">
               <h1 className="text-5xl md:text-7xl font-serif mb-6 drop-shadow-lg">
                 {activeBanner.title}
               </h1>
               
               {activeBanner.subtitle && (
                 <p className="text-xl mb-8 font-light tracking-widest uppercase drop-shadow-md">
                   {activeBanner.subtitle}
                 </p>
               )}
               
               {/* Button (Uses CMS text or defaults to 'Shop Now') */}
               <HeroButton 
                 text={activeBanner.buttonText || "Shop Now"} 
                 onClick={() => navigate(activeBanner.link || '/products')} 
               />
           </div>
        </section>
      );
  }

  // ==========================================
  // MODE 2: SPLIT LAYOUT (3D Bottle Animation)
  // ==========================================
  
  // Configuration with Fallbacks
  const displayData = {
    title: activeBanner?.title || "Don't Wear A Scent.",
    subtitle: activeBanner?.subtitle || "The Custom Atelier",
    
    // Text Fallbacks: If CMS field is empty, use the original hardcoded text
    poeticLine: activeBanner?.poeticLine || "Build A Legacy.",
    description: activeBanner?.description || "Standard perfume is for the crowd. Select your foundation, layer your heart notes, and crown it with an aura that belongs only to you.",
    buttonText: activeBanner?.buttonText || "Construct Your Signature",
    link: activeBanner?.link || "custom-combo-section",

    // Image Logic:
    // 1. Main Bottle: Use uploaded image, or default sapphire mist
    image: activeBanner?.imageUrl || bottleMain,
    
    // 2. Layers: Only show layers if uploaded. 
    // Exception: If NO banner is active (using all defaults), show default layers.
    layer1: activeBanner?.imageLayer1 || (!activeBanner ? bottleLayer1 : null),
    layer2: activeBanner?.imageLayer2 || (!activeBanner ? bottleLayer2 : null),
  };

  const handleLinkAction = useCallback(() => {
    const target = displayData.link;
    if (target.startsWith("http") || target.startsWith("/")) {
       // External or Route link
       if (target.startsWith("/")) navigate(target);
       else window.location.href = target;
    } else {
       // Scroll ID
       const el = document.getElementById(target);
       if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayData.link, navigate]);

  // --- GSAP ANIMATIONS ---
  useLayoutEffect(() => {
    let mm = gsap.matchMedia();

    let ctx = gsap.context(() => {
      
      // 1. SETUP: Hide elements initially
      const elementsToHide = [".bottle-main", ".brand-title", ".poetic-line", ".cta-container"];
      if (displayData.layer1) elementsToHide.push(".bottle-layer-1");
      if (displayData.layer2) elementsToHide.push(".bottle-layer-2");

      gsap.set(elementsToHide, { autoAlpha: 0 });

      // Force hardware acceleration for smoother visuals
      const acceleratedImages = [".bottle-main"];
      if (displayData.layer1) acceleratedImages.push(".bottle-layer-1");
      if (displayData.layer2) acceleratedImages.push(".bottle-layer-2");

      gsap.set(acceleratedImages, {
        willChange: "transform, opacity",
        transform: "translate3d(0,0,0)",
        force3D: true,
      });

      // --- SHARED TIMELINE ---
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          gsap.set(elementsToHide, { willChange: "auto" });
        },
      });

      // Text Animations
      tl.to(".brand-title", { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.1, startAt: { y: -30 } });
      tl.to(".poetic-line", { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.1, ease: "expo.out", startAt: { y: 60 } }, "-=0.8");

      // --- RESPONSIVE SEQUENCING ---
      mm.add(
        {
          isDesktop: "(min-width: 800px)",
          isMobile: "(max-width: 799px)",
        },
        (context) => {
          let { isMobile } = context.conditions;

          if (isMobile) {
            // MOBILE ANIMATION
            tl.to(".cta-container", { autoAlpha: 1, duration: 1.0, startAt: { y: 10 }, y: 0 }, "-=0.5"); 

            const imagesToFade = [".bottle-main"];
            if (displayData.layer1) imagesToFade.push(".bottle-layer-1");
            if (displayData.layer2) imagesToFade.push(".bottle-layer-2");

            tl.to(imagesToFade, { autoAlpha: 1, duration: 1.2, ease: "sine.out" }, "-=0.2");

          } else {
            // DESKTOP ANIMATION
            tl.to(".bottle-main", {
              scale: 1, autoAlpha: 1, y: 0, duration: 1.5, ease: "expo.out",
              startAt: { scale: 0.9, y: 50 }
            }, "-=1");

            // Animate Extra Layers if they exist
            if (displayData.layer1 || displayData.layer2) {
                const layers = [];
                if(displayData.layer1) layers.push(".bottle-layer-1");
                if(displayData.layer2) layers.push(".bottle-layer-2");

                tl.to(layers, {
                  x: 0, autoAlpha: 1, rotation: (index) => (index === 0 ? -10 : 10), duration: 1.8, ease: "expo.out",
                  startAt: { x: (index) => (index === 0 ? -40 : 40), rotation: 0 }
                }, "<");
            }

            tl.to(".cta-container", { autoAlpha: 1, y: 0, duration: 0.8, startAt: { y: 20 } }, "-=0.8");

            // Floating VFX
            tl.to(".bottle-main", { filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.3))", duration: 1 }, "-=1");

            gsap.to(".bottle-main", { y: -15, rotation: 1, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
            
            if (displayData.layer1) {
                gsap.to(".bottle-layer-1", { y: 20, rotation: -3, duration: 6, delay: 0.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
            }
            if (displayData.layer2) {
                gsap.to(".bottle-layer-2", { y: -20, rotation: 3, duration: 7, delay: 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
            }
          }
        }
      );
    }, comp);

    return () => ctx.revert();
  }, [activeBanner]); // Re-run if banner changes

  // Helper to split title for split-line animation
  const titleWords = displayData.title.split(" ");
  const half = Math.ceil(titleWords.length / 2);
  const titlePart1 = titleWords.slice(0, half).join(" ");
  const titlePart2 = titleWords.slice(half).join(" ");

  return (
    <div
      ref={comp}
      className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col items-center pb-15"
    >
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Montserrat:wght@300;400;500&display=swap');
        .gpu-accelerated {
            transform: translate3d(0, 0, 0);
            -webkit-transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            perspective: 1000px;
        }
        `}
      </style>

      {/* --- HEADER --- */}
      <div className="w-full pt-16 pb-8 text-center relative ">
        <h1 className="brand-title text-3xl lg:text-5xl tracking-[0.2em] font-bold text-black uppercase invisible" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
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

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-center relative pb-12">
        
        {/* LEFT: TEXT CONTENT */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left mb-16 lg:mb-0 z-20">
          <h2 className="poetic-line text-xs lg:text-sm tracking-[0.4em] uppercase text-[#D4AF37] mb-6 font-bold border border-[#D4AF37]/30 px-4 py-2 rounded-full invisible">
            {displayData.subtitle}
          </h2>

          <div className="mb-8 space-y-2">
            {/* Dynamic Title Split for Animation */}
            <div className="overflow-hidden">
              <h1 className="poetic-line text-5xl lg:text-7xl text-black leading-[0.9] invisible" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {titlePart1}
              </h1>
            </div>
            {titlePart2 && (
            <div className="overflow-hidden">
              <h1 className="poetic-line text-5xl lg:text-7xl text-black leading-[0.9] invisible" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {titlePart2}
              </h1>
            </div>
            )}
            
            {/* Extra Poetic Line */}
            <div className="overflow-hidden pt-2">
              <h1 className="poetic-line text-4xl lg:text-6xl text-gray-400 italic leading-[0.9] invisible" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {displayData.poeticLine}
              </h1>
            </div>
          </div>

          <div className="overflow-hidden max-w-lg">
            <p className="poetic-line text-sm lg:text-base text-gray-600 font-medium leading-loose tracking-wide invisible" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {displayData.description}
            </p>
          </div>

          {/* Call To Action */}
          <div className="cta-container mt-12 invisible">
            <button
              onClick={handleLinkAction}
              className="group relative px-12 py-5 bg-transparent border border-black overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-[#1A1C20] translate-y-[101%] group-hover:translate-y-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
              <div className="relative z-10 flex items-center gap-3">
                <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#1A1C20] group-hover:text-white transition-colors duration-500 delay-75">
                  {displayData.buttonText}
                </span>
                <span className="text-[#1A1C20] group-hover:text-[#D4AF37] transition-colors duration-500 delay-75">
                  →
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* RIGHT: BOTTLE VISUALS */}
        <div className="w-full lg:w-1/2 relative h-[50vh] lg:h-[70vh] flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            
            <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gray-100 rounded-full blur-3xl -z-10"></div>

            {/* Render Extra Layers if they exist */}
            {displayData.layer1 && (
                <img
                  src={displayData.layer1}
                  alt="Base Note"
                  decoding="async"
                  className="bottle-layer-1 gpu-accelerated invisible absolute left-[5%] lg:left-[10%] top-[25%] h-[55%] object-contain opacity-50 lg:opacity-60 lg:blur-[1px]"
                  style={{ zIndex: 1 }}
                />
            )}
            {displayData.layer2 && (
                <img
                  src={displayData.layer2}
                  alt="Top Note"
                  decoding="async"
                  className="bottle-layer-2 gpu-accelerated invisible absolute right-[5%] lg:right-[10%] top-[15%] h-[50%] object-contain opacity-50 lg:opacity-60 lg:blur-[1px]"
                  style={{ zIndex: 2 }}
                />
            )}

            <img
              src={displayData.image}
              alt="The Signature"
              decoding="async"
              className="bottle-main gpu-accelerated invisible relative h-[85%] object-contain"
              style={{ zIndex: 3 }}
            />

            <div className="bottle-main absolute bottom-10 bg-white lg:bg-white/80 lg:backdrop-blur-sm border border-white px-6 py-2 rounded-full lg:shadow-sm invisible">
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

export default HeroSection;