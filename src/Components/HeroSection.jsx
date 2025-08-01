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

      // 1. Title Animation
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

      // 2. Typing effect for slogan (after title)
      tl.add(() => {
        typeSlogan(sloganRef.current);
      }, "+=0.1");

      // 3. Button Animation
      tl.to(
        buttonRef.current,
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "+=2.2" // delay to allow typing
      );

      // 4. Image Animation
      tl.to(
        imageRef.current,
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.3"
      );
    });

    return () => ctx.revert();
  }, []);

  const typeSlogan = (element) => {
    const fullHTML =
      'Not seen, not heard — only <span class="highlight">felt</span>\nIn every breath he <span class="highlight">leaves</span> behind.';
    const plainText = fullHTML.replace(/<[^>]+>/g, ""); // for spacing
    element.innerHTML = ""; // clear first

    let i = 0;
    const typeSpeed = 30;

    const type = () => {
      if (i <= plainText.length) {
        const visibleText = fullHTML.slice(0, i);
        const sanitized = visibleText
          .replace(/\n/g, "<br/>")
          .replace(/<[^>]+>/g, (match) =>
            match.includes("highlight") ? match : ""
          ); // Keep <span class="highlight">
        element.innerHTML = sanitized;
        i++;
        setTimeout(type, typeSpeed);
      }
    };

    type();
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
