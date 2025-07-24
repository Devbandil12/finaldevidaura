import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "../style/MobileBackBar.css";

const routeNames = {
  "/": "Home",
  "/login": "Login",
  "/myorder": "My Orders",
  "/wishlist": "Wishlist",
  "/cart": "Cart",
  "/checkout": "Checkout",
  "/admin": "Admin Panel",
  "/contact": "Contact Us",
};

const MobileBackBar = ({ isNavbarVisible }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const pageName = routeNames[location.pathname] || "Page";

  return (
    <div
      className="mobile-back-bar"
      style={{
        top: isNavbarVisible ? "60px" : "0", // Adjust based on your navbar height
        transition: "top 0.3s ease-in-out",
      }}
    >
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <span className="page-title">{pageName}</span>
    </div>
  );
};

export default MobileBackBar;
