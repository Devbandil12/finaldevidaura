import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../style/herosection.css";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

const HeroSection = () => {
  const titleRef = useRef(null);
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  const [sloganHTML, setSloganHTML] = useState("");
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    // Set initial visibility to preserve layout
    gsap.set([titleRef.current, buttonRef.current, imageRef.current], {
      opacity: 0,
      visibility: "hidden",
    });

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Animate title
    tl.to(titleRef.current, {
      opacity: 1,
      visibility: "visible",
      y: 0,
      duration: 0.6,
    });

    // Trigger slogan typing
    tl.add(() => setShowTyping(true));

    // Animate button after typing
    tl.to(buttonRef.current, {
      opacity: 1,
      visibility: "visible",
      y: 0,
      duration: 0.4,
    });

    // Animate image
    tl.to(imageRef.current, {
      opacity: 1,
      visibility: "visible",
      y: 0,
      duration: 0.6,
    });
  }, []);

  useEffect(() => {
    if (!showTyping) return;

    const fullText =
      'Not seen, not heard — only <span class="highlight">felt</span><br>In every breath he <span class="highlight">leaves</span> behind.';
    let current = "";
    let index = 0;

    const interval = setInterval(() => {
      current += fullText[index];
      setSloganHTML(current);
      index++;

      if (index >= fullText.length) clearInterval(interval);
    }, 25);

    return () => clearInterval(interval);
  }, [showTyping]);

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
        <img src={BottleImage} alt="Perfume Bottle" className="perfume-image" />
      </div>
    </section>
  );
};

export default HeroSection;
