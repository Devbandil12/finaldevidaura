import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import "../style/herosection.css";

const HeroSection = () => {
  const sloganRef1 = useRef(null);
  const sloganRef2 = useRef(null);
  const bottleRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    // Typing effect
    gsap.set([sloganRef1.current, sloganRef2.current], { text: "", opacity: 1 });

    tl.to(sloganRef1.current, {
      duration: 2.5,
      text: "Smell is a word",
      ease: "power1.inOut"
    })
    .to(sloganRef2.current, {
      duration: 3,
      text: "Perfume is literature",
      ease: "power1.inOut"
    }, "+=0.5");

    // Bottle animation
    gsap.from(bottleRef.current, {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: "power2.out",
      delay: 4
    });

    // CTA animation
    gsap.from(ctaRef.current, {
      scale: 0.8,
      opacity: 0,
      duration: 1,
      ease: "back.out(1.7)",
      delay: 4.8
    });

    // Mouse tilt
    const handleMouseMove = (e) => {
      const { left, top, width, height } = bottleRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width - 0.5) * 10;
      const y = ((e.clientY - top) / height - 0.5) * 10;
      bottleRef.current.style.transform = `rotateX(${-y}deg) rotateY(${x}deg) scale(1.05)`;
    };

    const resetTilt = () => {
      bottleRef.current.style.transform = "";
    };

    bottleRef.current.addEventListener("mousemove", handleMouseMove);
    bottleRef.current.addEventListener("mouseleave", resetTilt);

    return () => {
      bottleRef.current.removeEventListener("mousemove", handleMouseMove);
      bottleRef.current.removeEventListener("mouseleave", resetTilt);
    };
  }, []);

  return (
    <section className="hero">
      <div className="hero__left">
        <h1 className="hero__title">DEVIDAURA</h1>
        <p ref={sloganRef1} className="slogan-line">
          <span className="highlight">Smell</span> is a word
        </p>
        <p ref={sloganRef2} className="slogan-line">
          <span className="highlight-alt">Perfume</span> is literature
        </p>
        <button ref={ctaRef} className="hero__cta">
          Shop Now <img src={RightArrowIcon} alt="→" className="hero__cta-icon" />
        </button>
      </div>
      <div className="hero__right">
        <img
          src={BottleImage}
          alt="Devidaura Perfume Bottle"
          className="hero__bottle"
          ref={bottleRef}
        />
      </div>
    </section>
  );
};

export default HeroSection;
