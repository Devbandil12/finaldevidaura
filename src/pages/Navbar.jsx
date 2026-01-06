// File: src/Components/Navbar.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useContext, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Assets
import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolated.png";
import MyOrderIcon from "../assets/order-svgrepo-com.svg";
import MailUsIcon from "../assets/mail-svgrepo-com.svg";
import LogOutIcon from "../assets/logout-svgrepo-com.svg";
import AdminIcon from "../assets/admin.png";
import WishlistIcon from "../assets/wishlist-svgrepo-com.svg";
import ProfileIcon from "../assets/profile-simple-svgrepo-com.svg";

// CSS
import "../style/navbar.css";

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
import { TbPerfume } from "react-icons/tb";
import { Feather, Bell, ShoppingCart } from "lucide-react";

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

// --- Memoized Sidebar Item ---
const SidebarItem = memo(({ icon: Icon, label, onClick, badge }) => (
  <li className="sidebar-item" onClick={onClick} role="button" tabIndex={0}>
    {Icon &&
      (typeof Icon === "string" ? (
        <img src={Icon} alt="" aria-hidden="true" />
      ) : (
        <Icon className="sidebar-icon" aria-hidden="true" size={20} />
      ))}
    <span className="sidebar-label">{label}</span>
    {typeof badge === "number" && (
      <span className="sidebar-badge" aria-hidden="true">{badge}</span>
    )}
  </li>
));

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

  // --- 🟢 OPTIMIZED SCROLL HANDLER ---
  // Merged the layout logic and the dropdown closing logic into one RAF loop
