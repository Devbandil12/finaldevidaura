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

      // Title animation
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

      // Typing slogan after title
      tl.add(() => {
        typeSlogan();
      }, "+=0.2");

      // Button animation
      tl.fromTo(
        buttonRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "+=2.4" // enough delay for typing to finish
      );

      // Image animation
      tl.fromTo(
        imageRef.current,
        { opacity: 0, y: 20, rotate: -3 },
        {
          opacity: 1,
          y: 0,
          rotate: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.3"
      );
    });

    return () => ctx.revert();
  }, []);

  const typeSlogan = () => {
    const sloganElement = sloganRef.current;

    const rawParts = [
      "Not seen, not heard — only ",
      "<span class='highlight'>felt</span>",
      "<br/>",
      "In every breath he ",
      "<span class='highlight'>leaves</span>",
      " behind.",
    ];

    let finalHTML = "";
    let index = 0;

    const typeNext = () => {
      if (index < rawParts.length) {
        const part = rawParts[index];
        if (part.startsWith("<")) {
          finalHTML += part;
        } else {
          const chars = part.split("");
          let charIdx = 0;
          const typeChar = () => {
            if (charIdx < chars.length) {
              finalHTML += chars[charIdx++];
              sloganElement.innerHTML = finalHTML;
              setTimeout(typeChar, 30);
            } else {
              index++;
              typeNext();
            }
          };
          typeChar();
          return;
        }
        // Delay before adding next non-typing part
        sloganElement.innerHTML = finalHTML;
        index++;
        setTimeout(typeNext, 100);
      }
    };

    typeNext();
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h2 className="hero-title" ref={titleRef}>
          DEVIDAURA
        </h2>

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
        />
      </div>
    </section>
  );
};

export default HeroSection;
