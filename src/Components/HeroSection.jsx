// src/Components/HeroSection.jsx
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import "../style/herosection.css";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

const HeroSection = () => {
  const titleRef = useRef(null);
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Animate Title
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );

      // Start typing effect
      tl.add(() => typeSlogan(), "+=0.4");

      // Button
      tl.fromTo(
        buttonRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "+=2.5"
      );

      // Image
      tl.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
        "-=0.4"
      );
    });

    return () => ctx.revert();
  }, []);

  // Typing effect using GSAP only
  const typeSlogan = () => {
  const sloganElement = sloganRef.current;

  const rawParts = [
    { text: "Not seen, not heard — only ", highlight: false },
    { text: "felt", highlight: true },
    { text: "\n", highlight: false },
    { text: "In every breath he ", highlight: false },
    { text: "leaves", highlight: true },
    { text: " behind.", highlight: false },
  ];

  let finalHTML = "";
  let partIndex = 0;

  const typeNextPart = () => {
    if (partIndex >= rawParts.length) return;

    const { text, highlight } = rawParts[partIndex];
    const chars = text.split("");
    let charIndex = 0;
    let buffer = "";

    const typeChar = () => {
      if (charIndex < chars.length) {
        const char = chars[charIndex++];
        if (char === "\n") {
          buffer += "<br/>";
        } else {
          buffer += char;
        }

        if (highlight) {
          sloganElement.innerHTML = finalHTML + `<span class='highlight'>${buffer}</span>`;
        } else {
          sloganElement.innerHTML = finalHTML + buffer;
        }

        setTimeout(typeChar, 30);
      } else {
        if (highlight) {
          finalHTML += `<span class='highlight'>${buffer}</span>`;
        } else {
          finalHTML += buffer;
        }

        partIndex++;
        setTimeout(typeNextPart, 150);
      }
    };

    typeChar();
  };

  typeNextPart();
};




  return (
    <section className="hero-section">
      <div className="hero-content">
     

        <h1 className="hero-slogan" ref={sloganRef}></h1>

        <div className="hero-cta" ref={buttonRef}>
          <button className="shop-btn">Explore Collection</button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;