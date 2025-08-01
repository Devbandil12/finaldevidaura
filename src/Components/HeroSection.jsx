import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottleImage from "../assets/New folder/Adobe Express - file.png";
import BackgroundImage from "../assets/right-arrow-svgrepo-com.svg";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import "../style/style.css";
import { gsap } from "gsap";

const HeroSection = () => {
  const navigate = useNavigate();

  // Refs for GSAP animations
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.from(titleRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    })
      .from(subtitleRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      }, "-=0.6")
      .from(sloganRef.current, {
        y: 30,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out",
      }, "-=0.8")
      .from(buttonRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      }, "-=1");

    // Bottle tilt on hover
    const bottle = imageRef.current;
    const handleMouseMove = (e) => {
      const { left, top, width, height } = bottle.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / 20;
      const y = (e.clientY - top - height / 2) / 20;
      gsap.to(bottle, {
        rotationY: x,
        rotationX: -y,
        ease: "power2.out",
        duration: 0.3,
      });
    };
    const resetTilt = () => {
      gsap.to(bottle, { rotationX: 0, rotationY: 0, duration: 0.4 });
    };

    bottle.addEventListener("mousemove", handleMouseMove);
    bottle.addEventListener("mouseleave", resetTilt);

    return () => {
      bottle.removeEventListener("mousemove", handleMouseMove);
      bottle.removeEventListener("mouseleave", resetTilt);
    };
  }, []);

  return (
    <section className="hero">
      {/* background layer */}
      <div
        className="hero__bg"
        style={{ backgroundImage: `url(${BackgroundImage})` }}
      />

      {/* content + image */}
      <div className="hero__content-container">
        <div className="hero__content">
          <h1 className="hero__title" ref={titleRef}>
            <span className="font-serif font-bold">DEVID</span>{" "}
            <span className="italic font-light">AURA</span>
          </h1>

          <p className="hero__subtitle" ref={subtitleRef}>
            Presence in Every Step
          </p>

          <p className="hero__copy slogan-text" ref={sloganRef}>
            <span className="thin">Not seen, not heard</span> —<br />
            only <span className="italic bold">felt</span>, in every{" "}
            <span className="caps spaced">breath</span> <br />
            he leaves behind.
          </p>

          <div className="hero__buttons" ref={buttonRef}>
            <button
              className="hero__cta"
              onClick={() =>
                document
                  .getElementById("shop-section")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              Shop Devidaura{" "}
              <img src={RightArrowIcon} alt="→" className="hero__cta-icon" />
            </button>
          </div>
        </div>

        <div className="hero__image-container">
          <img
            src={BottleImage}
            alt="Perfume"
            className="hero__image"
            ref={imageRef}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
