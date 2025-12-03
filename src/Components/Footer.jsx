import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndConditions";
import RefundPolicy from "./RefundPolicy";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState("privacy");
  const navigate = useNavigate();

  const handleScroll = useCallback((targetId) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [navigate]);

  // ==========================================
  // 🔒 SCROLL LOCK FIX (UPDATED)
  // ==========================================
  useEffect(() => {
    if (modalOpen) {
      // 1. Calculate width of scrollbar to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // 2. Add padding to body to fill the gap
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // 3. Lock BODY and HTML (Critical for some browsers/frameworks)
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      // 4. Reset everything when closed
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    // Cleanup function to ensure scroll is restored if component unmounts
    return () => {
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [modalOpen]);

  // ==========================================
  // GSAP Animations
  // ==========================================
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".footer-brand h2", {
        y: -20, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".footer-brand", start: "top 90%" },
      });
      gsap.from(".footer-brand p", {
        y: 30, opacity: 0, duration: 0.6, ease: "power3.out",
        scrollTrigger: { trigger: ".footer-brand", start: "top 90%" },
      });
      gsap.from(".footer-link-group", {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.2, ease: "power3.out",
        scrollTrigger: { trigger: footerRef.current, start: "top 90%" },
      });
      gsap.from(".footer-social a", {
        scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)",
        scrollTrigger: { trigger: ".footer-social", start: "top 95%" },
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const openModal = (policy) => {
    setCurrentPolicy(policy);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const policyComponents = {
    privacy: <PrivacyPolicy />,
    terms: <TermsAndConditions />,
    refund: <RefundPolicy />,
  };

  const renderPolicyModal = () => {
    if (!modalOpen) return null;
    return (
      <div 
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
        onClick={closeModal}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-zinc-900 capitalize">{currentPolicy} Policy</h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
          </div>
          
          {/* Added 'overscroll-contain' to prevent scroll chaining on mobile */}
          <div className="overflow-y-auto p-6 overscroll-contain">
            {policyComponents[currentPolicy]}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <footer className="bg-gray-50 text-zinc-800" ref={footerRef}>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Brand Section */}
            <div className="footer-brand md:col-span-12 lg:col-span-5">
              <h2 className="text-3xl font-bold">Devid Aura</h2>
              <p className="mt-4 text-sm text-gray-600">
                This isn't just a perfume—it's a signature. Step in. Step out. Stay remembered.
              </p>
            </div>

            {/* Desktop Links */}
            <div className="footer-link-group hidden lg:block md:col-span-6 lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-500">About</h3>
              <div className="mt-4 space-y-4">
                <a onClick={() => handleScroll("about-section")} className="block text-sm text-gray-600 hover:text-black transition-colors cursor-pointer">Our Story</a>
              </div>
            </div>
            <div className="footer-link-group hidden lg:block md:col-span-6 lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-500">Contact</h3>
              <div className="mt-4 space-y-4">
                <a href="/contact" className="block text-sm text-gray-600 hover:text-black transition-colors">Contact Us</a>
              </div>
            </div>
            <div className="footer-link-group hidden lg:block md:col-span-12 lg:col-span-3">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-500">Policies</h3>
              <div className="mt-4 space-y-4">
                <button onClick={() => openModal("privacy")} className="block text-sm text-gray-600 hover:text-black transition-colors">Privacy Policy</button>
                <button onClick={() => openModal("terms")} className="block text-sm text-gray-600 hover:text-black transition-colors">Terms & Conditions</button>
                <button onClick={() => openModal("refund")} className="block text-sm text-gray-600 hover:text-black transition-colors">Refund Policy</button>
              </div>
            </div>

            {/* Mobile Links & Accordion */}
            <div className="space-y-4 lg:hidden md:col-span-12">
               <div className="flex gap-6 text-sm font-medium text-gray-600">
                  <a onClick={() => handleScroll("about-section")} className="hover:text-black transition-colors cursor-pointer">Our Story</a>
                  <a href="/contact" className="hover:text-black transition-colors">Contact Us</a>
               </div>
               <div className="border-t border-gray-200 pt-4">
                  <button
                    className="w-full flex justify-between items-center text-left"
                    onClick={() => setPoliciesOpen(!policiesOpen)}
                  >
                    <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-500">Policies</h3>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${policiesOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${policiesOpen ? "max-h-96 mt-4" : "max-h-0"}`}>
                      <div className="space-y-4">
                         <button onClick={() => openModal("privacy")} className="block text-sm text-gray-600 hover:text-black transition-colors">Privacy Policy</button>
                         <button onClick={() => openModal("terms")} className="block text-sm text-gray-600 hover:text-black transition-colors">Terms & Conditions</button>
                         <button onClick={() => openModal("refund")} className="block text-sm text-gray-600 hover:text-black transition-colors">Refund Policy</button>
                      </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row-reverse items-center justify-between gap-6">
            <div className="footer-social flex justify-center gap-6">
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-black transition-colors">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-black transition-colors">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-black transition-colors">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
            </div>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Devid Aura. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      {renderPolicyModal()}
    </>
  );
}