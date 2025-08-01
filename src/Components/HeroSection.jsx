import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import "../style/herosection.css";

const HeroSection = () => {
  const navigate = useNavigate();

  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });

    tl.from(titleRef.current, { y: 40, opacity: 0, duration: 1, ease: "power3.out" })
      .from(subtitleRef.current, { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
      .from(sloganRef.current, { y: 30, opacity: 0, duration: 1, ease: "power2.out" }, "-=0.6")
      .from(buttonRef.current, { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.8");
  }, []);

  return (
    <section className="hero">
      <div className="hero__container">
        {/* Left Side - Text */}
        <div className="hero__text">
          <h1 className="hero__title" ref={titleRef}>
            <span className="font-serif font-bold">DEVID</span>{" "}
            <span className="italic font-light">AURA</span>
          </h1>
          <p className="hero__subtitle" ref={subtitleRef}>
            Presence in Every Step
          </p>
          <p className="hero__slogan" ref={sloganRef}>
            <span className="thin">Not seen, not heard</span> —<br />
            only <span className="italic bold">felt</span>, in every{" "}
            <span className="caps spaced">breath</span> <br />
            he leaves behind.
          </p>
          <button
            className="hero__cta"
            onClick={() =>
              document
                .getElementById("shop-section")
                .scrollIntoView({ behavior: "smooth" })
            }
            ref={buttonRef}
          >
            Shop Devidaura{" "}
            <img src={RightArrowIcon} alt="→" className="hero__cta-icon" />
          </button>
        </div>

        {/* Right Side - Placeholder */}
        <div className="hero__image-placeholder">
          {/* This is where your generated image will go */}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
