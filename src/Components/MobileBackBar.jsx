// src/Components/MobileBackBar.jsx
import React, { useContext } from 'react';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { ProductContext } from "../contexts/productContext";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Package, 
  User, 
  Phone, 
  Settings, 
  FileText, 
  Shield, 
  LayoutGrid, 
  Sparkles, 
  CheckCircle,
  ShoppingBag
} from "lucide-react";

// 🟢 REMOVED: import "../style/MobileBackBar.css";

const PRODUCT_DETAIL_PATH = "/product/:productId";

const pageConfig = {
  "/login": { title: "Sign In", icon: User },
  "/cart": { title: "Your Cart", icon: ShoppingCart },
  "/wishlist": { title: "Wishlist", icon: Heart },
  "/myorder": { title: "My Orders", icon: Package },
  "/checkout": { title: "Checkout", icon: ShoppingBag },
  "/contact": { title: "Contact Us", icon: Phone },
  "/admin": { title: "Admin Panel", icon: Settings },
  "/Admin": { title: "Admin Panel", icon: Settings },
  "/products": { title: "Collection", icon: LayoutGrid },
  "/custom-combo": { title: "Build Your Combo", icon: Sparkles },
  "/myaccount": { title: "My Profile", icon: User },
  "/privacy": { title: "Privacy Policy", icon: Shield },
  "/terms": { title: "Terms & Conditions", icon: FileText },
  "/order-confirmation": { title: "Order Confirmed", icon: CheckCircle },
};

const MobileBackBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);

  const currentPath = location.pathname;
  let config = pageConfig[currentPath];
  let title = config?.title;
  let Icon = config?.icon;

  const handleBack = () => navigate(-1);

  // Logic for Dynamic Product Detail Page
  const match = matchPath(PRODUCT_DETAIL_PATH, currentPath);

  if (match && match.params.productId && !title) {
    const productId = match.params.productId;
    const product = products.find(p => p.id === productId);

    if (product) {
        title = product.name;
    } else {
        title = "Product Detail";
    }
    Icon = null;
  }

  // Fallback for other pages
  if (!title) {
      if (currentPath.includes('/product/')) {
          title = "Product Detail";
      } else if (currentPath !== '/') {
          const derived = currentPath.substring(1).charAt(0).toUpperCase() + currentPath.slice(2);
          title = derived || "Page";
      }
  }

  // Don't show on Home page
  if (currentPath === '/') return null;

  return (
    <div 
      className="
        fixed top-0 left-0 right-0 w-full h-14 px-1
        grid grid-cols-[48px_1fr_48px] items-center
        bg-white/98 backdrop-blur-md
        border-b border-black/5 shadow-sm
        z-[998] transition-transform duration-300
        md:hidden
      "
    >
      <button 
        onClick={handleBack} 
        aria-label="Go Back"
        className="
          w-12 h-12 flex items-center justify-center 
          rounded-full text-gray-900 
          active:bg-black/5 transition-colors
        "
      >
        <ArrowLeft size={24} strokeWidth={2} />
      </button>

      <div className="flex items-center justify-center gap-2 overflow-hidden w-full">
        {Icon && <Icon size={18} className="text-gray-700 shrink-0 -mt-[1px]" strokeWidth={2} />}
        <span className="text-base font-semibold text-black truncate capitalize tracking-wide font-sans">
          {title}
        </span>
      </div>

      {/* Spacer to balance grid */}
      <div className="w-12"></div>
    </div>
  );
};

export default MobileBackBar;