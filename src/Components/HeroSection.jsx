// src/Components/HeroSection.jsx
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../style/hero.css";
import perfumeBottle from "../assets/images/perfume-bottle.png"; // adjust to your asset

const HeroSection = () => {
  const sloganRef = useRef(null);
  const imageRef = useRef(null);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    const handleNavbarDone = () => {
      setAnimationStarted(true);
    };

    // Wait for navbar to finish animating
    window.addEventListener("navbarAnimationComplete", handleNavbarDone);
    return () => window.removeEventListener("navbarAnimationComplete", handleNavbarDone);
  }, []);

  useEffect(() => {
    if (!animationStarted) return;

    const sloganElement = sloganRef.current;
    const fullText = "Not seen, not heard — only felt\nIn every breath he leaves behind.";
    sloganElement.innerText = "";

    let charIndex = 0;
    const interval = setInterval(() => {
      if (charIndex < fullText.length) {
        sloganElement.innerText += fullText.charAt(charIndex);
        charIndex++;
      } else {
        clearInterval(interval);

        // After typing finishes, animate bottle
        gsap.fromTo(
          imageRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
        );
      }
    }, 50);

    return () => clearInterval(interval);
  }, [animationStarted]);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h2 className="hero-title">DEVIDAURA</h2>
        <p className="hero-slogan" ref={sloganRef}></p>
        <div className="hero-cta">
          <button className="shop-btn">Explore Collection</button>
        </div>
      </div>
      <div className="hero-image-wrapper">
        <img src={perfumeBottle} alt="Perfume Bottle" ref={imageRef} className="perfume-image" />
      </div>
    </section>
  );
};

export default HeroSection;
