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
    const element = sloganRef.current;
    const parts = [
      "Not seen, not heard — only ",
      "<span class='highlight'>felt</span>",
      "<br/>",
      "In every breath he ",
      "<span class='highlight'>leaves</span>",
      " behind.",
    ];

    let current = "";
    let partIndex = 0;
    const timeline = gsap.timeline();

    const typeChars = (text, delay = 0) => {
      const isHTML = text.startsWith("<");
      if (isHTML) {
        current += text;
        timeline.add(() => {
          element.innerHTML = current;
        }, `+=${delay}`);
      } else {
        const chars = text.split("");
        chars.forEach((char) => {
          timeline.add(() => {
            current += char;
            element.innerHTML = current;
          }, "+=0.03");
        });
      }
    };

    while (partIndex < parts.length) {
      typeChars(parts[partIndex++]);
    }
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
