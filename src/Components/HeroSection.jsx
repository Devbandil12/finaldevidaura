import { useRef, useState, useEffect } from "react";
import bottleImage from "../assets/images/bottle-perfume.webp";
import { useNavigate } from "react-router-dom";

// --- 1. Import GSAP and required plugins ---
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

// --- 2. Register the plugins with GSAP ---
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const theme = {
  colors: {
    cream: "45 25% 97%",
    creamDark: "45 20% 92%",
    luxuryDark: "240 20% 15%",
    gold: "38 92% 50%",
    goldLight: "45 100% 65%",
    rose: "340 82% 52%",
    navy: "240 40% 25%",
  },
};

const keyframes = `
  @keyframes shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: .6; transform: scale(.85); }
  }

  @media (max-width: 768px) {
    .mobile-no-blur {
      backdrop-filter: none !important;
      background-color: hsla(0, 0%, 100%, 0.9) !important;
    }
  }
`;

const HeroSection = () => {
  const navigate = useNavigate();

  // --- 3. Refs for animated elements ---
  const sectionRef = useRef(null);
  const textPillRef = useRef(null);
  const headingRef = useRef(null);
  const subheadingRef = useRef(null);
  const descriptionRef = useRef(null);
  const buttonsRef = useRef(null);
  const imageWrapperRef = useRef(null);
  const bottleRef = useRef(null);
  const pill1Ref = useRef(null);
  const pill2Ref = useRef(null);

  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection effect
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // --- 4. GSAP Animation Effect (Animates on Page Load) ---
  useEffect(() => {
    // GSAP context for safe cleanup
    let ctx = gsap.context(() => {
      // Set initial state (gsap.set runs before paint, but
      // inline styles are safer for FOUC)
      gsap.set(
        [
          textPillRef.current,
          headingRef.current,
          subheadingRef.current,
          descriptionRef.current,
          buttonsRef.current,
        ],
        { autoAlpha: 0, y: 50 } 
      );
      gsap.set(imageWrapperRef.current, { autoAlpha: 0 });
      gsap.set(bottleRef.current, { autoAlpha: 0, scale: 0.8 });
      gsap.set([pill1Ref.current, pill2Ref.current], {
        autoAlpha: 0,
        scale: 0.5,
      });

      // Timeline that plays on load
      const tl = gsap.timeline({
        delay: 0.3, // Small delay for page to paint
      });

      // Add animations to the timeline
      tl.to(textPillRef.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      })
        .to(
          headingRef.current,
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.3"
        )
        .to(
          subheadingRef.current,
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        )
        .to(
          descriptionRef.current,
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        )
        .to(
          buttonsRef.current,
          { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.4"
        )
        .to(
          imageWrapperRef.current,
          { autoAlpha: 1, duration: 0.8, ease: "power2.inOut" },
          "-=0.8"
        )
        .to(
          bottleRef.current,
          { autoAlpha: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.75)" },
          "-=0.5"
        )
        .to(
          [pill1Ref.current, pill2Ref.current],
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)",
            stagger: 0.2, 
          },
          "-=0.6"
        );
    }, sectionRef); 

    return () => ctx.revert(); // Cleanup
  }, []); 

  // --- 5. Modified scroll function using GSAP ---
  const scrollOrNavigate = (sectionId) => {
    if (window.location.pathname !== "/") {
      sessionStorage.setItem("scrollToSection", sectionId);
      navigate("/");
    } else {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: {
          y: `#${sectionId}`, 
          offsetY: 80, 
        },
        ease: "power2.inOut",
      });
    }
  };

  const onlyFeltStyles = {
    backgroundImage: `linear-gradient(90deg, hsl(${theme.colors.gold}), hsl(${theme.colors.rose}), hsl(${theme.colors.goldLight}))`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundSize: "200% 100%",
    animation: "shimmer 3s linear infinite",
    display: "inline-block",
  };

  const leavesStyles = {
    backgroundImage: `linear-gradient(90deg, hsl(${theme.colors.gold}), hsl(${theme.colors.rose}))`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <div>
      <style>{keyframes}</style>

      {/* --- 6. Parent section ref --- */}
      <section
        ref={sectionRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        // NO style={{ visibility: "hidden" }} here!
      >
        <div className="container mx-auto px-6 lg:px-20 py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-center lg:text-left">
              {!isMobile && (
                <div
                  className="absolute left-0 top-10 w-52 h-52 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl pointer-events-none"
                  style={{ opacity: 0.25 }}
                />
              )}

              {/* --- 7. Add inline visibility style to all animated elements --- */}
              <div
                ref={textPillRef}
                className="inline-flex items-center gap-2 px-4 py-1 rounded-full mobile-no-blur max-sm:pt-8"
                style={{
                  visibility: "hidden", // <-- FIX for FOUC
                  background: `linear-gradient(to right, hsla(${theme.colors.gold}, 0.2), hsla(${theme.colors.rose}, 0.2))`,
                  backdropFilter: "blur(4px)",
                  border: `1px solid hsla(${theme.colors.gold}, 0.3)`,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: `hsl(${theme.colors.gold})`,
                    animation: "pulse 2s infinite",
                  }}
                />
                <span
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: `hsl(${theme.colors.luxuryDark})` }}
                >
                  EXCLUSIVE COLLECTION
                </span>
              </div>

              <h1
                ref={headingRef}
                style={{ visibility: "hidden" }} // <-- FIX for FOUC
                className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold leading-tight"
              >
                <span style={{ color: `hsl(${theme.colors.luxuryDark})` }}>
                  Not seen,
                </span>
                <br />
                <span style={{ color: `hsl(${theme.colors.luxuryDark})` }}>
                  not heard,
                </span>
                <br />
                <span style={onlyFeltStyles}>only felt</span>
              </h1>

              <p
                ref={subheadingRef}
                style={{
                  visibility: "hidden", // <-- FIX for FOUC
                  color: `hsl(${theme.colors.navy})`,
                }}
                className="text-2xl sm:text-3xl font-serif italic"
              >
                In every breath he{" "}
                <span style={leavesStyles} className="font-bold not-italic">
                  leaves
                </span>{" "}
                behind.
              </p>

              <p
                ref={descriptionRef}
                style={{
                  visibility: "hidden", // <-- FIX for FOUC
                  color: `hsla(${theme.colors.navy}, 0.75)`,
                }}
                className="text-lg font-sans max-w-xl mx-auto lg:mx-0 leading-relaxed pt-8"
              >
                Fragrances that whisper stories — crafted from the rarest
                essences and wrapped in glass like a secret.
              </p>

              <div
                ref={buttonsRef}
                style={{ visibility: "hidden" }} // <-- FIX for FOUC
                className="flex flex-wrap gap-4 justify-center lg:justify-start"
              >
                <button
                  onClick={() => scrollOrNavigate("collection-section")}
                  className="px-8 py-3 rounded-full text-white shadow-md transition-transform hover:scale-105 mr-auto sm:mr-0"
                  style={{
                    backgroundImage: `linear-gradient(to right, hsl(${theme.colors.gold}), hsl(${theme.colors.goldLight}), hsl(${theme.colors.gold}))`,
                  }}
                >
                  Explore Collection →
                </button>

                <button
                  onClick={() => scrollOrNavigate("scents-section")}
                  className="px-8 py-3 rounded-full bg-white border-2 transition-transform hover:scale-105 ml-auto sm:ml-0 "
                  style={{
                    borderColor: `hsl(${theme.colors.gold})`,
                    color: `hsl(${theme.colors.luxuryDark})`,
                  }}
                >
                  Our Scents
                </button>
              </div>
            </div>

            <div
              ref={imageWrapperRef}
              className="relative flex justify-center items-center p-8 rounded-lg"
              style={{
                visibility: "hidden", // <-- FIX for FOUC
                background: `linear-gradient(to bottom right, hsla(${theme.colors.gold}, 0.1), hsla(${theme.colors.rose}, 0.1), hsla(${theme.colors.goldLight}, 0.1))`,
              }}
            >
              <div
                ref={bottleRef}
                style={{ visibility: "hidden" }} // <-- FIX for FOUC
                className="relative z-10"
              >
                <img
                  src={bottleImage}
                  alt="Luxury Perfume Bottle"
                  className="w-72 sm:w-96 lg:w-[28rem] h-auto object-contain"
                  loading="lazy"
                  width="600"
                  height="800"
                />
              </div>

              <div
                ref={pill1Ref}
                style={{ visibility: "hidden" }} // <-- FIX for FOUC
                className="absolute top-10 -left-8 px-6 py-2 rounded-full shadow-lg bg-white/90 backdrop-blur mobile-no-blur"
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: `hsl(${theme.colors.luxuryDark})` }}
                >
                  100% Natural
                </span>
              </div>

              <div
                ref={pill2Ref}
                style={{ visibility: "hidden" }} // <-- FIX for FOUC
                className="absolute bottom-20 -right-8 px-6 py-2 rounded-full shadow-lg bg-white/90 backdrop-blur mobile-no-blur"
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: `hsl(${theme.colors.luxuryDark})` }}
                >
                  Long Lasting
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;