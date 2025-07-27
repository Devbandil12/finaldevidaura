import React from "react";
import { useNavigate } from "react-router-dom"; // ⬅️ For redirecting
import BottleImage from "../assets/New folder/Adobe Express - file.png";
import BackgroundImage from "../assets/right-arrow-svgrepo-com.svg";
import RightArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import "../style/style.css";

const HeroSection = () => {
  const navigate = useNavigate(); // ⬅️ Initialize router navigation

  return (
    <section className="hero">
      {/* background layer */}
      <div
        className="hero__bg"
        style={{ backgroundImage: `url(${BackgroundImage})` }}
      />

      {/* content layer */}
      <div className="hero__content">
        <h1 className="hero__title">DEVID AURA</h1>
        <p className="hero__subtitle">Presence in Every Step</p>
        <p className="hero__copy">
          Immerse yourself in the art of scent—crafted for those who leave a
          lasting impression at every moment.
        </p>

        <div className="hero__buttons">
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

          {/* Sign In button redirects to auth page */}
          <button className="hero__signin" onClick={() => navigate("/Login")}>
            Sign In
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
