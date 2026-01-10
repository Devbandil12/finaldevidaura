// src/Components/MobileBackBar.jsx
import React, { useContext, useState, useEffect } from 'react';
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
  ShoppingBag,
  Info 
} from "lucide-react";

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
  "/about": { title: "Our Story", icon: Info },
};

const MobileBackBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);
  const [isScrolled, setIsScrolled] = useState(false);

  const currentPath = location.pathname;
  let config = pageConfig[currentPath];
  let title = config?.title;
  let Icon = config?.icon;

  // --- Scroll Logic (Copied from Navbar) ---
  useEffect(() => {
    let lastScrollTop = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
          // Threshold set to 50px like main navbar
          setIsScrolled(currentScroll > 50);
          lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // --- Dynamic Classes ---
  // Matches the animation timing and easing of the main navbar
  const transitionClass = "transition-[all] duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";
  
  // 1. Initial State (Top 0, Flat, Full Width)
  const baseClass = `fixed left-0 right-0 mx-auto grid grid-cols-[48px_1fr_48px] items-center z-[998] min-[750px]:hidden ${transitionClass}`;
  
  const stateClass = isScrolled
    ? // Scrolled: Pill Shape, Top 10px, 95% Width
      `top-[10px] w-[95%] h-[60px] rounded-[50px] px-[10px] bg-white/85 backdrop-blur-[12px] saturate-[180%] border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]`
    : // Top: Flat, Top 0, Full Width
      `top-0 w-full h-[56px] rounded-none px-1 bg-white border-b border-black/5 shadow-sm`;

  return (
    <div className={`${baseClass} ${stateClass}`}>
      <button 
        onClick={handleBack} 
        aria-label="Go Back"
        className="
          w-10 h-10 flex items-center justify-center 
          rounded-full text-black hover:bg-black/5 
          transition-colors
        "
      >
        <ArrowLeft size={22} strokeWidth={2} />
      </button>

      <div className="flex items-center justify-center gap-2 overflow-hidden w-full h-full">
        {Icon && <Icon size={18} className="text-black shrink-0" strokeWidth={2} />}
        <span className="text-[1rem] font-medium text-black truncate capitalize tracking-normal">
          {title}
        </span>
      </div>

      {/* Spacer to balance grid */}
      <div className="w-12"></div>
    </div>
  );
};

export default MobileBackBar; 