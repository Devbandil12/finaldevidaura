import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import BottleImage from "../assets/devidaura_bottle.png";
import "../style/hero.css";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const HeroSection = () => {
  const navigate = useNavigate();
  const brandRef = useRef();
  const taglineRef = useRef();
  const sloganRef = useRef();
  const ctaRef = useRef();
  const bottleRef = useRef();

  useEffect(() => {
    // Typewriter effect for brand
    const brandText = brandRef.current;
    gsap.from(brandText, {
      text: "",
      duration: 1.5,
      delay: 0.5,
      ease: "none",
      textProps: { value: brandText.textContent },
      onComplete: () => brandText.textContent = brandText.textContent
    });

    // Stagger fade-in tagline and slogan words
    const split = new SplitText(taglineRef.current, { type: "words" });
    gsap.from(split.words, {
      duration: 0.8,
      opacity: 0,
      y: 20,
      stagger: 0.1,
      delay: 2
    });

    const sloganSplit = new SplitText(sloganRef.current, { type: "words,chars" });
    gsap.from(sloganSplit.words, {
      duration: 1,
      opacity: 0,
      y: 30,
      rotationX: -15,
      stagger: 0.08,
      delay: 2.6,
      ease: "back.out(2)"
    });

    // CTA bounce effect
    gsap.from(ctaRef.current, {
      scale: 0.8,
      opacity: 0,
      duration: 0.6,
      delay: 3.5,
      ease: "elastic.out(1, 0.5)"
    });

    // Bottle float + hover tilt
    gsap.to(bottleRef.current, {
      y: -20,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    const bottle = bottleRef.current;
    bottle.addEventListener("mousemove", (e) => {
      const rect = bottle.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / 20;
      const y = (e.clientY - (rect.top + rect.height / 2)) / 20;
      gsap.to(bottle, {
        rotationY: x,
        rotationX: -y,
        duration: 0.3,
        ease: "power2.out"
      });
    });
    bottle.addEventListener("mouseleave", () => {
      gsap.to(bottle, { rotationX: 0, rotationY: 0, duration: 0.4 });
    });

    return () => bottle.removeEventListener("mousemove");
  }, []);

  return (
    <section className="hero">
      <div className="hero__left">
        <h1 className="hero__brand" ref={brandRef}>DEVIDAURA</h1>
        <p className="hero__tagline" ref={taglineRef}>Presence in every step</p>

        <p className="hero__slogan" ref={sloganRef}>
          Not seen, not heard — only <span className="emphasis">felt</span><br />
          In every breath he <span className="emphasis">leaves</span> behind.
        </p>

        <button
          className="hero__cta"
          ref={ctaRef}
          onClick={() => document.getElementById("shop-section").scrollIntoView({ behavior: "smooth" })}
        >
          Shop Now <img src={RightArrowIcon} alt="→" className="hero__cta-icon" />
        </button>
      </div>

      <div className="hero__right">
        <div className="hero__image-wrapper">
          <img src={BottleImage} alt="Perfume Bottle" className="hero__bottle" ref={bottleRef} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
