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

import "./footer.css";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndConditions";
import RefundPolicy from "./RefundPolicy";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 600 : false
  );
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState("privacy");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
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
        gsap.from(".footer-inline-links a", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".footer-inline-links", start: "top 90%" },
        });
        gsap.from(".footer-policies", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: ".footer-policies", start: "top 85%" },
        });
      } else {
        gsap.from([".footer-links", ".footer-policies"], {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: { trigger: footerRef.current, start: "top 90%" },
        });
      }

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

  const openModal = (policy) => {
    setCurrentPolicy(policy);
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "";
  };

  const policyComponents = {
    privacy: <PrivacyPolicy />,
    terms: <TermsAndConditions />,
    refund: <RefundPolicy />,
  };

  return (
    <>
      <footer
        className={`footer ${isMobile ? "mobile" : "desktop"}`}
        ref={footerRef}
      >
        <div className="footer-grid">
          <div className="footer-brand">
            <h2>Devid Aura</h2>
            <p>
              This isn't just a perfume—it's a signature. Step in. Stand out.
              Stay remembered.
            </p>
          </div>

          {isMobile ? (
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
                  <button onClick={() => openModal("privacy")}>
                    Privacy Policy
                  </button>
                  <button onClick={() => openModal("terms")}>
                    Terms &amp; Conditions
                  </button>
                  <button onClick={() => openModal("refund")}>
                    Refund Policy
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="footer-links">
                <h4>About</h4>
                <a href="#">Our Story</a>
                <h4>Contact</h4>
                <a href="#">Contact Us</a>
              </div>
              <div className="footer-policies">
                <h4>Policies</h4>
                <button onClick={() => openModal("privacy")}>
                  Privacy Policy
                </button>
                <button onClick={() => openModal("terms")}>
                  Terms &amp; Conditions
                </button>
                <button onClick={() => openModal("refund")}>
                  Refund Policy
                </button>
              </div>
            </>
          )}
        </div>

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

        <div className="footer-copy">
          © {new Date().getFullYear()} Devid Aura. All rights reserved.
        </div>
      </footer>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={closeModal}
              aria-label="Close"
            >
              ×
            </button>
            <div className="modal-body">{policyComponents[currentPolicy]}</div>
          </div>
        </div>
      )}
    </>
  );
}