useEffect(() => {
    let lastScrollTop = 0;
    let ticking = false;

    const handleScroll = () => {
      // 1. Close Dropdowns on any scroll
      // Using functional updates allows us to check state without adding dependencies (preventing re-binding)
      setIsProfileOpen(prev => (prev ? false : prev));
      setIsNotificationOpen(prev => (prev ? false : prev));

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
          
          // 1. Calculate the difference
          const scrollDelta = Math.abs(currentScroll - lastScrollTop);

          // 2. IGNORE micro-movements (The Fix for Shaking)
          // If the scroll changed by less than 10px, do nothing.
          if (scrollDelta < 10) {
            ticking = false;
            return;
          }

          // 3. Navbar Visibility Logic (Only runs if moved > 10px)
          // Hide if scrolling DOWN, Show if scrolling UP or at the very top
          const isVisible = currentScroll < lastScrollTop || currentScroll < 50;
          
          setNavbarVisible(isVisible);
          if (onVisibilityChange) onVisibilityChange(isVisible);

          // 4. Pill Shape Logic
          setIsScrolled(currentScroll > 50);

          // Update last position
          lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onVisibilityChange]); // Dependencies kept minimal for performance

  // --- Sidebar & Auth Modal Body Lock ---
  useEffect(() => {
    if (isOpen || isAuthModalOpen) {
      if(isOpen) previouslyFocusedRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if(isOpen) {
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

  // Links Data
  const primaryLinks = useMemo(() => [
    { label: "Home", icon: BiHomeHeart, onClick: () => { navigate("/"); closeSidebar(); } },
    { label: "About", icon: (props) => <Feather {...props} strokeWidth={1.75} />, onClick: () => { handleNavScroll("about-section"); closeSidebar(); } },
    { label: "Collection", icon: TbPerfume, onClick: () => { handleNavScroll("collection-section"); closeSidebar(); } },
  ], [navigate, closeSidebar, handleNavScroll]);

  const accountLinks = useMemo(() => [
    ...(isLoggedIn ? [{ label: "My Orders", icon: MyOrderIcon, onClick: () => { navigate("/myorder"); closeSidebar(); } }] : []),
    { label: "Wishlist", icon: WishlistIcon, onClick: () => { navigate("/wishlist"); closeSidebar(); }, badge: wishCount },
    { label: "Cart", icon: ShoppingCart, onClick: () => { navigate("/cart"); closeSidebar(); }, badge: cartCount },
  ], [isLoggedIn, navigate, closeSidebar, wishCount, cartCount]);

  const supportLinks = useMemo(() => [
    { label: "Contact Us", icon: MailUsIcon, onClick: () => { navigate("/contact"); closeSidebar(); } },
  ], [navigate, closeSidebar]);

  return (
    <header ref={navRef}>
      <nav
        id="navbar"
        className={`${isScrolled ? "scrolled" : ""} ${isOpen ? "sidebar-open" : ""}`}
        // 🟢 TRANSFORMATION: Using -180% to ensure navbar fully clears shadows on mobile
        style={{
          transform: navbarVisible ? "translateY(0)" : "translateY(-180%)",
          willChange: "transform",
        }}
      >
        <div className="part-1 nav-brand">
          <a className="logo" onClick={() => navigate("/")}> <h1>Devid Aura</h1> </a>
        </div>

        <div className="part-2">
          <ul className="nav-links">
            <li><a onClick={() => navigate("/")}>Home</a></li>
            <li><a onClick={() => handleNavScroll("about-section")}>About</a></li>
            <li><a onClick={() => handleNavScroll("collection-section")}>Collection</a></li>
          </ul>
        </div>

        <div className="part-3">
          <motion.div className="icons" layout transition={springConfig}>
            
            <motion.div layout className="wishlist-icon">
              <a onClick={() => navigate("/wishlist")}>
                <button id="wishlist-icon" className="icon-btn" aria-label={`Wishlist (${wishCount})`}>
                  <img className="wishlist-img" src={WishlistIcon} alt="wishlist" />
                  {wishCount > 0 && <span className="badge">{wishCount}</span>}
                </button>
              </a>
            </motion.div>

            <motion.div layout className="cart-icon">
              <a onClick={() => navigate("/cart")}>
                <button id="cart-icon" className="icon-btn" aria-label={`Cart (${cartCount})`}>
                  <ShoppingCart strokeWidth={1.2} />
                  {cartCount > 0 && <span className="badge">{cartCount}</span>}
                </button>
              </a>
            </motion.div>

            {isLoggedIn && (
              <motion.div layout className="notification-wrapper" ref={notificationRef}>
                <div className="notification-icon">
                  <button onClick={toggleNotification} className="icon-btn" aria-label={`Notifications (${unreadCount})`}>
                    <Bell strokeWidth={1.3} />
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                  </button>
                </div>
                <div className={`profile-content notification-dropdown ${isNotificationOpen ? "active" : "hidden"}`} id="notificationContent">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <div className="buttons">
                      {unreadCount > 0 && <button onClick={markAllAsRead} className="notification-header-btn">Mark all as read</button>}
                      {notifications.length > 0 && <button onClick={clearAllNotifications} className="notification-header-btn danger">Clear All</button>}
                    </div>
                  </div>
                  <ul className="notification-list">
                    {notifications.length === 0 ? (
                      <li className="notification-empty"><a>No new notifications</a></li>
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
                            <li className="notification-group-header"><a>{groupKey}</a></li>
                            {groupedNotifications[groupKey].map(notif => (
                              <li key={notif.id} onClick={() => { navigate(notif.link || '/'); setIsNotificationOpen(false); }} className={`notification-item ${notif.isRead ? 'read' : 'unread'}`} data-type={notif.type}>
                                <div className="notification-item-content">
                                  <span className="notification-message">{notif.message}</span>
                                  <span className="notification-time">{notif.timeAgo}</span>
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

            <motion.div layout className="auth-item-container" ref={profileWrapperRef}>
              <AnimatePresence mode="popLayout" initial={false} >
                {isLoggedIn ? (
                  <motion.div
                    key="profile-btn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="profile-wrapper" 
                  >
                    <div className="profile-icon" id="profile-btn">
                      <button id="profileButton" className="icon-btn" onClick={toggleProfile} aria-expanded={isProfileOpen}>
                        <img src={ProfileIcon} alt="Profile" />
                      </button>
                    </div>
                    {/* Profile Dropdown Content */}
                    <div className="profile-container">
                      <div className={`profile-content ${isProfileOpen ? "active" : "hidden"}`} id="profileContent">
                        <div className="desktop-profile-info">
                          <img src={userdetails?.profileImage || user?.imageUrl || UserIcon} alt="User" className="mob-profile-img" />
                          <div className="user-data">
                            <div className="user-name-role">
                              <h3 id="profile-name">{userdetails?.name}</h3>
                              {userdetails?.role && <span className={`user-role-badge ${userdetails.role === "admin" ? "admin" : ""}`}>{userdetails.role}</span>}
                            </div>
                            <p id="profile-email">{user?.primaryEmailAddress?.emailAddress || "NA"}</p>
                          </div>
                        </div>
                        <ul>
                          <li onClick={() => { navigate("/myaccount"); setIsProfileOpen(false); }}><img src={ProfileIcon} alt="" /><a>My Account</a></li>
                          <li onClick={() => { navigate("/myorder"); setIsProfileOpen(false); }}><img src={MyOrderIcon} alt="" /><a>My Orders</a></li>
                          <li onClick={() => { navigate("/contact"); setIsProfileOpen(false); }}><img src={MailUsIcon} alt="" /><a>Contact Us</a></li>
                          {userdetails?.role === "admin" && (
                            <li onClick={() => { navigate("/admin"); setIsProfileOpen(false); }}><img src={AdminIcon} alt="" /><a>Admin Panel</a></li>
                          )}
                          <li className="logout" onClick={async (e) => { e.preventDefault(); await signOut({ redirectUrl: "/" }); setIsProfileOpen(false); }}><a>Log Out</a><img src={LogOutIcon} alt="" /></li>
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
                    className="nav-signin-btn" 
                    onClick={openAuthModal}
                  >
                    <img src={ProfileIcon} alt="" aria-hidden="true" />
                    <span>Sign In</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="part-1">
              <div className="mobile-view">
                <div className="menu-icon">
                  <button
                    ref={hamburgerRef}
                    className={`hamburger-btn`} id="hamburger-toggle"
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                    onClick={(e) => { toggleSidebar(e); }}
                  >
                    <div className={`hamburger ${isOpen ? "active" : ""}`}>
                      <div className="line" />
                      <div className="line" />
                      <div className="line" />
                    </div>
                  </button>

                  {createPortal(
                    <aside
                      ref={sidebarScopeRef}
                      className={`sidebar ${isOpen ? "open" : ""}`}
                      id="sidebar"
                      role="dialog"
                      aria-modal={isOpen}
                    >
                      <header className="sidebar-header">
                        <div className="sidebar-top">
                          <div className="sidebar-user-details">
                            <img src={isLoggedIn ? userdetails?.profileImage || user?.imageUrl || UserIcon : UserIcon} alt="" className="user-avatar" />
                            <div className="user-info">
                              <h4>{isLoggedIn ? (userdetails?.name || user?.fullName) : 'Guest'}</h4>
                              <p className="user-email">{isLoggedIn ? user?.primaryEmailAddress?.emailAddress : 'Login'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="sidebar-actions">
                          <button
                            className={`sidebar-action-btn ${isLoggedIn ? 'sidebar-view-account' : 'sidebar-signin'}`}
                            onClick={() => {
                              if (isLoggedIn) { navigate('/myaccount'); closeSidebar(); }
                              else { openAuthModal(); closeSidebar(); }
                            }}
                          >
                            {isLoggedIn ? 'View Profile' : 'Login / Sign Up'}
                          </button>
                        </div>
                      </header>

                      <nav className="sidebar-nav">
                        <div className="sidebar-section">
                          <h5 className="section-title">Explore</h5>
                          <ul>
                            {primaryLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} onClick={l.onClick} />))}
                          </ul>
                        </div>
                        <div className="sidebar-section">
                          <h5 className="section-title">Account</h5>
                          <ul>
                            {accountLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} badge={l.badge} onClick={l.onClick} />))}
                            {isLoggedIn && userdetails?.role === 'admin' && (<SidebarItem icon={AdminIcon} label={'Admin Panel'} onClick={() => { navigate('/admin'); closeSidebar(); }} />)}
                          </ul>
                        </div>
                        <div className="sidebar-section">
                          <h5 className="section-title">Support</h5>
                          <ul>
                            {supportLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} onClick={l.onClick} />))}
                          </ul>
                        </div>
                      </nav>

                      {isLoggedIn && (
                        <footer className="sidebar-footer">
                          <button onClick={async (e) => { e.preventDefault(); await signOut({ redirectUrl: '/' }); closeSidebar(); }}>
                            <img src={LogOutIcon} alt="Log out" />
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