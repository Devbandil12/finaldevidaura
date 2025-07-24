// src/Components/MobileBackBar.js

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../style/MobileBackBar.css";

const MobileBackBar = ({ isNavbarVisible }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define readable titles for known routes
  const pageTitles = {
    "/": "Home",
    "/cart": "Cart",
    "/wishlist": "Wishlist",
    "/checkout": "Checkout",
    "/myorder": "My Orders",
    "/contact": "Contact",
    "/login": "Login",
    "/signup": "Sign Up",
    "/admin": "Admin Panel",
   
  };

  const title = pageTitles[location.pathname] || "";

  return (
    <div
      className="mobile-back-bar"
      style={{ top: isNavbarVisible ? "80px" : "0px" }} // Adjust if your navbar height differs
    >
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        ←
      </button>
      <div className="page-title">{title}</div>
      <div style={{ width: "24px" }} /> {/* Keeps title centered */}
    </div>
  );
};

export default MobileBackBar;
