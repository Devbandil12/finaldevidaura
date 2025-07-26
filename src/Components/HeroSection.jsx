import React, { useState } from "react";
import BottleImage from "../assets/New folder/Adobe Express - file.png";
import BackgroundImage from "../assets/right-arrow-svgrepo-com.svg";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import "../style/style.css";

import CustomAuthModal from "./CustomAuthModal"; // You’ll create this separately

const HeroSection = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <section className="hero">
      {/* background layer */}
      <div
        className="hero__bg"
        style={{ backgroundImage: `url(${BackgroundImage})` }}
      />

      {/* content layer */}
      <div className="hero__content">
        {/* <img src={BottleImage} alt="Perfume Bottle" className="hero__bottle" /> */}

        <h1 className="hero__title">DEVID AURA</h1>
        <p className="hero__subtitle">Presence in Every Step</p>
        <p className="hero__copy">
          Immerse yourself in the art of scent—crafted for those who leave a
          lasting impression at every moment.
        </p>

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

        {/* SIGN IN BUTTON */}
        <button
          className="hero__cta"
          style={{ marginTop: "1rem" }}
          onClick={() => setAuthModalOpen(true)}
        >
          Sign In
        </button>
      </div>

      {/* Modal Component */}
      {authModalOpen && (
        <CustomAuthModal onClose={() => setAuthModalOpen(false)} />
      )}
    </section>
  );
};

export default HeroSection;
