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

  const parts = [
    { text: "Not seen, not heard — only ", isHTML: false },
    { text: "<span class='highlight'>felt</span>", isHTML: true },
    { text: "<br/>", isHTML: true },
    { text: "In every breath he ", isHTML: false },
    { text: "<span class='highlight'>leaves</span>", isHTML: true },
    { text: " behind.", isHTML: false },
  ];

  let currentHTML = "";
  let partIndex = 0;

  const typePart = () => {
    if (partIndex >= parts.length) return;

    const part = parts[partIndex];

    if (part.isHTML) {
      // Append HTML as a block (after text is typed)
      currentHTML += part.text;
      sloganElement.innerHTML = currentHTML;
      partIndex++;
      setTimeout(typePart, 300); // Delay before next part
    } else {
      let i = 0;

      const typeChar = () => {
        if (i < part.text.length) {
          currentHTML += part.text[i++];
          sloganElement.innerHTML = currentHTML;
          setTimeout(typeChar, 30);
        } else {
          partIndex++;
          setTimeout(typePart, 100);
        }
      };

      typeChar();
    }
  };

  typePart();
};

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title" ref={titleRef}>
          DEVIDAURA
        </h1>

        <p className="hero-slogan" ref={sloganRef}></p>

        <div className="hero-cta" ref={buttonRef}>
          <button className="shop-btn">Explore Collection</button>
        </div>
      </div>

      <div className="hero-image-wrapper" ref={imageRef}>
        <img
          src={BottleImage}
          alt="Perfume Bottle"
          className="perfume-image"
          loading="lazy"
        />
      </div>
    </section>
  );
};

export default HeroSection;
