// src/Components/MobileBackBar.jsx
import React, { useContext } from 'react'; // 🟢 ADDED: useContext
import { useLocation, useNavigate, matchPath } from 'react-router-dom'; // 🟢 ADDED: matchPath
import { ProductContext } from "../contexts/productContext"; // 🟢 ADDED: ProductContext
import "../style/MobileBackBar.css";

// 🟢 NEW: Product Detail Route Pattern
const PRODUCT_DETAIL_PATH = "/product/:productId";

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
  // 🟢 NEW: Get products from context
  const { products } = useContext(ProductContext); 

  const currentPath = location.pathname;
  let currentTitle = pageTitles[currentPath];

  const handleBack = () => navigate(-1);
  const isMobile = window.innerWidth <= 768;

  // 🟢 NEW: Logic to determine if it's the Product Detail Page
  const match = matchPath(PRODUCT_DETAIL_PATH, currentPath);

  if (match && match.params.productId && !currentTitle) {
    // This is the Product Detail page, try to find the product name
    const productId = match.params.productId;
    const product = products.find(p => p.id === productId);

    if (product) {
        currentTitle = product.name;
    } else {
        // Fallback title while product is loading or not found
        currentTitle = "Product Detail";
    }
  }

  // Fallback for other pages not in pageTitles
  if (!currentTitle && currentPath.includes('/product/')) {
      currentTitle = "Product Detail";
  } else if (!currentTitle && currentPath !== '/') {
      // Default for other non-home, non-product dynamic routes like /myaccount
      currentTitle = "Page"; 
  }


  if (!isMobile || currentPath === '/') return null;

  return (
    <div className="mobile-back-bar"
      style={{ top: isNavbarVisible ? '50px' : '0px' }}
    >
      <button className="back-btn" onClick={handleBack}>
        <svg
          width="28"
          height="28"
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
</div>
  );
};

export default MobileBackBar;