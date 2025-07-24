// src/Components/MobileBackBar.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import "../style/MobileBackBar.css";

const pageTitles = {
  "/": "Home",
  "/login": "Login",
  "/cart": "Cart",
  "/wishlist": "Wishlist",
  "/myorder": "My Orders",
  "/checkout": "Checkout",
  "/contact": "Contact",
  "/Admin": "Admin Panel",
};

const MobileBackBar = ({ isNavbarVisible }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const title = pageTitles[currentPath] || "";

  if (currentPath === "/") return null; // Don't show on homepage

  return (
    <div
      className={`mobile-back-bar ${!isNavbarVisible ? "shift-up" : ""}`}
    >
      <button className="back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack size={24} />
      </button>
      <h2 className="page-title">{title}</h2>
      <div style={{ width: "24px" }} /> {/* Spacer to balance layout */}
    </div>
  );
};

export default MobileBackBar;
