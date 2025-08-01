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

      tl.fromTo(titleRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 });

      tl.add(() => typeSlogan(), "+=0.3");

      tl.fromTo(buttonRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, "+=2.5");

      tl.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
        "-=0.3"
      );
    });

    return () => ctx.revert();
  }, []);

  const typeSlogan = () => {
    const sloganElement = sloganRef.current;

    const parts = [
      { text: "Not seen, not heard — only ", html: false },
      { text: "<span class='highlight'>felt</span>", html: true },
      { text: "<br/>", html: true },
      { text: "In every breath he ", html: false },
      { text: "<span class='highlight'>leaves</span>", html: true },
      { text: " behind.", html: false },
    ];

    let currentHTML = "";
    let partIndex = 0;

    const typeNextPart = () => {
      if (partIndex >= parts.length) return;

      const part = parts[partIndex];
      if (part.html) {
        currentHTML += part.text;
        sloganElement.innerHTML = currentHTML;
        partIndex++;
        setTimeout(typeNextPart, 150);
      } else {
        let i = 0;
        const typeChar = () => {
          if (i < part.text.length) {
            currentHTML += part.text[i++];
            sloganElement.innerHTML = currentHTML;
            requestAnimationFrame(typeChar);
          } else {
            partIndex++;
            setTimeout(typeNextPart, 150);
          }
        };
        requestAnimationFrame(typeChar);
      }
    };

    typeNextPart();
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
