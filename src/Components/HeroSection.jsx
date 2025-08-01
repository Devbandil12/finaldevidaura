import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";
import "../style/herosection.css";
import { gsap } from "gsap";

const HeroSection = () => {
  const navigate = useNavigate();
  const brandRef = useRef();
  const taglineRef = useRef();
  const sloganRef = useRef();
  const ctaRef = useRef();
  const bottleRef = useRef();

  useEffect(() => {
    // Typewriter effect (brand)
    const brand = brandRef.current;
    const text = brand.innerText;
    brand.innerText = "";
    let index = 0;
    const typeWriter = setInterval(() => {
      if (index < text.length) {
        brand.innerText += text.charAt(index);
        index++;
      } else {
        clearInterval(typeWriter);
      }
    }, 80);

    // Animate each word in tagline
    const taglineWords = taglineRef.current.querySelectorAll("span");
    gsap.from(taglineWords, {
      opacity: 0,
      y: 20,
      stagger: 0.08,
      delay: 1.2,
      ease: "power2.out"
    });

    // Animate each word in slogan
    const sloganWords = sloganRef.current.querySelectorAll("span");
    gsap.from(sloganWords, {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      delay: 2,
      ease: "back.out(1.7)"
    });

    // CTA bounce
    gsap.from(ctaRef.current, {
      scale: 0.8,
      opacity: 0,
      duration: 0.6,
      delay: 3,
      ease: "elastic.out(1, 0.5)"
    });

    // Bottle float
    gsap.to(bottleRef.current, {
      y: -20,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Tilt on hover
    const bottle = bottleRef.current;
    bottle.addEventListener("mousemove", (e) => {
      const rect = bottle.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / 15;
      const y = (e.clientY - (rect.top + rect.height / 2)) / 15;
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

  // Utility to wrap words
  const wrapWords = (text) =>
    text.split(" ").map((word, i) => (
      <span key={i} style={{ display: "inline-block", marginRight: "0.25rem" }}>
        {word}
      </span>
    ));

  return (
    <section className="hero">
      <div className="hero__left">
        <h1 className="hero__brand" ref={brandRef}>DEVIDAURA</h1>

        <p className="hero__tagline" ref={taglineRef}>
          {wrapWords("Presence in every step")}
        </p>

        <p className="hero__slogan" ref={sloganRef}>
          {wrapWords("Not seen, not heard — only")}{" "}
          <span className="emphasis">felt</span><br />
          {wrapWords("In every breath he")}{" "}
          <span className="emphasis">leaves</span> behind.
        </p>

        <button
          className="hero__cta"
          ref={ctaRef}
          onClick={() =>
            document.getElementById("shop-section").scrollIntoView({ behavior: "smooth" })
          }
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
