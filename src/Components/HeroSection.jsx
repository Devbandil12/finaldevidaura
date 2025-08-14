// src/Components/HeroSection.jsx
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import "../style/herosection.css";

// Register the TextPlugin
gsap.registerPlugin(TextPlugin);

const HeroSection = () => {
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true, // Start paused to ensure everything is set up
        defaults: { ease: "power2.out" }
      });

      // Pre-select the slogan and highlighted elements
      const sloganText = sloganRef.current;
      const highlightSpans = sloganRef.current.querySelectorAll('.highlight');
      const staticSpans = sloganRef.current.querySelectorAll('.static-text');

      // Initialize all text as empty to prepare for the typing animation
      gsap.set(sloganText, { text: "" });

      // Build the timeline
      tl.to(imageRef.current, { opacity: 1, scale: 1, duration: 1.2 }, 0)
        .addLabel("startTyping", "-=0.5") // Label to start typing after image fade

        // Typing effect for the slogan
        .to(sloganText, {
          duration: 1,
          text: staticSpans[0].textContent,
          ease: "none"
        }, "startTyping")

        .to(highlightSpans[0], {
          duration: 0.5,
          text: "felt",
          ease: "none"
        })

        .to(sloganText, {
          duration: 1,
          text: staticSpans[0].textContent + highlightSpans[0].textContent + staticSpans[1].textContent,
          ease: "none"
        })

        .to(highlightSpans[1], {
          duration: 0.5,
          text: "leaves",
          ease: "none"
        })

        .to(sloganText, {
          duration: 0.5,
          text: sloganText.textContent + staticSpans[2].textContent,
          ease: "none"
        })

        // Animate the button after the typing is complete
        .fromTo(
          buttonRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        );

      tl.play(); // Play the timeline after it's fully built
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-slogan" ref={sloganRef}>
          <span className="static-text">Not seen, not heard — only </span>
          <span className="highlight"></span>
          <span className="static-text">
            <br />
            In every breath he 
          </span>
          <span className="highlight"></span>
          <span className="static-text"> behind.</span>
        </h1>
        <div className="hero-cta" ref={buttonRef}>
          <button className="shop-btn">Explore Collection</button>
        </div>
      </div>
     
    </section>
  );
};

export default HeroSection;
