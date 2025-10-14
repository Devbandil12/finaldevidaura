import { useEffect, useRef } from "react";
import gsap from "gsap";
import "../style/DualMarquee.css";

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

const highlightStyles = {
  trusted: "highlight-green",
  success: "highlight-yellow",
  confidence: "highlight-blue",
  Honesty: "highlight-blue",
  power: "highlight-dark",
  luxury: "highlight-purple",
  Memorable: "highlight-purple",
  "Long-lasting": "highlight-gold",
  day: "highlight-gold",
  last: "highlight-gray",
  expensive: "highlight-gold",
  less: "highlight-green",
  bold: "highlight-maroon",
  Masculine: "highlight-dark",
  smart: "highlight-blue",
  tech: "highlight-blue",
  refunds: "highlight-blue",
  refund: "highlight-blue",
  stress: "highlight-red",
  drama: "highlight-orange",
  Instant: "highlight-cyan",
  Tested: "highlight-green",
  Verified: "highlight-green",
  Approved: "highlight-green",
};

export default function DualMarquee() {
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const topTween = useRef(null);
  const bottomTween = useRef(null);

  // Create left-moving marquee
  const createLeftMarquee = (element, width, duration) => {
    return gsap.fromTo(
      element,
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
  const createRightMarquee = (element, width, duration) => {
    return gsap.fromTo(
      element,
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

    // 🧮 Base speed multiplier (smaller = slower)
    const baseSpeed = 0.009;

    // Dynamically calculate duration based on width
    const topDuration = topWidth * baseSpeed;
    const bottomDuration = bottomWidth * baseSpeed;

    // Start animations
    topTween.current = createLeftMarquee(topEl, topWidth, topDuration);
    bottomTween.current = createRightMarquee(bottomEl, bottomWidth, bottomDuration);

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

  return (
    <div className="dual-marquee-container">
      {/* Top Marquee - Moving Left */}
      <div className="marquee-wrapper">
        <div ref={topRef} className="marquee-content">
          {[...marqueeLines, ...marqueeLines, ...marqueeLines].map((line, idx) => (
            <div key={`top-${idx}`} className="marquee-line">
              {renderLine(line)}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Marquee - Moving Right */}
      <div className="marquee-wrapper bottom-marquee">
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
