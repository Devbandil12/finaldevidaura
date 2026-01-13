// src/Components/Navbar.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useContext, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Assets
import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolate.jpeg";
import MyOrderIcon from "../assets/order-svgrepo-com.svg";
import MailUsIcon from "../assets/mail-svgrepo-com.svg";
import LogOutIcon from "../assets/logout-svgrepo-com.svg";
import AdminIcon from "../assets/admin.png";
import WishlistIcon from "../assets/wishlist-svgrepo-com.svg";
import ProfileIcon from "../assets/profile-simple-svgrepo-com.svg";

// Clerk
import { useUser, useClerk } from "@clerk/clerk-react";

// Contexts
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import { NotificationContext } from "../contexts/NotificationContext";

// GSAP
import { gsap } from "gsap";

// Icons
import { BiHomeHeart } from "react-icons/bi";
import { Feather, Bell, ShoppingCart, Sparkles, Store } from "lucide-react";

// Import Custom Auth Modal
import CustomAuthModal from "./CustomAuthModal";

// --- Time Helper Functions ---
const getRelativeTimeGroup = (date, now) => {
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
  const diffInDays = Math.floor(diffInSeconds / (60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays <= 7) return "This Week";
  if (diffInDays <= 30) return "This Month";

  const diffInMonths = now.getMonth() - date.getMonth() + (12 * (now.getFullYear() - date.getFullYear()));
  if (diffInMonths <= 1) return "1 month ago";
  if (diffInMonths < 12) return `${diffInMonths} months ago`;

  const diffInYears = now.getFullYear() - date.getFullYear();
  return diffInYears <= 1 ? "1 year ago" : `${diffInYears} years ago`;
};

const timeAgo = (date, now) => {
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return getRelativeTimeGroup(date, now);
};

// --- Memoized Sidebar Item (Updated for SEO) ---
const SidebarItem = memo(({ icon: Icon, label, to, onClick, badge }) => {
  const commonClasses = "group relative flex items-center cursor-pointer py-3 px-6 transition-colors duration-200 hover:bg-[#f5f5f5] w-full text-left";
  
  const content = (
    <>
      {Icon &&
        (typeof Icon === "string" ? (
          <img
            src={Icon}
            alt=""
            aria-hidden="true"
            className="w-6 mr-4 grayscale transition-all duration-200 group-hover:grayscale-0 group-hover:scale-105"
          />
        ) : (
          <Icon
            className="w-[22px] h-[22px] mr-4 text-[#333] shrink-0 transition-all duration-200 group-hover:text-black group-hover:scale-105"
            aria-hidden="true"
            size={20}
          />
        ))}
      <span className="text-[0.95rem] text-[#333] grow shadow-none">{label}</span>
      {typeof badge === "number" && (
        <span className="text-[0.8rem] font-semibold py-[2px] px-[8px] bg-[#e0e0e0] text-[#333] rounded-[12px]" aria-hidden="true">{badge}</span>
      )}
    </>
  );

  // If 'to' prop is present, render a Link (Crawlable)
  if (to) {
    return (
      <li>
        <Link to={to} className={commonClasses} onClick={onClick}>
          {content}
        </Link>
      </li>
    );
  }

  // Otherwise render a standard list item (for actions like Log Out)
  return (
    <li
      className={commonClasses}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {content}
    </li>
  );
});

const springConfig = { type: "spring", stiffness: 500, damping: 30, mass: 1 };

const Navbar = ({ onVisibilityChange }) => {
  const { wishlist, cart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);
  const { notifications, unreadCount, markAllAsRead, clearAllNotifications } = useContext(NotificationContext);

  // State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isLoggedIn = isSignedIn;
  const navigate = useNavigate();
  const location = useLocation();

  // Refs
  const navRef = useRef(null);
  const sidebarScopeRef = useRef(null);
  const hamburgerRef = useRef(null);
  const profileWrapperRef = useRef(null);
  const notificationRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const cartCount = cart?.length || 0;
  const wishCount = wishlist?.length || 0;

  // Handlers
  const toggleProfile = useCallback(() => {
    setIsProfileOpen((prev) => {
      if (!prev) setIsNotificationOpen(false);
      return !prev;
    });
  }, []);

  const toggleNotification = useCallback(() => {
    setIsNotificationOpen((prev) => {
      if (!prev) setIsProfileOpen(false);
      return !prev;
    });
  }, []);

  const toggleSidebar = useCallback((e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setIsOpen((v) => !v);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    if (previouslyFocusedRef.current) previouslyFocusedRef.current.focus?.();
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, []);

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
    setIsOpen(false);
    setIsProfileOpen(false);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }, []);

  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const processed = notifications.map(notif => ({
      ...notif,
      date: new Date(notif.createdAt),
      timeAgo: timeAgo(new Date(notif.createdAt), now)
    }));

    return processed.reduce((groups, notif) => {
      const groupKey = getRelativeTimeGroup(notif.date, now);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notif);
      return groups;
    }, {});
  }, [notifications]);

  // --- Scroll Handler ---
  useEffect(() => {
    let lastScrollTop = 0;
    let ticking = false;

    const handleScroll = () => {
      setIsProfileOpen(prev => (prev ? false : prev));
      setIsNotificationOpen(prev => (prev ? false : prev));

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
          const scrollDelta = Math.abs(currentScroll - lastScrollTop);

          if (scrollDelta < 10) {
            ticking = false;
            return;
          }

          const isVisible = currentScroll < lastScrollTop || currentScroll < 50;

          setNavbarVisible(isVisible);
          if (onVisibilityChange) onVisibilityChange(isVisible);

          setIsScrolled(currentScroll > 50);

          lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onVisibilityChange]);

  // --- Sidebar & Auth Modal Body Lock ---
  useEffect(() => {
    if (isOpen || isAuthModalOpen) {
      if (isOpen) previouslyFocusedRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (isOpen) {
        window.setTimeout(() => {
          const el = sidebarScopeRef.current?.querySelector('button, [role="button"], a, input');
          el?.focus?.();
        }, 50);
      }
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [isOpen, isAuthModalOpen]);

  // --- Click Outside Handlers ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarScopeRef.current && !sidebarScopeRef.current.contains(event.target) && hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
        closeSidebar();
      }
      if (isProfileOpen && profileWrapperRef.current && !profileWrapperRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (isNotificationOpen && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, [isOpen, isProfileOpen, isNotificationOpen, closeSidebar]);

  // --- GSAP Entrance Animation ---
  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.set([".nav-links li", ".icons > *", ".nav-brand"], {
        willChange: "transform, opacity",
        force3D: true,
        backfaceVisibility: "hidden"
      });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".nav-brand", { y: -20, autoAlpha: 0, duration: 0.6 })
        .from(".nav-links li", { y: -20, autoAlpha: 0, duration: 0.5, stagger: 0.05 }, "-=0.4")
        .from(".icons > *", { y: -20, autoAlpha: 0, duration: 0.5, stagger: 0.05 }, "-=0.4")
        .add(() => {
          gsap.set([".nav-links li", ".icons > *", ".nav-brand"], { willChange: "auto" });
        });
    }, navRef);
    return () => ctx.revert();
  }, []);

  // --- Sidebar GSAP Animation ---
  useEffect(() => {
    if (!isOpen) return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const headerSel = ".sidebar-header";
      const itemsSel = ".sidebar-item";
      const footerSel = ".sidebar-footer";
      gsap.set([headerSel, itemsSel, footerSel], { clearProps: "all" });
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(headerSel, { y: -10, opacity: 0, duration: 0.3 })
        .from(itemsSel, { x: -20, opacity: 0, duration: 0.25, stagger: 0.04 }, "-=0.15");
      if (isLoggedIn) {
        tl.from(footerSel, { y: 20, opacity: 0, duration: 0.3 }, "-=0.1");
      }
    }, sidebarScopeRef);
    return () => ctx.revert();
  }, [isOpen, isLoggedIn]);

  const handleNavScroll = useCallback((targetId) => {
    if (window.location.pathname !== "/") {
      sessionStorage.setItem("scrollToSection", targetId);
      navigate("/");
    } else {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [navigate]);

  // 泙 UPDATED SIDEBAR LINKS (Best for use)
  const primaryLinks = useMemo(() => [
    { label: "Home", icon: BiHomeHeart, to: "/", onClick: closeSidebar },
    { label: "All Products", icon: Store, to: "/products", onClick: closeSidebar },
    { label: "Build Combo", icon: Sparkles, to: "/custom-combo", onClick: closeSidebar },
    { label: "Our Story", icon: (props) => <Feather {...props} strokeWidth={1.75} />, to: "/about", onClick: closeSidebar },
  ], [closeSidebar]);

  const accountLinks = useMemo(() => [
    ...(isLoggedIn ? [{ label: "My Orders", icon: MyOrderIcon, to: "/myorder", onClick: closeSidebar }] : []),
    { label: "Wishlist", icon: WishlistIcon, to: "/wishlist", onClick: closeSidebar, badge: wishCount },
    { label: "Cart", icon: ShoppingCart, to: "/cart", onClick: closeSidebar, badge: cartCount },
  ], [isLoggedIn, closeSidebar, wishCount, cartCount]);

  const supportLinks = useMemo(() => [
    { label: "Contact Us", icon: MailUsIcon, to: "/contact", onClick: closeSidebar },
  ], [closeSidebar]);

  // --- Dynamic Class Builders ---
  const isHomePage = location.pathname === "/";

  // Common Transition string matching CSS: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), etc.
  const navbarTransitionClass = "transition-[transform,width,border-radius,background-color,top,box-shadow,padding] duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";

  // Base Navbar Classes
  const navbarBaseClass = `fixed left-0 right-0 mx-auto flex items-center justify-between z-[9999] pointer-events-auto backface-hidden antialiased will-change-[transform,width,border-radius,background-color,top] ${navbarTransitionClass}
  ${!isHomePage ? "max-[750px]:!bg-white" : ""}`;

  // Scrolled vs Top State
  const navbarStateClass = isScrolled
    ? `w-[95%] max-w-[1440px] h-[60px] top-[10px] rounded-[50px] px-[25px] bg-white/70 backdrop-blur-[8px] saturate-[180%] border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] text-black max-[885px]:px-[0.8rem]`
    : `w-full h-[60px] top-0 px-[2rem] pt-[0.7rem] rounded-none bg-transparent max-[885px]:px-[0.8rem]`;

  // Text colors for non-scrolled state (scrolled is always black)
  const textColorClass = !isScrolled ? "text-black mix-blend-normal shadow-none" : "text-black shadow-none font-normal";

  // Icon Button Class
  const iconBtnClass = `group relative inline-flex items-center justify-center border-none bg-transparent cursor-pointer p-[8px] rounded-full transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:bg-black/6 hover:scale-115 active:scale-95 ${!isScrolled ? "text-black" : "text-black hover:bg-black/8"}`;

  return (
    <header ref={navRef} className="w-full flex justify-center items-center z-[9999]">
      <nav
        id="navbar"
        className={`${navbarBaseClass} ${navbarStateClass} ${isOpen ? "" : ""}`}
        style={{
          transform: navbarVisible ? "translateY(0)" : "translateY(-180%)",
        }}
      >
        <div className={`part-1 nav-brand flex items-center text-[1.5rem] pl-0 shrink-0 max-[885px]:text-[1.2rem] max-[700px]:text-[1rem] ${textColorClass}`}>
          {/* UPDATED: Use Link for logo */}
          <Link to="/" className="logo no-underline cursor-pointer max-[700px]:text-[1.2rem]">
            <h1 className="pl-[10px] text-[1.8rem] tracking-[0.5px] m-0 max-[885px]:text-[1.5rem] max-[300px]:text-[1.2rem] !text-black">Devid Aura</h1>
          </Link>
        </div>

        {/* Part 2: Desktop Links - Centered */}
        <div className="part-2 absolute left-1/2 -translate-x-1/2 w-auto flex items-center justify-center max-[750px]:hidden">
          <ul className="nav-links flex gap-[3rem] m-0 p-0 list-none max-[1095px]:gap-[1.2rem] max-[885px]:gap-[1.5rem]">
            {/* UPDATED: Map to Links instead of <a> with onClick */}
            {["Home", "Shop", "Build Combo", "Our Story"].map((text, idx) => {
              const paths = ["/", "/products", "/custom-combo", "/about"];
              return (
                <li key={text} className="text-[1.2rem] cursor-pointer">
                  <Link
                    to={paths[idx]}
                    className={`relative text-[16px] no-underline font-[200] !text-black transition-all
                            after:content-[''] after:absolute after:left-0 after:-bottom-[2px] after:w-0 after:h-[2px] after:transition-[width] after:duration-500 after:ease-in-out hover:after:w-full
                            ${!isScrolled ? "after:bg-black after:shadow-none" : "after:bg-black text-black"}`}
                    style={{ color: '#000000' }} // Force black as per CSS !important
                  >
                    {text}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="part-3 flex justify-end shrink-0 items-center">
          <motion.div className="icons flex items-center gap-[6px]" layout transition={springConfig}>

            <motion.div layout className="wishlist-icon flex items-center max-[750px]:hidden">
              {/* UPDATED: Direct Link for Wishlist */}
              <Link to="/wishlist" id="wishlist-icon" className={iconBtnClass} aria-label={`Wishlist (${wishCount})`}>
                <img className="w-[24px] h-[24px] object-contain brightness-0" src={WishlistIcon} alt="wishlist" />
                {wishCount > 0 && (
                  <span className="badge absolute top-[6px] right-[6px] flex items-center justify-center min-w-[10px] h-[12px] px-[3px] text-[8px] font-semibold text-white bg-black rounded-full text-center border border-white shadow-none">
                    {wishCount}
                  </span>
                )}
              </Link>
            </motion.div>

            <motion.div layout className="cart-icon flex items-center">
              {/* UPDATED: Direct Link for Cart */}
              <Link to="/cart" id="cart-icon" className={iconBtnClass} aria-label={`Cart (${cartCount})`}>
                <ShoppingCart strokeWidth={1.2} className="w-[24px] h-[24px] stroke-black text-black" />
                {cartCount > 0 && (
                  <span className="badge absolute top-[6px] right-[6px] flex items-center justify-center min-w-[10px] h-[12px] px-[3px] text-[8px] font-semibold text-white bg-black rounded-full text-center border border-white shadow-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            </motion.div>

            {isLoggedIn && (
              <motion.div layout className="notification-wrapper flex items-center" ref={notificationRef}>
                <div className="notification-icon">
                  <button onClick={toggleNotification} className={iconBtnClass} aria-label={`Notifications (${unreadCount})`}>
                    <Bell strokeWidth={1.3} className="w-[24px] h-[24px] stroke-black text-black" />
                    {unreadCount > 0 && (
                      <span className="badge absolute top-[6px] right-[6px] flex items-center justify-center min-w-[10px] h-[12px] px-[3px] text-[8px] font-semibold text-white bg-black rounded-full text-center border border-white shadow-none">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                {/* Notification Dropdown */}
                <div
                  className={`profile-content notification-dropdown absolute top-[60px] right-0 max-[750px]:right-[50px] bg-white rounded-[16px] min-w-[300px] max-w-[300px] min-h-[350px] max-h-[350px] p-0 border border-[#f0f0f0] shadow-[0_12px_32px_rgba(0,0,0,0.1)] overflow-hidden origin-top-right will-change-[transform,opacity] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[1000]
                    ${isNotificationOpen ? "opacity-100 translate-y-0 scale-100 visible" : "opacity-0 -translate-y-[10px] scale-[0.98] invisible"}`}
                  id="notificationContent"
                >
                  <div className="notification-header flex justify-between items-center p-[12px_16px] bg-[#fafafa] border-b border-[#f0f0f0a3] shadow-[0_4px_12px_rgba(53,52,52,0.055)]">
                    <h3 className="text-[14px] font-[600] text-[#1a1a1a] m-0 shadow-none !text-[#1a1a1a]">Notifications</h3>
                    <div className="buttons flex items-center gap-[8px]">
                      {unreadCount > 0 && <button onClick={markAllAsRead} className="notification-header-btn text-[11px] font-[500] bg-none border-none !text-[#007bff] cursor-pointer whitespace-nowrap p-[4px]">Mark all as read</button>}
                      {notifications.length > 0 && <button onClick={clearAllNotifications} className="notification-header-btn danger text-[11px] font-[500] bg-none border-none !text-[#dc3545] cursor-pointer whitespace-nowrap p-[4px]">Clear All</button>}
                    </div>
                  </div>
                  {/* 🟢 FIXED: added overscroll-contain to stop page scroll when list ends */}
                  <ul className="notification-list list-none m-0 p-[8px] max-h-[300px] overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <li className="notification-empty p-[20px] text-center text-[#6c757d] text-[12px] pointer-events-none"><a>No new notifications</a></li>
                    ) : (
                      Object.keys(groupedNotifications)
                        .sort((a, b) => {
                          const order = ["Today", "Yesterday", "This Week", "This Month"];
                          let aIndex = order.indexOf(a);
                          let bIndex = order.indexOf(b);
                          if (aIndex === -1) aIndex = 99; if (bIndex === -1) bIndex = 99;
                          return aIndex - bIndex;
                        })
                        .map(groupKey => (
                          <React.Fragment key={groupKey}>
                            <li className="notification-group-header p-[3px_12px] !important text-[10px] font-bold text-[#6c757d] bg-white pointer-events-none"><a>{groupKey}</a></li>
                            {groupedNotifications[groupKey].map(notif => (
                              <li
                                key={notif.id}
                                onClick={() => { navigate(notif.link || '/'); setIsNotificationOpen(false); }}
                                className={`notification-item flex items-center gap-[12px] p-[5px_12px] !important cursor-pointer transition-colors duration-200 rounded-[8px] hover:bg-[#f0f0f0]
                                ${notif.isRead ? '' : 'unread bg-[#f8f9fa]'}
                                before:text-[18px] before:leading-none before:shrink-0
                                ${notif.type === 'order' ? "before:content-['📦']" :
                                    notif.type === 'system' ? "before:content-['⚙️']" :
                                      notif.type === 'coupon' ? "before:content-['🏷️']" :
                                        "before:content-['🔔']"
                                  }`}
                                data-type={notif.type}
                              >
                                <div className="notification-item-content flex flex-col min-w-0">
                                  <span className={`notification-message text-[10px] !text-[#333] whitespace-normal break-words ${!notif.isRead ? 'font-[600] !text-black' : ''}`}>{notif.message}</span>
                                  <span className="notification-time text-[8px] !text-[#6c757d] mt-[2px]">{notif.timeAgo}</span>
                                </div>
                              </li>
                            ))}
                          </React.Fragment>
                        ))
                    )}
                  </ul>
                </div>
              </motion.div>
            )}

            <motion.div layout className="auth-item-container flex items-center justify-center min-w-[44px] max-[750px]:hidden" ref={profileWrapperRef}>
              <AnimatePresence mode="popLayout" initial={false} >
                {isLoggedIn ? (
                  <motion.div
                    key="profile-btn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="profile-wrapper flex items-center max-[750px]:hidden"
                  >
                    <div className="profile-icon" id="profile-btn">
                      {/* UPDATED: Added accessible label */}
                      <button id="profileButton" className={iconBtnClass} onClick={toggleProfile} aria-expanded={isProfileOpen} aria-label="User Profile">
                        <img src={ProfileIcon} alt="Profile" className="w-[24px] h-[24px] object-contain brightness-0" />
                      </button>
                    </div>
                    {/* Profile Dropdown Content */}
                    <div className="profile-container">
                      <div
                        className={`profile-content absolute top-[60px] right-0 bg-white rounded-[16px] min-w-[300px] p-0 border border-[#f0f0f0] shadow-[0_12px_32px_rgba(0,0,0,0.1)] overflow-hidden origin-top-right will-change-[transform,opacity] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[1000] 
                        ${isProfileOpen ? "opacity-100 translate-y-0 scale-100 visible" : "opacity-0 -translate-y-[10px] scale-[0.98] invisible"}`}
                        id="profileContent"
                      >
                        <div className="desktop-profile-info flex items-center gap-[12px] p-[16px] bg-[#fafafa] border-b border-[#f0f0f0]">
                          <img src={userdetails?.profileImage || user?.imageUrl || UserIcon} alt="User" className="mob-profile-img w-[50px] h-[50px] rounded-full object-cover border-[2px] border-white shadow-[0_0_0_1px_#e0e0e0]" />
                          <div className="user-data flex flex-col gap-[2px] items-start min-w-0">
                            <div className="user-name-role flex items-center gap-[8px]">
                              <h3 id="profile-name" className="text-[16px] font-[600] text-[#1a1a1a] m-0 shadow-none">{userdetails?.name}</h3>
                              {userdetails?.role && (
                                <span className={`user-role-badge text-[10px] font-[700] p-[3px_10px] rounded-full uppercase leading-none ${userdetails.role === "admin" ? "bg-[#fef9c3] text-[#854d0e]" : "bg-[#eef2ff] text-[#4338ca]"}`}>
                                  {userdetails.role}
                                </span>
                              )}
                            </div>
                            <p id="profile-email" className="text-[13px] text-[#666] font-[400] m-0 whitespace-nowrap overflow-hidden text-ellipsis shadow-none">{user?.primaryEmailAddress?.emailAddress || "NA"}</p>
                          </div>
                        </div>
                        <ul className="list-none m-0 p-[8px]">
                          {/* UPDATED: Use Link for dropdown items */}
                          {[
                            { icon: ProfileIcon, text: "My Account", path: "/myaccount" },
                            { icon: MyOrderIcon, text: "My Orders", path: "/myorder" },
                            { icon: MailUsIcon, text: "Contact Us", path: "/contact" }
                          ].map((item, i) => (
                            <li key={i} className="group">
                              <Link 
                                to={item.path} 
                                onClick={() => setIsProfileOpen(false)}
                                className="p-[12px] cursor-pointer transition-colors duration-200 rounded-[8px] flex items-center gap-[12px] hover:bg-[#f5f5f5] no-underline"
                              >
                                <img src={item.icon} alt="" className="w-[24px] h-[24px]" />
                                <span className="text-[#333] font-[500] text-[14px] grow shadow-none group-hover:text-black">{item.text}</span>
                              </Link>
                            </li>
                          ))}

                          {userdetails?.role === "admin" && (
                            <li className="group">
                              <Link 
                                to="/admin" 
                                onClick={() => setIsProfileOpen(false)}
                                className="p-[12px] cursor-pointer transition-colors duration-200 rounded-[8px] flex items-center gap-[12px] hover:bg-[#f5f5f5] no-underline"
                              >
                                <img src={AdminIcon} alt="" className="w-[24px] h-[24px]" />
                                <span className="text-[#333] font-[500] text-[14px] grow shadow-none group-hover:text-black">Admin Panel</span>
                              </Link>
                            </li>
                          )}
                          <li
                            className="logout mt-[8px] border-t border-[#f0f0f0] rounded-b-[8px] p-[12px] cursor-pointer transition-colors duration-200 flex items-center gap-[12px] hover:bg-[#fff1f1] group"
                            onClick={async (e) => { e.preventDefault(); await signOut({ redirectUrl: "/" }); setIsProfileOpen(false); }}
                          >
                            <a className="no-underline text-[#333] font-[500] text-[14px] grow shadow-none grayscale-[30%] transition-[filter] duration-200 group-hover:text-[#d92626] group-hover:grayscale-0">Log Out</a>
                            <img src={LogOutIcon} alt="" className="w-[24px] h-[24px] grayscale-[30%] transition-[filter] duration-200 group-hover:grayscale-0" />
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="signin-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="nav-signin-btn flex items-center gap-[8px] bg-black text-white border-none py-[8px] px-[20px] rounded-full text-[14px] font-[600] cursor-pointer transition-all duration-200 ml-[10px] whitespace-nowrap hover:bg-[#333333] hover:scale-102 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] max-[700px]:hidden"
                    onClick={openAuthModal}
                  >
                    <img src={ProfileIcon} alt="" aria-hidden="true" className="w-[18px] h-[18px] object-contain brightness-0 invert" />
                    <span>Sign In</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="part-1 text-[1.5rem] flex items-center pl-0 shrink-0 max-[885px]:text-[1.2rem] max-[750px]:text-[1rem]">
              <div className="mobile-view hidden max-[750px]:block">
                <div className="menu-icon flex items-center relative z-[99999] pr-0">
                  <button
                    ref={hamburgerRef}
                    className="hamburger-btn bg-none border-none p-0 cursor-pointer relative pointer-events-auto"
                    id="hamburger-toggle"
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                    onClick={(e) => { toggleSidebar(e); }}
                  >
                    <div className={`hamburger w-[35px] h-[25px] flex flex-col justify-between items-center transition-transform duration-500 ease-linear ${isOpen ? "active" : ""}`}>
                      <div
                        className={`line h-[3px] bg-black transition-all duration-500 ease-linear rounded-full origin-center
                        ${isOpen ? "" : "w-[17.5px] -translate-x-1/2"}`}
                        style={isOpen ? { transform: 'rotate(-135deg) translateY(-240%)', backgroundColor: 'black', width: '18.5px' } : {}}
                      />
                      <div
                        className={`line h-[3px] bg-black transition-all duration-500 ease-linear rounded-full 
                        ${isOpen ? "" : "w-[35px]"}`}
                        style={isOpen ? { transform: 'rotate(-45deg)', backgroundColor: 'black', width: '35px' } : {}}
                      />
                      <div
                        className={`line h-[3px] bg-black transition-all duration-500 ease-linear rounded-full origin-center
                        ${isOpen ? "" : "w-[17.5px] translate-x-1/2"}`}
                        style={isOpen ? { transform: 'rotate(-135deg) translateY(255%)', backgroundColor: 'black', width: '21px' } : {}}
                      />
                    </div>
                  </button>

                  {createPortal(
                    <aside
                      ref={sidebarScopeRef}
                      className={`sidebar flex flex-col justify-between fixed top-0 right-0 bottom-0 h-[100dvh] w-[70vw] max-w-[300px] bg-white text-white overflow-hidden z-[99999] pointer-events-auto shadow-[0_8px_28px_rgba(0,0,0,0.12)] mt-0 p-0 rounded-none rounded-tl-[30px] rounded-bl-[30px] will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] 
                      ${isOpen ? "translate-x-0" : "translate-x-full"}`}
                      id="sidebar"
                      role="dialog"
                      aria-modal={isOpen}
                    >
                      <div className="menu-icon flex items-center wifull p-[1rem] pl-[1.4rem] pt-[1.38rem] pb-[0.8rem] justify-start">
                        <button
                          ref={hamburgerRef}
                          className="hamburger-btn bg-none border-none p-0 cursor-pointer relative pointer-events-auto"
                          id="hamburger-toggle"
                          aria-label={isOpen ? "Close menu" : "Open menu"}
                          aria-expanded={isOpen}
                          onClick={(e) => { toggleSidebar(e); }}
                        >
                          <div className={`hamburger w-[35px] h-[25px] flex flex-col justify-between items-center transition-transform duration-500 ease-linear ${isOpen ? "active" : ""}`}>
                            <div
                              className={`line h-[3px] bg-black transition-all duration-500 ease-linear rounded-full origin-center
                        ${isOpen ? "" : "w-[17.5px] -translate-x-1/2"}`}
                              style={isOpen ? { transform: 'rotate(-135deg) translateY(-240%)', backgroundColor: 'black', width: '18.5px' } : {}}
                            />
                            <div
                              className={`line h-[3px] bg-black transition-all duration-500 ease-linear rounded-full 
                        ${isOpen ? "" : "w-[35px]"}`}
                              style={isOpen ? { transform: 'rotate(-45deg)', backgroundColor: 'black', width: '35px' } : {}}
                            />
                            <div
                              className={`line h-[3px] bg-black transition-all duration-500 ease-linear rounded-full origin-center
                        ${isOpen ? "" : "w-[17.5px] translate-x-1/2"}`}
                              style={isOpen ? { transform: 'rotate(-135deg) translateY(255%)', backgroundColor: 'black', width: '21px' } : {}}
                            />
                          </div>
                        </button>
                      </div>
                      <header className="sidebar-header pt-[0px] sticky top-0 z-[10] p-[1rem_1.5rem] border-b border-[#f0f0f0]  border-t border-[#f0f0f0] bg-white flex flex-col">
                        <div className="sidebar-top flex justify-between items-start mb-[1rem] pt-[5px]">
                          <div className="sidebar-user-details flex items-center text-left">
                            <img
                              src={isLoggedIn ? userdetails?.profileImage || user?.imageUrl || UserIcon : UserIcon}
                              alt=""
                              className="user-avatar w-[56px] h-[56px] rounded-[10%] object-cover mr-[1rem] shadow-[0_0_0_2px_#fff]"
                            />
                            <div className="user-info flex flex-col items-start text-left min-w-0">
                              <h4 className="text-[1.15rem] font-[700] m-0 !text-[#1a1a1a] leading-[1.2] break-words shadow-none">
                                {isLoggedIn ? (userdetails?.name || user?.fullName) : 'Guest'}
                              </h4>
                              <p className="user-email text-[0.8rem] !text-[#6b6b6b] m-[0.1rem_0_0_0] whitespace-nowrap max-w-full shadow-none">
                                {isLoggedIn ? user?.primaryEmailAddress?.emailAddress : 'Login'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="sidebar-actions">
                          <button
                            className={`sidebar-action-btn w-full p-[0.5rem_0.75rem] text-[0.95rem] font-[600] rounded-[16px] cursor-pointer capitalize transition-all duration-200 
                            ${isLoggedIn
                                ? 'sidebar-view-account bg-black text-white border-none hover:bg-[#333]'
                                : 'sidebar-signin bg-white text-[#222] border border-[#ccc] hover:bg-[#f5f5f5]'}`}
                            onClick={() => {
                              if (isLoggedIn) { navigate('/myaccount'); closeSidebar(); }
                              else { openAuthModal(); closeSidebar(); }
                            }}
                          >
                            {isLoggedIn ? 'View Profile' : 'Login / Sign Up'}
                          </button>
                        </div>
                      </header>

                      <nav className="sidebar-nav p-[1rem_0] grow overflow-y-auto">
                        <div className="sidebar-section mb-[1.4rem] mt-[0.5rem]">
                          <h5 className="section-title text-[0.7rem] font-[400] text-[#888] uppercase tracking-[0.5px] p-[0_1.5rem_0.5rem_1.5rem] mt-0 shadow-none">Explore</h5>
                          <ul className="list-none m-0 p-0">
                            {primaryLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} to={l.to} onClick={l.onClick} />))}
                          </ul>
                        </div>
                        <div className="sidebar-section mb-[1.4rem] mt-[0.5rem]">
                          <h5 className="section-title text-[0.7rem] font-[400] text-[#888] uppercase tracking-[0.5px] p-[0_1.5rem_0.5rem_1.5rem] mt-0 shadow-none">Account</h5>
                          <ul className="list-none m-0 p-0">
                            {accountLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} badge={l.badge} to={l.to} onClick={l.onClick} />))}
                            {isLoggedIn && userdetails?.role === 'admin' && (<SidebarItem icon={AdminIcon} label={'Admin Panel'} to={'/admin'} onClick={() => { closeSidebar(); }} />)}
                          </ul>
                        </div>
                        <div className="sidebar-section mb-[1.4rem] mt-[0.5rem]">
                          <h5 className="section-title text-[0.7rem] font-[400] text-[#888] uppercase tracking-[0.5px] p-[0_1.5rem_0.5rem_1.5rem] mt-0 shadow-none">Support</h5>
                          <ul className="list-none m-0 p-0">
                            {supportLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} to={l.to} onClick={l.onClick} />))}
                          </ul>
                        </div>
                      </nav>

                      {isLoggedIn && (
                        <footer className="sidebar-footer p-[1rem_1.5rem] border-t border-[#f0f0f0] text-left">
                          <button
                            onClick={async (e) => { e.preventDefault(); await signOut({ redirectUrl: '/' }); closeSidebar(); }}
                            className="flex items-center gap-[0.75rem] bg-none border-none text-[1rem] cursor-pointer !text-[#d11] font-[700] shadow-none"
                          >
                            <img src={LogOutIcon} alt="Log out" className="w-[20px]" />
                            <span>Log Out</span>
                          </button>
                        </footer>
                      )}
                    </aside>,
                    document.body
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>

      {isAuthModalOpen && <CustomAuthModal onClose={closeAuthModal} />}
    </header>
  );
};

export default Navbar;