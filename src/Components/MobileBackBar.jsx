import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './MobileBackBar.css';

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

const MobileBackBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const currentTitle = pageTitles[currentPath] || 'Page';

  const handleBack = () => {
    navigate(-1);
  };

  const isMobile = window.innerWidth <= 768;

  if (!isMobile || currentPath === '/') return null;

  return (
    <div className="mobile-back-bar">
      <button className="back-btn" onClick={handleBack}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="page-title">{currentTitle}</div>
      <div style={{ width: '24px' }} /> {/* Balance layout */}
    </div>
  );
};

export default MobileBackBar;
