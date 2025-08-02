import React, { useContext, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ProductContext } from "../contexts/productContext";
import "../style/ProductSwipeShowcase.css";

const scentDetails = {
  SHADOW: {
    slogan: "Where silence lingers longer than light.",
    story: `Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told.
    It begins with a crisp, cooling rush of peppermint and lavender, stirring curiosity. As it unfolds, earthy oakmoss and sensual sandalwood emerge, grounding the fragrance in sophistication. A warm finish of amber and musk cloaks the wearer like midnight silk.
    Best worn in evening hours, when the world slows and presence becomes power.`,
    notes: ["Peppermint", "Lavender Burst", "Oakmoss", "Geranium", "Sandalwood", "Amber", "Musk Facets"]
  },
  SUNSET: {
    slogan: "Where golden light melts into longing.",
    story: `SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace. It opens with a vivid burst of saffron and grapefruit, laced with sage and bergamot, evoking the golden glow of dusk.
    The heart blooms with soft magnolia and jasmine, kissed by a hint of pepper — warm, intimate, alive. As it deepens, a rich foundation of oud and patchouli anchors the scent in sensual memory.
    Best worn at twilight, when the day exhales and romance begins to stir.`,
    notes: ["Saffron", "Sage", "Bergamot", "Grapefruit", "Magnolia", "Pepper", "Jasmine", "Oud", "Cedarwood", "Sandalwood", "Patchouli"]
  },
  VIGOR: {
    slogan: "Where boldness breaks like sunrise.",
    story: `VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose. It opens in a blaze of grapefruit and pepper, charged with the cool clarity of violet leaves.
    At its core, clary sage and French lavender pulse with herbal strength, while a powerful base of amber wood and tonka grounds the composition in warmth and persistence.
    Designed for daylight hours, when ambition sharpens and confidence commands the room.`,
    notes: ["Grapefruit", "Violet Leaves", "Sichuan Pepper", "Clary Sage", "Geranium", "French Lavender", "Amber Wood", "Tonka Bean", "Cristal Moss"]
  },
  "OUD HORIZON": {
    slogan: "Where tropics meet twilight — bold, bright, unforgettable.",
    story: `OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods. It begins with a burst of tropical exuberance: juicy mandarin, pineapple, and papaya, spiced gently by cardamom.
    A heart of sandalwood and amber follows, warm and magnetic, before settling into a complex tapestry of cedar, musk, and oud — refined, exotic, and lingering.
    Worn to make an impression, this scent is your signature when you want to arrive without speaking.`,
    notes: ["Mandarin Orange", "Papaya", "Bergamot", "Pineapple", "Cardamom", "Sandalwood", "Amber", "Musk", "Cedar", "Oakmoss", "Nutmeg", "Violet", "Orris Root", "Jasmine", "Lily-of-the-Valley"]
  }
};

const ProductSwipeShowcase = () => {
  const { products } = useContext(ProductContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageRefs = useRef([]);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const touchStartX = useRef(null);
  const observer = useRef(null);

  const next = () => setCurrentIndex((i) => (i + 1) % products.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + products.length) % products.length);

  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) prev();
    else if (delta < -50) next();
  };

  useEffect(() => {
    gsap.set(imageRefs.current, { zIndex: (_, i) => products.length - i });
    imageRefs.current.forEach((img, i) => {
      const offset = i - currentIndex;
      gsap.to(img, {
        x: offset * 50,
        scale: offset === 0 ? 1 : 0.9,
        rotation: offset * 10,
        opacity: Math.abs(offset) > 2 ? 0 : 1,
        duration: 0.5,
        ease: "power3.out"
      });
    });
  }, [currentIndex, products]);

  useEffect(() => {
    if (!containerRef.current) return;

    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.fromTo(
            imageRefs.current[currentIndex],
            { opacity: 0, scale: 0.85, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power2.out" }
          );
          const content = contentRef.current?.querySelectorAll(".content-part > *");
          gsap.fromTo(
            content,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "power2.out" }
          );
        }
      },
      { threshold: 0.3 }
    );

    observer.current.observe(containerRef.current);
    return () => observer.current?.disconnect();
  }, [currentIndex]);

  const product = products[currentIndex];
  const normalize = (str) => str?.trim().toUpperCase();
  const scent = scentDetails[normalize(product.name)];

  return (
    <section
      className="showcase-product-section"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      <h2 className="showcase-product-heading">Discover Our Scents</h2>
      <div className="showcase-layout">
        {/* Image Stack */}
        <div className="image-stack">
          {products.map((prod, i) => (
            <img
              key={prod.id}
              ref={(el) => (imageRefs.current[i] = el)}
              src={prod.imageurl}
              alt={prod.name}
              className="skipper-image"
            />
          ))}
        </div>

        {/* Content */}
        <div className="content-part" ref={contentRef}>
          <h3>{product.name}</h3>
          {scent ? (
            <>
              <p className="showcase-slogan">“{scent.slogan}”</p>
              <p className="showcase-story">{scent.story}</p>
              <div className="showcase-notes-pills">
                {scent.notes.map((note, idx) => (
                  <span key={idx} className="note-pill">{note}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="showcase-description">{product.description}</p>
              {product.fragranceNotes && (
                <div className="showcase-notes-pills">
                  {product.fragranceNotes.split(",").map((note, idx) => (
                    <span key={idx} className="note-pill">{note.trim()}</span>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="showcase-nav-controls">
            <button onClick={prev}>&larr;</button>
            <div className="showcase-dots">
              {products.map((_, i) => (
                <span
                  key={i}
                  className={`showcase-dot ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
            <button onClick={next}>&rarr;</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSwipeShowcase;
