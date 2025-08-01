import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";
import "../style/herosection.css";
import { gsap } from "gsap";

const HeroSection = () => {
  const navigate = useNavigate();
  const brandRef = useRef();
  const sloganRef = useRef();
  const bottleRef = useRef();
  const ctaRef = useRef();

  useEffect(() => {
    // Animate brand fade-in
    gsap.from(brandRef.current, {
      opacity: 0,
      y: -30,
      duration: 1.2,
      ease: "power2.out",
      delay: 0.2,
    });

    // Typing effect for slogan
    const sloganEl = sloganRef.current;
    const fullText =
      "Not seen, not heard — only felt.\nIn every breath he leaves behind.";
    let index = 0;
    sloganEl.innerHTML = "";

    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        const char = fullText[index];
        sloganEl.innerHTML += char === "\n" ? "<br/>" : char;
        index++;
      } else {
        clearInterval(typeInterval);
        // Emphasize words after typing
        emphasizeWords();
      }
    }, 50);

    // CTA fade in
    gsap.from(ctaRef.current, {
      opacity: 0,
      y: 20,
      duration: 1,
      delay: 3,
      ease: "power2.out",
    });

    // Bottle float
    gsap.to(bottleRef.current, {
      y: -15,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Tilt effect
    const bottle = bottleRef.current;
    const handleMove = (e) => {
      const rect = bottle.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / 15;
      const y = (e.clientY - rect.top - rect.height / 2) / 15;
      gsap.to(bottle, { rotationY: x, rotationX: -y, duration: 0.3 });
    };
    const resetTilt = () => {
      gsap.to(bottle, { rotationX: 0, rotationY: 0, duration: 0.4 });
    };
    bottle.addEventListener("mousemove", handleMove);
    bottle.addEventListener("mouseleave", resetTilt);

    return () => {
      bottle.removeEventListener("mousemove", handleMove);
      bottle.removeEventListener("mouseleave", resetTilt);
    };
  }, []);

  // After typing, highlight key words
  const emphasizeWords = () => {
    const el = sloganRef.current;
    el.innerHTML = el.innerHTML
      .replace("felt", `<span class="emphasis">felt</span>`)
      .replace("leaves", `<span class="emphasis">leaves</span>`);
  };

  return (
    <section className="hero">
      <div className="hero__left">
        <h1 className="hero__brand" ref={brandRef}>
          DEVIDAURA
        </h1>
        <p className="hero__slogan" ref={sloganRef}></p>
        <button
          className="hero__cta"
          ref={ctaRef}
          onClick={() =>
            document
              .getElementById("shop-section")
              .scrollIntoView({ behavior: "smooth" })
          }
        >
          Shop Now <img src={RightArrowIcon} alt="→" className="hero__cta-icon" />
        </button>
      </div>

      <div className="hero__right">
        <div className="hero__image-wrapper">
          <img
            src={BottleImage}
            alt="Perfume Bottle"
            className="hero__bottle"
            ref={bottleRef}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
