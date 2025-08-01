import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import "../style/herosection.css";
import { gsap } from "gsap";

const HeroSection = () => {
  const navigate = useNavigate();

  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);
  const orbRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.from(titleRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    })
      .from(
        subtitleRef.current,
        {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      )
      .from(
        sloganRef.current,
        {
          y: 30,
          opacity: 0,
          duration: 1.2,
          ease: "power2.out",
        },
        "-=0.8"
      )
      .from(
        buttonRef.current,
        {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=1"
      );

    const orb = orbRef.current;
    const handleMouseMove = (e) => {
      const { left, top, width, height } = orb.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / 20;
      const y = (e.clientY - top - height / 2) / 20;
      gsap.to(orb, {
        rotationY: x,
        rotationX: -y,
        ease: "power2.out",
        duration: 0.3,
      });
    };
    const resetTilt = () => {
      gsap.to(orb, { rotationX: 0, rotationY: 0, duration: 0.4 });
    };

    orb.addEventListener("mousemove", handleMouseMove);
    orb.addEventListener("mouseleave", resetTilt);

    return () => {
      orb.removeEventListener("mousemove", handleMouseMove);
      orb.removeEventListener("mouseleave", resetTilt);
    };
  }, []);

  return (
    <section className="hero">
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

        {/* Abstract 3D Visual */}
        <div className="hero__visual-container">
          <div className="hero__orb" ref={orbRef}></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
