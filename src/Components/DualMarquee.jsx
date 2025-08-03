import { useEffect, useRef } from "react";
import gsap from "gsap";

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

// Per-keyword custom styling
const highlightStyles = {
  refund: "bg-red-600 text-white px-1 rounded",
  trusted: "bg-green-500 text-white px-1 rounded",
  luxury: "bg-purple-600 text-white px-1 rounded",
  success: "bg-yellow-400 text-black px-1 rounded",
};

export default function DualMarquee() {
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  const topTween = useRef(null);
  const bottomTween = useRef(null);

  useEffect(() => {
    const topEl = topRef.current;
    const bottomEl = bottomRef.current;

    const topWidth = topEl.scrollWidth / 2;
    const bottomWidth = bottomEl.scrollWidth / 2;

    topTween.current = gsap.to(topEl, {
      x: -topWidth,
      duration: 30,
      ease: "linear",
      repeat: -1,
    });

    bottomTween.current = gsap.to(bottomEl, {
      x: bottomWidth,
      duration: 30,
      ease: "linear",
      repeat: -1,
    });

    return () => {
      topTween.current?.kill();
      bottomTween.current?.kill();
    };
  }, []);

  // Highlight words within the line
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

  // Handlers for pause/play
  const pauseTop = () => topTween.current?.pause();
  const resumeTop = () => topTween.current?.play();
  const pauseBottom = () => bottomTween.current?.pause();
  const resumeBottom = () => bottomTween.current?.play();

  return (
    <div className="bg-white py-6 space-y-4 text-sm font-medium text-gray-800 select-none">
      
      {/* Top Marquee (Right) */}
      <div
        className="overflow-hidden whitespace-nowrap"
        onMouseEnter={pauseTop}
        onMouseLeave={resumeTop}
        onTouchStart={pauseTop}
        onTouchEnd={resumeTop}
        onTouchCancel={resumeTop}
      >
        <div ref={topRef} className="flex gap-8 w-max">
          {[...marqueeLines, ...marqueeLines].map((line, idx) => (
            <div key={`top-${idx}`} className="px-4 py-1">
              {renderLine(line)}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Marquee (Left) */}
      <div
        className="overflow-hidden whitespace-nowrap"
        onMouseEnter={pauseBottom}
        onMouseLeave={resumeBottom}
        onTouchStart={pauseBottom}
        onTouchEnd={resumeBottom}
        onTouchCancel={resumeBottom}
      >
        <div ref={bottomRef} className="flex gap-8 w-max">
          {[...marqueeLines, ...marqueeLines].map((line, idx) => (
            <div key={`bottom-${idx}`} className="px-4 py-1">
              {renderLine(line)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
