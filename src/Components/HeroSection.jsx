import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../style/herosection.css";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

const HeroSection = () => {
  const titleRef = useRef(null);
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  const [showSlogan, setShowSlogan] = useState(false);
  const [sloganHTML, setSloganHTML] = useState("");

  useEffect(() => {
    const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Animate title
    timeline.from(titleRef.current, {
      y: -20,
      autoAlpha: 0,
      duration: 0.6,
    });

    // After title animation complete, show slogan typing
    timeline.add(() => setShowSlogan(true));

    // Animate button
    timeline.from(buttonRef.current, {
      y: 10,
      autoAlpha: 0,
      duration: 0.4,
    });

    // Animate image
    timeline.from(imageRef.current, {
      y: 30,
      autoAlpha: 0,
      duration: 0.6,
    });
  }, []);

  useEffect(() => {
    if (!showSlogan) return;

    const fullText = `Not seen, not heard — only <span class="highlight">felt</span><br>In every breath he <span class="highlight">leaves</span> behind.`;
    let current = "";
    let i = 0;
    const typingInterval = setInterval(() => {
      current += fullText[i];
      setSloganHTML(current);
      i++;
      if (i === fullText.length) clearInterval(typingInterval);
    }, 25);

    return () => clearInterval(typingInterval);
  }, [showSlogan]);

  return (
    <section className="hero-bento">
      <div className="hero-left">
        <h2 className="hero-title" ref={titleRef}>
          DEVIDAURA
        </h2>

        <p
          className="hero-slogan"
          ref={sloganRef}
          dangerouslySetInnerHTML={{ __html: sloganHTML }}
        ></p>

        <button className="shop-btn" ref={buttonRef}>
          Explore Collection
        </button>
      </div>

      <div className="hero-right" ref={imageRef}>
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
