import React, { useContext, useMemo } from "react";
import { Tag, Sparkles, Crown, Star, Diamond } from "lucide-react";
import "../style/DualMarquee.css";
import { CouponContext } from "../contexts/CouponContext";

const defaultPhrases = [
  "Timeless Elegance",
  "Pure Ingredients",
  "Unforgettable Scent",
  "Masterfully Crafted",
  "Signature Aura",
  "Bold & Beautiful", 
  "Essence of You",   
  "Luxury Redefined", 
  "Scent of Success", 
  "Art in a Bottle"   
];

// --- ⚡ PURE CSS MARQUEE ROW (Optimized) ---
const MarqueeRow = ({ items, reverse = false, className }) => {
  if (!items || items.length === 0) return null;

  // Duplicate items enough times to fill screen seamlessly
  const loopedItems = [...items, ...items, ...items, ...items];

  return (
    // Added 'pointer-events-none' to prevent any hover interaction from stopping it
    <div className={`marquee-track-wrapper pointer-events-none ${className}`}>
      <div 
        className="marquee-track" 
        style={{ 
            animationName: reverse ? "marquee-reverse" : "marquee-normal",
            animationDuration: "80s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState: "running",
            // ⚡ FIX: Promote to GPU layer to isolate layout and prevent Observer loops
            willChange: "transform",
        }}
      >
        {loopedItems.map((item, i) => {
          const isOffer = typeof item === 'object' && item.type === 'offer';
          const floatClass = i % 2 === 0 ? "float-slow" : "float-fast";
          
          const Separator = i % 4 === 0 ? <Diamond className="sep-icon" /> : 
                            (i % 3 === 0 ? <Crown className="sep-icon" /> : 
                            (i % 2 === 0 ? <Sparkles className="sep-icon" /> : <Star className="sep-icon" />));

          return (
            <div key={i} className={`marquee-item ${floatClass}`}>
              
              {isOffer ? (
                <div className="offer-stamp">
                   <div className="offer-icon-wrapper"><Tag size={12} /></div>
                   <div className="offer-main">{item.main}</div>
                   <div className="offer-sub">{item.sub}</div>
                </div>
              ) : (
                <span className="text-aesthetic">{item}</span>
              )}
              
              <div className="shape-separator">
                 {Separator}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Helper Functions (Unchanged Logic) ---
const formatOffer = (offer) => {
  const { 
    discountType, discountValue, code, minOrderValue, 
    action_buyX, action_getY, cond_requiredCategory, action_targetSize, 
    isAutomatic, description 
  } = offer;
  
  let main = "OFFER";
  let sub = "LIMITED";
  const val = discountValue || 0;

  if (discountType === 'free_item') {
      if (action_buyX && action_getY) {
          main = `BUY ${action_buyX} GET ${action_getY}`;
          sub = "FREE";
      } else if (cond_requiredCategory) {
          main = `FREE ${action_targetSize || 30}ML`;
          sub = `WITH ${cond_requiredCategory.toUpperCase()}`;
      } else {
          main = "FREE GIFT";
          sub = minOrderValue > 0 ? `ON ORDERS ₹${minOrderValue}+` : "INCLUDED";
      }
  }
  else if (discountType === 'percent') {
    main = `${val}% OFF`;
    sub = minOrderValue > 0 ? `ORDERS ₹${minOrderValue}+` : "SITEWIDE";
  }
  else if (discountType === 'flat') {
    main = `FLAT ₹${val}`;
    sub = minOrderValue > 0 ? `OFF ₹${minOrderValue}+` : "DISCOUNT";
  }
  else {
    main = description ? description.substring(0, 12).toUpperCase() : "SPECIAL";
    sub = "DEAL";
  }
  
  if (!isAutomatic && code) {
    sub = `CODE: ${code}`;
  } else if (isAutomatic) {
    sub = "AUTO-APPLIED";
  }
  
  return { main, sub, type: "offer" };
};

export default function DualMarquee() {
  const { autoOfferInstructions, availableCoupons, coupons } = useContext(CouponContext);

  const marqueeItems = useMemo(() => {
    const allOffers = [];
    const now = new Date();

    if (Array.isArray(autoOfferInstructions)) allOffers.push(...autoOfferInstructions);
    if (Array.isArray(availableCoupons)) allOffers.push(...availableCoupons);
    if (Array.isArray(coupons)) {
         const valid = coupons.filter(c => !c.isAutomatic && (!c.validUntil || new Date(c.validUntil) > now));
         allOffers.push(...valid);
    }

    if (allOffers.length > 0) {
        const uniqueMap = new Map();
        allOffers.forEach(o => {
            const fmt = formatOffer(o);
            if (!uniqueMap.has(fmt.main)) uniqueMap.set(fmt.main, fmt);
        });
        const uniqueOffers = Array.from(uniqueMap.values());

        const mixed = [];
        const max = Math.max(uniqueOffers.length, defaultPhrases.length);
        
        for(let i=0; i<max; i++) {
            if(uniqueOffers[i % uniqueOffers.length]) mixed.push(uniqueOffers[i % uniqueOffers.length]);
            if(defaultPhrases[i % defaultPhrases.length]) mixed.push(defaultPhrases[i % defaultPhrases.length]);
        }
        return mixed;
    }
    return defaultPhrases;

  }, [autoOfferInstructions, availableCoupons, coupons]);

  return (
    <section className="dual-marquee-section">
      <style>{`
        @keyframes marquee-normal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <MarqueeRow items={marqueeItems} reverse={false} className="normal" />
      <MarqueeRow 
         items={[...marqueeItems].reverse()} 
         reverse={true} 
         className="reverse" 
      />
    </section>
  );
};