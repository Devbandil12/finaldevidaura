// src/Components/HeroSection.jsx
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import "../style/herosection.css";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

// Register the TextPlugin
gsap.registerPlugin(TextPlugin);

const HeroSection = () => {
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Pre-select the slogan and highlighted elements
      const sloganText = sloganRef.current;
      const highlightSpans = sloganRef.current.querySelectorAll('.highlight');

      // Initialize all text as empty
      gsap.set([sloganText, highlightSpans], { text: "" });

      // Build the timeline
      tl.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
      )
      .addLabel("startTyping", "+=0.2")

      // Type the first part of the slogan
      .to(sloganText, {
        duration: 1.5,
        text: "Not seen, not heard — only ",
        ease: "none"
      }, "startTyping")

      // Type the first highlighted word
      .to(highlightSpans[0], {
        duration: 0.5,
        text: "felt",
        ease: "none"
      })

      // Type the second part of the slogan
      .to(sloganText, {
        duration: 1,
        text: "Not seen, not heard — only felt\nIn every breath he ",
        ease: "none"
      })

      // Type the second highlighted word
      .to(highlightSpans[1], {
        duration: 0.5,
        text: "leaves",
        ease: "none"
      })

      // Type the final part of the slogan
      .to(sloganText, {
        duration: 0.5,
        text: "Not seen, not heard — only felt\nIn every breath he leaves behind.",
        ease: "none"
      })

      // Animate the button
      .fromTo(
        buttonRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.5"
      );
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
      <div className="hero-image" ref={imageRef}>
        <img src={BottleImage} alt="Bottle of perfume" />
      </div>
    </section>
  );
};

export default HeroSection;
