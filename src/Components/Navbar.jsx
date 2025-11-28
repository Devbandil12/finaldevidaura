// File: src/Components/Navbar.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

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

const SidebarItem = ({ icon: Icon, label, onClick, badge }) => (
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
);

const Navbar = ({ onVisibilityChange }) => {
  const { wishlist, cart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);
  const { notifications, unreadCount, markAllAsRead, clearAllNotifications } = useContext(NotificationContext);

  // State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Sidebar
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false); // Track scroll position for Pill effect
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
  const toggleSidebar = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setIsOpen((v) => !v);
  };
  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    if (previouslyFocusedRef.current) previouslyFocusedRef.current.focus?.();
  }, []);
  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, []);
  const openAuthModal = () => {
    setIsAuthModalOpen(true);
    setIsOpen(false);
    setIsProfileOpen(false);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  };

  // Grouping Notifications
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

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
      if (!isAuthModalOpen) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      }
      window.setTimeout(() => {
        const el = sidebarScopeRef.current?.querySelector('button, [role="button"], a, input');
        el?.focus?.();
      }, 50);
    } else {
      if (!isAuthModalOpen) {
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
      }
    }
  }, [isOpen, isAuthModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        sidebarScopeRef.current &&
        !sidebarScopeRef.current.contains(event.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target)
      ) {
        closeSidebar();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeSidebar]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (isOpen) closeSidebar();
        if (isProfileOpen) setIsProfileOpen(false);
        if (isAuthModalOpen) closeAuthModal();
        if (isNotificationOpen) setIsNotificationOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isProfileOpen, isAuthModalOpen, isNotificationOpen, closeSidebar, closeAuthModal]);

  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const isVisible = currentScroll < lastScrollTop;
      setNavbarVisible(isVisible);
      if (onVisibilityChange) onVisibilityChange(isVisible);
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
      setIsScrolled(currentScroll > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onVisibilityChange]);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;
    const ctx = gsap.context(() => {
      gsap.set([".nav-links li", ".icons > *", ".nav-brand"], { willChange: "transform, opacity", force3D: true });
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".nav-brand", { y: -8, autoAlpha: 0, duration: 0.26 })
        .from(".nav-links li", { y: -8, autoAlpha: 0, duration: 0.22, stagger: 0.05 }, "-=0.06")
        .from(".icons > *", { y: -8, autoAlpha: 0, duration: 0.2, stagger: 0.05 }, "-=0.1")
        .add(() => {
          gsap.set([".nav-links li", ".icons > *", ".nav-brand"], { willChange: "auto" });
        });
    }, navRef);
    return () => ctx.revert();
  }, []);

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
      tl.from(headerSel, { y: -8, opacity: 0, duration: 0.22 }).from(
        itemsSel, { y: 8, opacity: 0, duration: 0.2, stagger: 0.05 }, "-=0.04"
      );
      if (isLoggedIn) {
        tl.from(footerSel, { y: 6, opacity: 0, duration: 0.18 }, "-=0.08");
      }
    }, sidebarScopeRef);
    return () => ctx.revert();
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && profileWrapperRef.current && !profileWrapperRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (isNotificationOpen && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [isProfileOpen, isNotificationOpen]);

  useEffect(() => {
    const handleScrollProfile = () => {
      if (isProfileOpen && !isAuthModalOpen) setIsProfileOpen(false);
      if (isNotificationOpen && !isAuthModalOpen) setIsNotificationOpen(false);
    };
    window.addEventListener("scroll", handleScrollProfile);
    return () => window.removeEventListener("scroll", handleScrollProfile);
  }, [isProfileOpen, isNotificationOpen, isAuthModalOpen]);

  const handleNavScroll = (targetId) => {
    if (window.location.pathname !== "/") {
      sessionStorage.setItem("scrollToSection", targetId);
      navigate("/");
    } else {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const primaryLinks = [
    { label: "Home", icon: BiHomeHeart, onClick: () => { navigate("/"); closeSidebar(); } },
    {
      label: "About",
      icon: (props) => <Feather {...props} strokeWidth={1.75} />,
      onClick: () => { handleNavScroll("about-section"); closeSidebar(); }
    },
    { label: "Collection", icon: TbPerfume, onClick: () => { handleNavScroll("collection-section"); closeSidebar(); } },
  ];
  const accountLinks = [
    ...(isLoggedIn ? [{ label: "My Orders", icon: MyOrderIcon, onClick: () => { navigate("/myorder"); closeSidebar(); } }] : []),
    { label: "Wishlist", icon: WishlistIcon, onClick: () => { navigate("/wishlist"); closeSidebar(); }, badge: wishCount },
    { label: "Cart", icon: ShoppingCart, onClick: () => { navigate("/cart"); closeSidebar(); }, badge: cartCount },
  ];
  const supportLinks = [
    { label: "Contact Us", icon: MailUsIcon, onClick: () => { navigate("/contact"); closeSidebar(); } },
  ];

  const getNavbarTop = () => {
    if (!navbarVisible) return "-150px";
    if (isScrolled) return "0px";
    return "0px";
  };

  return (
    <header ref={navRef}>
      <nav
        id="navbar"
        className={`${isScrolled ? "scrolled" : ""} ${isOpen ? "sidebar-open" : ""} ${!navbarVisible ? "navbar-hidden" : ""}`}
        style={{
          top: getNavbarTop(),
          transition: "top 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
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
          <div className="icons">
            <div className="wishlist-icon">
              <a onClick={() => navigate("/wishlist")}>
                <button id="wishlist-icon" className="icon-btn" aria-label={`Wishlist (${wishCount})`}>
                  <img className="wishlist-img" src={WishlistIcon} alt="wishlist" />
                  {wishCount > 0 && <span className="badge">{wishCount}</span>}
                </button>
              </a>
            </div>

            <div className="cart-icon">
              <a onClick={() => navigate("/cart")}>
                <button id="cart-icon" className="icon-btn" aria-label={`Cart (${cartCount})`}>
                  <ShoppingCart strokeWidth={1.2} />
                  {cartCount > 0 && <span className="badge">{cartCount}</span>}
                </button>
              </a>
            </div>

            {isLoggedIn && (
              <div className="notification-wrapper" ref={notificationRef}>
                <div className="notification-icon">
                  <button onClick={() => setIsNotificationOpen(v => !v)} className="icon-btn" aria-label={`Notifications (${unreadCount})`}>
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
              </div>
            )}

            {isLoggedIn ? (
              <div className="profile-wrapper" ref={profileWrapperRef}>
                <div className="profile-icon" id="profile-btn">
                  <button id="profileButton" className="icon-btn" onClick={() => setIsProfileOpen((v) => !v)} aria-expanded={isProfileOpen}>
                    <img src={ProfileIcon} alt="Profile" />
                  </button>
                </div>
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
              </div>
            ) : (
              <button 
                className="nav-signin-btn" 
                onClick={openAuthModal}
              >
                <img src={ProfileIcon} alt="" aria-hidden="true" />
                <span>Sign In</span>
              </button>
            )}

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
          </div>
        </div>
      </nav>

      {isAuthModalOpen && <CustomAuthModal onClose={closeAuthModal} />}
    </header>
  );
};

export default Navbar;