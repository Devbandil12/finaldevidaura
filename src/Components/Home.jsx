import React, { useEffect } from "react";

// Move these imports HERE (remove them from App.jsx)
import HeroSection from "./HeroSection";
import Products from "./Products";
import ProductShowcaseCarousel from "./ProductShowcaseCarousel";
import DualMarquee from "./DualMarquee";
import TestimonialsSection from "./TestimonialsSection";
import CustomComboBuillder from "./CustomComboBuilder";
import AboutUs from "./AboutUs";

const Home = () => {
  useEffect(() => {
    // Handle scroll restoration if needed
    const target = sessionStorage.getItem("scrollToSection");
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
      sessionStorage.removeItem("scrollToSection");
    }
  }, []);

  return (
    <>
      <HeroSection />
      <DualMarquee />
      <div id="scents-section"><ProductShowcaseCarousel /></div>
      <div id="collection-section"><Products /></div>
      <div id="custom-combo-section"><CustomComboBuillder /></div>
      <div id="about-section"><AboutUs /></div>
      <TestimonialsSection />
    </>
  );
};

export default Home;