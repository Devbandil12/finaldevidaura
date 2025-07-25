import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../style/MobileBackBar.css";

const pageTitles = {
  "/login": "Login",
  "/cart": "Cart",
  "/wishlist": "Wishlist",
  "/myorder": "My Orders",
  "/checkout": "Checkout",
  "/contact": "Contact",
  "/admin": "Admin Panel",
};

const MobileBackBar = ({ isNavbarVisible }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const currentTitle = pageTitles[currentPath] || 'Page';

  const handleBack = () => navigate(-1);
  const isMobile = window.innerWidth <= 768;

  if (!isMobile || currentPath === '/') return null;

  return (
    <div
      className="mobile-back-bar"
      style={{ top: isNavbarVisible ? '50px' : '0px' }}
    >
      
      <div className="page-title">{currentTitle}</div>
</div>
  );
};

export default MobileBackBar;
