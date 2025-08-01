import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../style/herosection.css";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

const HeroSection = () => {
  const sloganRef = useRef(null);
  const imageRef = useRef(null);
  const titleRef = useRef(null);
  const buttonRef = useRef(null);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    // Delay matches navbar animation time
    const timeout = setTimeout(() => setAnimationStarted(true), 900);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!animationStarted) return;

    const fullText =
      'Not seen, not heard — only <span class="highlight">felt</span><br>' +
      'In every breath he <span class="highlight">leaves</span> behind.';

    const sloganEl = sloganRef.current;
    sloganEl.innerHTML = "";

    let charIndex = 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = fullText;
    const characters = Array.from(tempDiv.textContent || "");

    const interval = setInterval(() => {
      if (charIndex < characters.length) {
        sloganEl.innerHTML += fullText.charAt(charIndex);
        charIndex++;
      } else {
        clearInterval(interval);
        gsap.fromTo(
          imageRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
        );
        gsap.fromTo(
          buttonRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out", delay: 0.3 }
        );
      }
    }, 40);

    gsap.fromTo(
      titleRef.current,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );

    return () => clearInterval(interval);
  }, [animationStarted]);

  return (
    <section className="hero-bento">
      <div className="hero-left">
        <h1 className="hero-title" ref={titleRef}>DEVIDAURA</h1>
        <p className="hero-slogan" ref={sloganRef}></p>
        <button className="shop-btn" ref={buttonRef}>Explore Collection</button>
      </div>
      <div className="hero-right">
        <img
          src={BottleImage}
          alt="Perfume Bottle"
          ref={imageRef}
          className="perfume-image"
        />
      </div>
    </section>
  );
};

export default HeroSection;
