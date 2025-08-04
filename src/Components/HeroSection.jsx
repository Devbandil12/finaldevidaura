import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import "../style/herosection.css";

const HeroSection = () => {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const floatingElementsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set([titleRef.current, subtitleRef.current, ctaRef.current], {
        opacity: 0,
        y: 50
      });

      // Main timeline
      const tl = gsap.timeline();

      // Animate background gradient
      tl.to(heroRef.current, {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        duration: 2,
        ease: "power2.inOut"
      });

      // Animate title with typewriter effect
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
      }, "-=1.5");

      // Add character-by-character animation
      tl.from(titleRef.current.querySelectorAll(".char"), {
        opacity: 0,
        y: 20,
        rotationX: -90,
        stagger: 0.05,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.8");

      // Animate subtitle
      tl.to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.4");

      // Animate CTA button
      tl.to(ctaRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "-=0.2");

      // Floating elements animation
      floatingElementsRef.current.forEach((el, index) => {
        if (el) {
          gsap.to(el, {
            y: "random(-20, 20)",
            x: "random(-15, 15)",
            rotation: "random(-15, 15)",
            duration: "random(2, 4)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: index * 0.2
          });
        }
      });

      // Continuous background animation
      gsap.to(heroRef.current, {
        backgroundPosition: "200% 200%",
        duration: 10,
        repeat: -1,
        ease: "none"
      });

    });

    return () => ctx.revert();
  }, []);

  // Split text into characters for animation
  const splitText = (text) => {
    return text.split('').map((char, index) => (
      <span key={index} className="char" style={{ display: 'inline-block' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  const addToRefs = (el) => {
    if (el && !floatingElementsRef.current.includes(el)) {
      floatingElementsRef.current.push(el);
    }
  };

  return (
    <section ref={heroRef} className="hero-section">
      {/* Floating decorative elements */}
      <div className="floating-elements">
        <div ref={addToRefs} className="floating-element element-1">✨</div>
        <div ref={addToRefs} className="floating-element element-2">💫</div>
        <div ref={addToRefs} className="floating-element element-3">🌟</div>
        <div ref={addToRefs} className="floating-element element-4">✦</div>
        <div ref={addToRefs} className="floating-element element-5">⭐</div>
      </div>

      {/* Animated background particles */}
      <div className="particles">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className={`particle particle-${i % 5}`}></div>
        ))}
      </div>

      <div className="hero-content">
        <h1 ref={titleRef} className="hero-title">
          {splitText("Scent of Confidence")}
        </h1>
        
        <p ref={subtitleRef} className="hero-subtitle">
          Discover fragrances that define your essence.<br />
          <span className="highlight-text">Bold. Memorable. Uniquely You.</span>
        </p>
        
        <div ref={ctaRef} className="hero-cta">
          <button className="cta-button primary">
            <span>Explore Collection</span>
            <div className="button-glow"></div>
          </button>
          <button className="cta-button secondary">
            <span>Watch Story</span>
          </button>
        </div>
      </div>

      {/* Animated waves */}
      <div className="waves">
        <svg className="wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 C150,120 350,0 500,50 C650,100 850,0 1000,50 C1150,100 1200,50 1200,50 L1200,120 L0,120 Z"></path>
        </svg>
        <svg className="wave wave-2" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,70 C200,20 400,120 600,70 C800,20 1000,120 1200,70 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;