import { useEffect, useRef } from "react";
import gsap from "gsap";
import "../style/DualMarquee.css"; // Import CSS

// Lines to display in the marquee
const marqueeLines = [
  "• Built for confidence. Made to last.",
  "• For him. For her. For anyone who smells success.",
  "• Smell expensive. Pay less.",
  "• Tested. Trusted. Refunds, no drama.",
  "• Long-lasting scents. Instant refunds. Zero stress.",
  "• Where bold scent meets smart tech.",
  "• Masculine. Memorable. Made right.",
  "• Smell like power. Stay all day.",
  "• Verified by Razorpay. Approved by noses everywhere.",
  "• Luxury in a bottle. Honesty in every transaction."
];

// Highlight styles per keyword
const highlightStyles = {
  refund: "highlight-red",
  trusted: "highlight-green",
  luxury: "highlight-purple",
  success: "highlight-yellow",
};

export default function DualMarquee() {
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  const topTween = useRef(null);
  const bottomTween = useRef(null);

  useEffect(() => {
    const topEl = topRef.current;
    const bottomEl = bottomRef.current;

    // Use scrollWidth directly
    const topWidth = topEl.scrollWidth;
    const bottomWidth = bottomEl.scrollWidth;

    topTween.current = gsap.to(topEl, {
      x: -topWidth / 2,
      duration: 30,
      ease: "linear",
      repeat: -1,
    });

    bottomTween.current = gsap.fromTo(
  bottomEl,
  { x: -bottomWidth / 2 }, // Start from off-screen left
  {
    x: bottomWidth / 2,    // Move to off-screen right
    duration: 40,
    ease: "linear",
    repeat: -1,
  }
);


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
      {/* Top Marquee */}
      <div
        className="marquee-wrapper"
        onMouseEnter={pauseTop}
        onMouseLeave={resumeTop}
        onTouchStart={pauseTop}
        onTouchEnd={resumeTop}
        onTouchCancel={resumeTop}
      >
        <div ref={topRef} className="marquee-content">
          {[...marqueeLines, ...marqueeLines].map((line, idx) => (
            <div key={`top-${idx}`} className="marquee-line">
              {renderLine(line)}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Marquee */}
      <div
        className="marquee-wrapper"
        onMouseEnter={pauseBottom}
        onMouseLeave={resumeBottom}
        onTouchStart={pauseBottom}
        onTouchEnd={resumeBottom}
        onTouchCancel={resumeBottom}
      >
        <div ref={bottomRef} className="marquee-content reverse">
          {[...marqueeLines, ...marqueeLines].map((line, idx) => (
            <div key={`bottom-${idx}`} className="marquee-line">
              {renderLine(line)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
