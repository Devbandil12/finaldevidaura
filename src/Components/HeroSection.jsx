import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import "../style/herosection.css";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

const HeroSection = () => {
  const titleRef = useRef(null);
  const sloganRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Step 1: Animate title
    timeline.fromTo(
      titleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    );

    // Step 2: Typing effect for slogan (after title)
    const fullText =
      "Not seen, not heard — only <span class='highlight'>felt</span>\nIn every breath he <span class='highlight'>leaves</span> behind.";

    const typeSlogan = async () => {
      sloganRef.current.innerHTML = ""; // Clear existing content

      const container = sloganRef.current;
      let i = 0;
      const chars = fullText.split("");

      while (i < chars.length) {
        if (chars[i] === "<") {
          // If it's a span tag, extract the whole tag
          const end = fullText.indexOf(">", i);
          const tag = fullText.slice(i, end + 1);
          const closing = fullText.indexOf("</span>", end);
          const word = fullText.slice(end + 1, closing);
          const closeTag = "</span>";

          container.innerHTML += tag + word + closeTag;
          i = closing + closeTag.length;
        } else if (chars[i] === "\n") {
          container.innerHTML += "<br />";
          i++;
        } else {
          container.innerHTML += chars[i];
          i++;
        }

        await new Promise((r) => setTimeout(r, 35));
      }
    };

    timeline.call(typeSlogan);

    // Step 3: Button fade in
    timeline.fromTo(
      buttonRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 },
      "+=1"
    );

    // Step 4: Bottle Image fade + slide in
    timeline.fromTo(
      imageRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1 },
      "-=0.4"
    );
  }, []);

  return (
    <section className="hero-bento">
      <div className="hero-left">
        <h1 className="hero-title" ref={titleRef}>
          DEVIDAURA
        </h1>
        <p className="hero-slogan" ref={sloganRef}></p>
        <button className="shop-btn" ref={buttonRef}>
          Explore Collection
        </button>
      </div>

      <div className="hero-right">
        <img
          src={BottleImage}
          alt="Perfume Bottle"
          className="perfume-image"
          ref={imageRef}
        />
      </div>
    </section>
  );
};

export default HeroSection;
