// src/components/Footer.jsx
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import "../style/footer.css"; // contains both .desktop and .mobile rules

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 600 : false
  );
  const [policiesOpen, setPoliciesOpen] = useState(false);

  // track viewport changes
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // GSAP animations (runs once)
  useEffect(() => {
    const ctx = gsap.context(() => {
      // brand
      gsap.from(".footer-brand h2", {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".footer-brand", start: "top 90%" },
      });
      gsap.from(".footer-brand p", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: ".footer-brand", start: "top 90%" },
      });

      if (isMobile) {
        // mobile inline links
        gsap.from(".footer-inline-links a", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".footer-inline-links", start: "top 90%" },
        });
        // accordion
        gsap.from(".footer-policies", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: ".footer-policies", start: "top 85%" },
        });
      } else {
        // desktop columns & tagline
        gsap.from([".footer-links", ".footer-policies"], {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: { trigger: footerRef.current, start: "top 90%" },
        });
      }

      // social
      gsap.from(".footer-social a", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.7)",
        scrollTrigger: { trigger: ".footer-social", start: "top 95%" },
      });
    }, footerRef);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <footer
      className={`footer ${isMobile ? "mobile" : "desktop"}`}
      ref={footerRef}
    >
      <div className="footer-grid">
        {/* Brand */}
        <div className="footer-brand">
          <h2>Devid Aura</h2>
          <p>
            This isn't just a perfume—it's a signature. Step in. Stand out. Stay
            remembered.
          </p>
        </div>

        {isMobile ? (
          // ——— mobile layout ———
          <>
            <div className="footer-inline-links">
              <a href="#">Our Story</a>
              <a href="#">Contact Us</a>
            </div>

            <div className="footer-section footer-policies">
              <button
                className="footer-toggle"
                onClick={() => setPoliciesOpen(!policiesOpen)}
                aria-expanded={policiesOpen}
              >
                <h4>Policies</h4>
                <span className={`arrow ${policiesOpen ? "open" : ""}`} />
              </button>
              <div className={`footer-content ${policiesOpen ? "open" : ""}`}>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms &amp; Conditions</a>
                <a href="#">Refund Policy</a>
              </div>
            </div>
          </>
        ) : (
          // ——— desktop layout ———
          <>
            <div className="footer-links">
              <h4>About</h4>
              <a href="#">Our Story</a>
              <h4>Contact</h4>
              <a href="#">Contact Us</a>
            </div>
            <div className="footer-policies">
              <h4>Policies</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms &amp; Conditions</a>
              <a href="#">Refund Policy</a>
            </div>
          </>
        )}
      </div>

      {/* Social icons */}
      <div className="footer-social">
        <a href="#" aria-label="Facebook">
          <FontAwesomeIcon icon={faFacebookF} />
        </a>
        <a href="#" aria-label="Instagram">
          <FontAwesomeIcon icon={faInstagram} />
        </a>
        <a href="#" aria-label="Twitter">
          <FontAwesomeIcon icon={faTwitter} />
        </a>
      </div>

      {/* Copy */}
      <div className="footer-copy">
        © {new Date().getFullYear()} Devid Aura. All rights reserved.
      </div>
    </footer>
  );
}
