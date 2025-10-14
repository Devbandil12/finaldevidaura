
import { useEffect, useRef } from "react";
import gsap from "gsap";
import "../style/DualMarquee.css";

// Marquee lines
const marqueeLines = [
  "• Built for confidence Made to last",
  "• For him For her For anyone who smells success",
  "• Smell expensive Pay less.",
  "• Tested Trusted Refunds no drama",
  "• Long-lasting scents Instant refunds Zero stress",
  "• Where bold scent meets smart tech",
  "• Masculine. Memorable Made right",
  "• Smell like power Stay all day",
  "• Verified by Razorpay Approved by noses everywhere",
  "• Luxury in a bottle Honesty in every transaction"
];

// Highlight styles mapping
const highlightStyles = {
  // --- Core Brand Concepts ---
  trusted: "highlight-green",      // Green for safety and trust
  success: "highlight-yellow",     // Yellow/Gold for achievement
  confidence: "highlight-blue",      // Blue for stability and trust
  Honesty: "highlight-blue",       // Blue for integrity and trust
  power: "highlight-dark",         // Dark for strength and authority
  luxury: "highlight-purple",      // Purple for premium and high quality
  Memorable: "highlight-purple",   // Purple is distinctive and rich

  // --- Product Features & Benefits ---
  "Long-lasting": "highlight-gold",// Gold for quality and value
  day: "highlight-gold",           // Complements "Long-lasting"
  last: "highlight-gray",        // Neutral gray for durability
  expensive: "highlight-gold",     // Gold for high value
  less: "highlight-green",         // Green for savings and money
  bold: "highlight-maroon",      // Deep red for a strong, confident scent
  Masculine: "highlight-dark",     // Complements "power"
  smart: "highlight-blue",         // Blue for intelligence and tech
  tech: "highlight-blue",          // Complements "smart"
  
  // --- Trust & Policy Keywords ---
  // CHANGED: Red can imply a warning. Blue aligns refunds with trust and honesty.
  refunds: "highlight-blue",
  refund: "highlight-blue",
  
  stress: "highlight-red",         // Red correctly highlights the negative word being solved ("Zero stress")
  drama: "highlight-orange",       // Orange correctly highlights the problem being solved ("no drama")
  Instant: "highlight-cyan",       // Bright, energetic color for speed
  Tested: "highlight-green",       // Green for "pass" / "safe"
  Verified: "highlight-green",     // Green for "pass" / "safe"
  Approved: "highlight-green",     // Green for "pass" / "safe"
};

export default function DualMarquee() {
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const topTween = useRef(null);
  const bottomTween = useRef(null);

  // Create left-moving marquee
  const createLeftMarquee = (element, width, duration = 50) => {
    return gsap.fromTo(element, 
      { x: 0 },
      {
        x: -width / 2,
        duration,
        ease: "none",
        repeat: -1,
      }
    );
  };

  // Create right-moving marquee (opposite direction)
  const createRightMarquee = (element, width, duration = 50) => {
    return gsap.fromTo(element,
      { x: -width / 2 },
      {
        x: 0,
        duration,
        ease: "none",
        repeat: -1,
      }
    );
  };

  useEffect(() => {
    const topEl = topRef.current;
    const bottomEl = bottomRef.current;

    if (!topEl || !bottomEl) return;

    const topWidth = topEl.scrollWidth;
    const bottomWidth = bottomEl.scrollWidth;

    // Top marquee moves left
    topTween.current = createLeftMarquee(topEl, topWidth, 60);
    // Bottom marquee moves right
    bottomTween.current = createRightMarquee(bottomEl, bottomWidth, 60);

    return () => {
      topTween.current?.kill();
      bottomTween.current?.kill();
    };
  }, []);

  const renderLine = (line) => {
    const regex = new RegExp(`\\b(${Object.keys(highlightStyles).join("|")})\\b`, "gi");
    const parts = line.split(regex);

    return parts.map((part, i) => {
      const key = Object.keys(highlightStyles).find(
        (word) => word.toLowerCase() === part.toLowerCase()
      );
      return (
        <span key={i} className={key ? highlightStyles[key] : ""}>
          {part}
        </span>
      );
    });
  };

 // Slow down marquee on hover instead of pausing
const slowDown = (tween) => tween?.timeScale(0.1); // 10% speed
const speedUp = (tween) => tween?.timeScale(1);    // normal speed

const pauseTop = () => slowDown(topTween.current);
const resumeTop = () => speedUp(topTween.current);
const pauseBottom = () => slowDown(bottomTween.current);
const resumeBottom = () => speedUp(bottomTween.current);

  return (
    <div className="dual-marquee-container">
      {/* Top Marquee - Moving Left */}
      <div
        className="marquee-wrapper"
        onMouseEnter={pauseTop}
        onMouseLeave={resumeTop}
        onTouchStart={pauseTop}
        onTouchEnd={resumeTop}
        onTouchCancel={resumeTop}
      >
        <div ref={topRef} className="marquee-content">
          {[...marqueeLines, ...marqueeLines, ...marqueeLines].map((line, idx) => (
            <div key={`top-${idx}`} className="marquee-line">
              {renderLine(line)}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Marquee - Moving Right */}
      <div
        className="marquee-wrapper bottom-marquee"
        onMouseEnter={pauseBottom}
        onMouseLeave={resumeBottom}
        onTouchStart={pauseBottom}
        onTouchEnd={resumeBottom}
        onTouchCancel={resumeBottom}
      >
        <div ref={bottomRef} className="marquee-content reverse-direction">
          {[...marqueeLines, ...marqueeLines, ...marqueeLines].map((line, idx) => (
            <div key={`bottom-${idx}`} className="marquee-line">
              {renderLine(line)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
