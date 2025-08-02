import React, { useContext, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ProductContext } from "../contexts/productContext";
import "../style/ProductSwipeShowcase.css";

// Scent metadata
const scentDetails = {
  SHADOW: {
    slogan: "Where silence lingers longer than light.",
    story: `Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told.
    It begins with a crisp, cooling rush of peppermint and lavender, stirring curiosity. As it unfolds, earthy oakmoss and sensual sandalwood emerge, grounding the fragrance in sophistication. A warm finish of amber and musk cloaks the wearer like midnight silk.
    Best worn in evening hours, when the world slows and presence becomes power.`,
    notes: [
      "Peppermint", "Lavender Burst",
      "Oakmoss", "Geranium", "Sandalwood",
      "Amber", "Musk Facets"
    ]
  },
  SUNSET: {
    slogan: "Where golden light melts into longing.",
    story: `SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace. It opens with a vivid burst of saffron and grapefruit, laced with sage and bergamot, evoking the golden glow of dusk.
    The heart blooms with soft magnolia and jasmine, kissed by a hint of pepper — warm, intimate, alive. As it deepens, a rich foundation of oud and patchouli anchors the scent in sensual memory.
    Best worn at twilight, when the day exhales and romance begins to stir.`,
    notes: [
      "Saffron", "Sage", "Bergamot", "Grapefruit",
      "Magnolia", "Pepper", "Jasmine",
      "Oud", "Cedarwood", "Sandalwood", "Patchouli"
    ]
  },
  VIGOR: {
    slogan: "Where boldness breaks like sunrise.",
    story: `VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose. It opens in a blaze of grapefruit and pepper, charged with the cool clarity of violet leaves.
    At its core, clary sage and French lavender pulse with herbal strength, while a powerful base of amber wood and tonka grounds the composition in warmth and persistence.
    Designed for daylight hours, when ambition sharpens and confidence commands the room.`,
    notes: [
      "Grapefruit", "Violet Leaves", "Sichuan Pepper",
      "Clary Sage", "Geranium", "French Lavender",
      "Amber Wood", "Tonka Bean", "Cristal Moss"
    ]
  },
  "OUD HORIZON": {
    slogan: "Where tropics meet twilight — bold, bright, unforgettable.",
    story: `OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods. It begins with a burst of tropical exuberance: juicy mandarin, pineapple, and papaya, spiced gently by cardamom.
    A heart of sandalwood and amber follows, warm and magnetic, before settling into a complex tapestry of cedar, musk, and oud — refined, exotic, and lingering.
    Worn to make an impression, this scent is your signature when you want to arrive without speaking.`,
    notes: [
      "Mandarin Orange", "Papaya", "Bergamot", "Pineapple", "Cardamom",
      "Sandalwood", "Amber", "Musk", "Cedar", "Oakmoss",
      "Nutmeg", "Violet", "Orris Root", "Jasmine", "Lily-of-the-Valley"
    ]
  }
};

const ProductSwipeShowcase = () => {
  const { products } = useContext(ProductContext);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!products.length) return;

    const track = trackRef.current;
    const cards = track.children;
    const cardWidth = cards[0].offsetWidth;
    const totalCards = cards.length;

    gsap.set(cards, {
      x: (_, i) => i * (cardWidth + 32), // 32 = gap (2rem)
    });

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });

    tl.to(cards, {
      x: `-=${cardWidth + 32}`,
      duration: 2.5,
      modifiers: {
        x: gsap.utils.unitize((x) => {
          const wrapped = (parseFloat(x) + (cardWidth + 32) * totalCards) % ((cardWidth + 32) * totalCards);
          return wrapped;
        }),
      },
      stagger: 0,
    });

    return () => tl.kill();
  }, [products]);

  const doubledProducts = [...products, ...products]; // For seamless looping

  return (
    <section className="showcase-product-section">
      <h2 className="showcase-product-heading">Discover Our Scents</h2>
      <div className="infinite-carousel-viewport">
        <div className="infinite-carousel-track" ref={trackRef}>
          {doubledProducts.map((product, index) => {
            const name = product.name?.toUpperCase();
            const details = scentDetails[name];

            return (
              <div className="infinite-carousel-card" key={index}>
                <img
                  src={product.imageurl}
                  alt={product.name}
                  className="showcase-product-image"
                />
                <div className="showcase-card-info">
                  <h3>{product.name}</h3>
                  {details && (
                    <>
                      <p className="showcase-slogan">“{details.slogan}”</p>
                      <p className="showcase-story">{details.story}</p>
                      <div className="showcase-notes-pills">
                        {details.notes.map((note, idx) => (
                          <span key={idx} className="note-pill">{note}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {!details && (
                    <p className="showcase-description">{product.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductSwipeShowcase;
