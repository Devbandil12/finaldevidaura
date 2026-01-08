// src/pages/Footer.jsx
import React, { useLayoutEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import { Instagram, Facebook, Twitter, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation(); // 1. Hook to detect route changes
  const footerRef = useRef(null);

  useLayoutEffect(() => {
    // 2. Kill all existing ScrollTriggers to prevent conflicts from previous pages
    ScrollTrigger.getAll().forEach(t => t.kill());

    let ctx;
    let resizeObserver;

    // Small delay ensures the new page has physically rendered its DOM before we calculate
    const timer = setTimeout(() => {
      if (!footerRef.current) return;

      // 3. Create the GSAP Context
      ctx = gsap.context(() => {
        
        // Force a refresh immediately to catch the new page height
        ScrollTrigger.refresh();

        // --- DEFINE ANIMATION TIMELINE ---
        const tl = gsap.timeline({ paused: true });

        tl.fromTo(
          ".brand-char",
          { filter: "blur(12px)", opacity: 0, y: 40, scale: 1.1 },
          {
            filter: "blur(0px)",
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.05,
            duration: 1.2,
            ease: "power2.out",
          }
        ).fromTo(
          [".footer-column", ".social-btn"],
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.05,
            duration: 0.8,
            ease: "power2.out",
          },
          "<"
        );

        // --- CHECK: IS FOOTER ALREADY VISIBLE? ---
        // (e.g., Short pages like Cart/Wishlist or Reloads)
        const rect = footerRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight;
        
        if (isVisible) {
          // If visible, set to end state immediately so it doesn't look "broken/hidden"
          tl.progress(1);
        }

        // --- TRIGGER 1: ENTRY (Plays when footer hits bottom of viewport) ---
        ScrollTrigger.create({
          trigger: footerRef.current,
          start: "top 85%", // Start slightly before bottom to catch fast scrolls
          end: "bottom bottom",
          onEnter: () => tl.play(),
        });

        // --- TRIGGER 2: REVERSE (Handles the "60% visible" logic) ---
        ScrollTrigger.create({
          trigger: footerRef.current,
          start: "top 30%", // Triggers well inside the viewport
          end: "bottom bottom",
          onLeaveBack: () => tl.reverse(), // Reverse only when we scroll up past this point
          onEnter: () => tl.play(),        // Play if we scroll down past this
          onEnterBack: () => tl.play(),    // Play if we scroll back down
        });

        // --- BACKGROUND PARALLAX ---
        gsap.to(".footer-watermark", {
          y: 100,
          ease: "none",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          }
        });

      }, footerRef);

      // 4. RESIZE OBSERVER (The "Home Page" Fix)
      // Watches the BODY height. If images load and push the footer down,
      // this fires and recalculates ScrollTrigger positions automatically.
      resizeObserver = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });
      resizeObserver.observe(document.body);

    }, 100); // 100ms delay to allow React Router to swap DOM

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert(); // Revert animations
      if (resizeObserver) resizeObserver.disconnect(); // Stop watching body
      ScrollTrigger.getAll().forEach(t => t.kill()); // Extra safety: Kill triggers
    };

  // 5. DEPENDENCY ARRAY: Re-run this ENTIRE effect when the route (location.pathname) changes
  }, [location.pathname]); 

  return (
    <footer
      ref={footerRef}
      className="bg-white text-gray-900 pt-24 pb-10 border-t border-gray-100 relative overflow-hidden"
    >
      {/* Background Watermark */}
      <div className="footer-watermark absolute top-0 left-1/2 -translate-x-1/2 w-full pointer-events-none opacity-[0.03] select-none flex justify-center mt-20">
        <span className="text-[18vw] font-['Cormorant_Garamond'] font-bold whitespace-nowrap leading-none">
          DEVID AURA
        </span>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        {/* TOP SECTION: Brand & Socials */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-20">
          <div className="flex-1">
            {/* Animated Brand Title */}
            <div className="flex flex-wrap mb-6 gap-x-3 sm:gap-x-6">
              {["DEVID", "AURA"].map((word, wordIndex) => (
                <div key={wordIndex} className="flex">
                  {word.split("").map((char, charIndex) => (
                    <span
                      key={`${wordIndex}-${charIndex}`}
                      className="brand-char font-['Cormorant_Garamond'] font-medium inline-block text-black opacity-0 
                                 text-5xl        /* Mobile */
                                 sm:text-6xl     /* Small Tablet */
                                 md:text-7xl     /* iPad/Tablet */
                                 lg:text-8xl     /* Laptop */
                                 xl:text-9xl"    /* Large Desktop */
                      style={{ willChange: "transform, opacity, filter" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              ))}
            </div>

            <p className="footer-column opacity-0 text-gray-500 font-light text-lg leading-relaxed max-w-md">
              An olfactory signature. A presence unseen but always felt.
              Crafted for those who leave a mark.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4 mt-8">
              {[
                { Icon: Instagram, link: "https://www.instagram.com/devidaura.official/?utm_source=ig_web_button_share_sheet" },
                { Icon: Facebook, link: "https://www.facebook.com/profile.php?id=61573374430156" },
                { Icon: Twitter, link: "https://x.com/devida89667?s=11" }
              ].map(({ Icon, link }, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn opacity-0 w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all duration-300 group"
                >
                  <Icon size={20} className="group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="flex gap-12 md:gap-24 flex-wrap">
            {/* Shop Column */}
            <div className="footer-column opacity-0 min-w-[120px]">
              <h4 className="font-bold uppercase tracking-[0.15em] text-xs mb-6 text-gray-400">Discover</h4>
              <ul className="space-y-3">
                <FooterLink onClick={() => navigate('/products')} label="All Products" />
                <FooterLink onClick={() => navigate('/custom-combo')} label="Build Your Combo" highlight />
                <FooterLink onClick={() => navigate('/wishlist')} label="Wishlist" />
                <FooterLink onClick={() => navigate('/cart')} label="My Cart" />
              </ul>
            </div>

            {/* Company Column */}
            <div className="footer-column opacity-0 min-w-[120px]">
              <h4 className="font-bold uppercase tracking-[0.15em] text-xs mb-6 text-gray-400">Company</h4>
              <ul className="space-y-3">
                <FooterLink onClick={() => navigate('/about')} label="Our Story" />
                <FooterLink onClick={() => navigate('/contact')} label="Contact Us" />
                <FooterLink onClick={() => navigate('/myorder')} label="Track Order" />
              </ul>
            </div>

            {/* Legal Column */}
            <div className="footer-column opacity-0 min-w-[120px]">
              <h4 className="font-bold uppercase tracking-[0.15em] text-xs mb-6 text-gray-400">Legal</h4>
              <ul className="space-y-3">
                <FooterLink onClick={() => navigate('/privacy')} label="Privacy Policy" />
                <FooterLink onClick={() => navigate('/terms')} label="Terms of Service" />
                <FooterLink onClick={() => navigate('/refund-policy')} label="Refund Policy" />
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="footer-column opacity-0 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-medium tracking-wide">
          <p>© {new Date().getFullYear()} Devid Aura. All rights reserved.</p>
          <div className="flex items-center gap-1 mt-3 md:mt-0 opacity-70 hover:opacity-100 transition-opacity">
            <span>Designed with Precision</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Helper Component for consistent links
const FooterLink = ({ onClick, label, highlight }) => (
  <li
    onClick={onClick}
    className={`
      group flex items-center gap-1 cursor-pointer transition-all duration-300 
      ${highlight ? "text-amber-700 font-semibold" : "text-gray-600 hover:text-black"}
    `}
  >
    <span className="relative">
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-current transition-all duration-300 group-hover:w-full"></span>
    </span>
    <ArrowUpRight
      size={12}
      className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
    />
  </li>
);