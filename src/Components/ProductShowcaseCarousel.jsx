import React, { useContext, useEffect, useRef, useState } from "react";
import { ProductContext } from "../contexts/productContext";
import gsap from "gsap";

const perfumeMeta = {
  SHADOW: {
    bg: "#1a1a1a",
    textColor: "white",
    slogan: "Where silence lingers longer than light.",
    story:
      "Crafted for those who speak softly and leave echoes. SHADOW is the scent of velvet evenings, mysterious meetings, and quiet power.",
  },
  SUNSET: {
    bg: "#5e3023",
    textColor: "white",
    slogan: "A romance written in golden hour hues.",
    story:
      "SUNSET is for twilight hearts, warm touches, and soft-spoken confessions under saffron skies.",
  },
  VIGOR: {
    bg: "#111d4a",
    textColor: "white",
    slogan: "Energy bottled in elegant defiance.",
    story:
      "VIGOR charges your day with fearless zest — crafted for bold mornings, quick minds, and confident steps.",
  },
  "OUD HORIZON": {
    bg: "#3a2e2e",
    textColor: "white",
    slogan: "Exotic depth beyond the horizon.",
    story:
      "A fragrance of rich oud and tropical fruit — OUD HORIZON is designed for those who leave a trail of intrigue.",
  },
};

const ProductShowcaseCarousel = () => {
  const { products } = useContext(ProductContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);
  const cardRefs = useRef([]);
  const bgRef = useRef(null);

  const total = products.length;
  const activeProduct = products[activeIndex];
  const meta = perfumeMeta[activeProduct.name.toUpperCase()] || {
    bg: "#fff",
    textColor: "black",
    slogan: "",
    story: "",
  };

  // Swipe + Auto-play
  useEffect(() => {
    autoPlay();
    return () => clearInterval(timerRef.current);
  }, [activeIndex]);

  const autoPlay = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      next();
    }, 5000);
  };

  const next = () => {
    setActiveIndex((i) => (i + 1) % total);
  };

  const prev = () => {
    setActiveIndex((i) => (i - 1 + total) % total);
  };

  const goTo = (index) => {
    setActiveIndex(index);
  };

  // GSAP entry animations
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      cardRefs.current[activeIndex],
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
    );
    gsap.to(bgRef.current, {
      backgroundColor: meta.bg,
      duration: 0.6,
      ease: "power2.out",
    });
  }, [activeIndex]);

  return (
    <div
      ref={bgRef}
      className="min-h-screen w-full transition-all duration-700 text-white"
      onMouseEnter={() => clearInterval(timerRef.current)}
      onMouseLeave={autoPlay}
    >
      <div className="max-w-6xl mx-auto py-16 px-4 md:px-8 flex flex-col md:flex-row items-center gap-10">
        {/* Left: Carousel */}
        <div className="w-full md:w-1/2 relative">
          <div className="relative h-[400px]">
            {products.map((product, index) => (
              <div
                key={product.id}
                ref={(el) => (cardRefs.current[index] = el)}
                className={`absolute w-full h-full transition-all duration-500 ease-in-out ${
                  index === activeIndex ? "z-10 opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={
                    Array.isArray(product.images)
                      ? product.images[0]
                      : product.imageurl
                  }
                  alt={product.name}
                  className="object-cover h-full w-full rounded-xl shadow-lg"
                />
              </div>
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex justify-center mt-6 gap-4">
            <button
              onClick={prev}
              className="w-10 h-10 bg-white/20 rounded-full text-white hover:bg-white/30"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="w-10 h-10 bg-white/20 rounded-full text-white hover:bg-white/30"
            >
              ›
            </button>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center mt-4 space-x-2">
            {products.map((_, i) => (
              <button
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i === activeIndex
                    ? "bg-white"
                    : "bg-white/40 hover:bg-white/70"
                }`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div
          className={`w-full md:w-1/2 transition-all duration-500 text-${meta.textColor}`}
        >
          <h2 className="text-3xl font-bold mb-2">{activeProduct.name}</h2>
          <p className="italic text-lg opacity-90 mb-6">{meta.slogan}</p>
          <p className="mb-6 text-md">{meta.story}</p>

          <div className="space-y-4 text-sm md:text-base">
            {activeProduct.composition && (
              <div>
                <h4 className="font-semibold text-white/80">Top Notes</h4>
                <p>{activeProduct.composition}</p>
              </div>
            )}
            {activeProduct.fragranceNotes && (
              <div>
                <h4 className="font-semibold text-white/80">Base Notes</h4>
                <p>{activeProduct.fragranceNotes}</p>
              </div>
            )}
            {activeProduct.fragrance && (
              <div>
                <h4 className="font-semibold text-white/80">Heart Notes</h4>
                <p>{activeProduct.fragrance}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShowcaseCarousel;
