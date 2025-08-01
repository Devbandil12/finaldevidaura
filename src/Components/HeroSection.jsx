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
    // Delay after navbar completes (~900ms)
    const timeout = setTimeout(() => setAnimationStarted(true), 900);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!animationStarted) return;

    // Animate Title
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: -20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: animateSlogan,
      }
    );

    function animateSlogan() {
      const fullText =
        'Not seen, not heard — only <span class="highlight">felt</span><br>' +
        'In every breath he <span class="highlight">leaves</span> behind.';
      const target = sloganRef.current;
      target.innerHTML = "";

      let i = 0;
      const interval = setInterval(() => {
        if (i < fullText.length) {
          target.innerHTML += fullText[i];
          i++;
        } else {
          clearInterval(interval);
          // Animate Button
          gsap.fromTo(
            buttonRef.current,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              delay: 0.3,
              onComplete: () => {
                // Animate Image
                gsap.fromTo(
                  imageRef.current,
                  { opacity: 0, y: 30 },
                  {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power2.out",
                  }
                );
              },
            }
          );
        }
      }, 35);
    }
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
