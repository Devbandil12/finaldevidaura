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
    const sloganHTML = `Not seen, not heard — only <span class="highlight">felt</span><br>
    In every breath he <span class="highlight">leaves</span> behind.`;

    // Animate Title
    gsap.fromTo(titleRef.current,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => {
          // Typing Effect
          typeSlogan(sloganHTML, sloganRef.current, () => {
            // Animate Button
            gsap.to(buttonRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
            });

            // Animate Image
            gsap.to(imageRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              delay: 0.2,
              ease: "power2.out",
            });
          });
        },
      });

    function typeSlogan(html, container, onComplete) {
      const div = document.createElement("div");
      div.innerHTML = html;
      const nodes = Array.from(div.childNodes);

      container.innerHTML = "";
      let index = 0;

      function typeNext() {
        if (index >= nodes.length) {
          onComplete();
          return;
        }

        const node = nodes[index];
        container.appendChild(node.cloneNode(true));
        index++;
        setTimeout(typeNext, 100);
      }

      typeNext();
    }
  }, []);

  return (
    <section className="hero-bento">
      <div className="hero-left">
        <h1 className="hero-title" ref={titleRef}>DEVIDAURA</h1>
        <p className="hero-slogan" ref={sloganRef}>
          {/* slogan will be typed here */}
        </p>
        <div>
          <button className="shop-btn" ref={buttonRef}>
            Explore Collection
          </button>
        </div>
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
