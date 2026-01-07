// src/pages/Footer.jsx
import React, { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram, Facebook, Twitter, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const navigate = useNavigate();
  const footerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Creative Brand Animation: 3D Staggered Reveal
      gsap.fromTo(
        ".brand-char",
        { y: 100, opacity: 0, rotateX: -90 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          stagger: 0.05,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 75%",
          },
        }
      );

      // 2. Links & Socials Fade In
      gsap.fromTo(
        [".footer-column", ".social-btn"],
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 80%",
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const brandName = "DEVID AURA".split("");

  return (
    <footer 
      ref={footerRef} 
      className="bg-white text-gray-900 pt-24 pb-10 border-t border-gray-100 relative overflow-hidden"
    >
      {/* Background Watermark - Using your imported font directly */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none opacity-[0.02] select-none flex justify-center">
         <span className="text-[15vw] font-['Cormorant_Garamond'] font-bold whitespace-nowrap">DEVID AURA</span>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* TOP SECTION: Brand & Socials */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-20">
          
          <div className="flex-1">
            {/* Animated Brand Title - Using your imported font directly */}
            <div className="flex overflow-hidden mb-6 perspective-[400px]">
              {brandName.map((char, index) => (
                <span 
                  key={index} 
                  className={`brand-char text-5xl md:text-8xl font-['Cormorant_Garamond'] font-medium inline-block text-black ${char === " " ? "w-4 md:w-8" : ""}`}
                >
                  {char}
                </span>
              ))}
            </div>
            
            <p className="footer-column text-gray-500 font-light text-lg leading-relaxed max-w-md">
              An olfactory signature. A presence unseen but always felt. 
              Crafted for those who leave a mark.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4 mt-8">
              {[
                { Icon: Instagram, link: "https://www.instagram.com/devidaura.official/?utm_source=ig_web_button_share_sheet" },
                { Icon: Facebook, link: "#" },
                { Icon: Twitter, link: "#" }
              ].map(({ Icon, link }, i) => (
                <a 
                  key={i} 
                  href={link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-btn w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all duration-300 group"
                >
                  <Icon size={20} className="group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="flex gap-12 md:gap-24 flex-wrap">
            
            {/* Shop Column */}
            <div className="footer-column min-w-[120px]">
              <h4 className="font-bold uppercase tracking-[0.15em] text-xs mb-6 text-gray-400">Discover</h4>
              <ul className="space-y-3">
                <FooterLink onClick={() => navigate('/products')} label="All Products" />
                <FooterLink onClick={() => navigate('/custom-combo')} label="Build Your Combo" highlight />
                <FooterLink onClick={() => navigate('/wishlist')} label="Wishlist" />
                <FooterLink onClick={() => navigate('/cart')} label="My Cart" />
              </ul>
            </div>

            {/* Company Column */}
            <div className="footer-column min-w-[120px]">
              <h4 className="font-bold uppercase tracking-[0.15em] text-xs mb-6 text-gray-400">Company</h4>
              <ul className="space-y-3">
                <FooterLink onClick={() => navigate('/about')} label="Our Story" />
                <FooterLink onClick={() => navigate('/contact')} label="Contact Us" />
                <FooterLink onClick={() => navigate('/myorder')} label="Track Order" />
              </ul>
            </div>

            {/* Legal Column */}
            <div className="footer-column min-w-[120px]">
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
        <div className="footer-column pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-medium tracking-wide">
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