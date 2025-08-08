
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
  refunds: "highlight-red",
  refund: "highlight-red",
  trusted: "highlight-green",
  luxury: "highlight-purple",
  success: "highlight-yellow",
  confidence: "highlight-blue",
  expensive: "highlight-gold",
  power: "highlight-dark",
  Long-lasting: "highlight-gold",
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

  const pauseTop = () => topTween.current?.pause();
  const resumeTop = () => topTween.current?.play();
  const pauseBottom = () => bottomTween.current?.pause();
  const resumeBottom = () => bottomTween.current?.play();

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
