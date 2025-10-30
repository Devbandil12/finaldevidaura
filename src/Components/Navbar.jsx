// File: src/Components/Navbar.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Assets
import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolated.png";
import MyOrderIcon from "../assets/order-svgrepo-com.svg";
import MailUsIcon from "../assets/mail-svgrepo-com.svg";
import LogOutIcon from "../assets/logout-svgrepo-com.svg";
import CartIcon from "../assets/cart-svgrepo-com.svg";
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

// GSAP
import { gsap } from "gsap";


import { BiHomeHeart } from "react-icons/bi";
import { TbPerfume } from "react-icons/tb";
import { Feather } from "lucide-react";

const SidebarItem = ({ icon: Icon, label, onClick, badge }) => (
  <li className="sidebar-item" onClick={onClick} role="button" tabIndex={0}>
    {/* Render Lucide or image icon */}
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
  const { wishlist, cart } = React.useContext(CartContext);
  const { userdetails } = React.useContext(UserContext);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // sidebar
  const [navbarVisible, setNavbarVisible] = useState(true);

  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isLoggedIn = isSignedIn;

  const navigate = useNavigate();

  // ---- Refs ----
  const navRef = useRef(null);
  const sidebarScopeRef = useRef(null);
  const profileWrapperRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  // NOTE: profileAnimScopeRef, profileContainerRef, and hamburgerRef were not essential to the sidebar logic but are kept for potential future use or original template structure.

  const cartCount = cart?.length || 0;
  const wishCount = wishlist?.length || 0;

  const toggleSidebar = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setIsOpen((v) => !v);
  };

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    // restore focus
    if (previouslyFocusedRef.current) previouslyFocusedRef.current.focus?.();
  }, []);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
      // prevent scrolling
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // focus first focusable in sidebar
      window.setTimeout(() => {
        const el = sidebarScopeRef.current?.querySelector('button, [role="button"], a, input');
        el?.focus?.();
      }, 50);
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [isOpen]);

  // OUTSIDE CLICK to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click target is NOT within the sidebar/hamburger container
      if (isOpen && sidebarScopeRef.current && !sidebarScopeRef.current.contains(event.target)) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeSidebar]);

  // ESC key to close
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (isOpen) closeSidebar();
        if (isProfileOpen) setIsProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isProfileOpen, closeSidebar]);

  // Navbar visibility on scroll
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const isVisible = currentScroll < lastScrollTop;

      setNavbarVisible(isVisible);
      if (onVisibilityChange) onVisibilityChange(isVisible);

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onVisibilityChange]);

  // ==========================================================
  // REMOVED: updateSidebarOffset, useLayoutEffect for offset,
  // and useEffect([navbarVisible, updateSidebarOffset])
  // ==========================================================

  // GSAP entry animations (unmodified logic)
  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.set([".nav-links li", ".icons > *", ".nav-brand"], { willChange: "transform, opacity", force3D: true });

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".nav-brand", { y: -8, autoAlpha: 0, duration: 0.26 })
        .from(
          ".nav-links li",
          { y: -8, autoAlpha: 0, duration: 0.22, stagger: 0.05 },
          "-=0.06"
        )
        .from(
          ".icons > *",
          { y: -8, autoAlpha: 0, duration: 0.2, stagger: 0.05 },
          "-=0.1"
        )
        .add(() => {
          gsap.set([".nav-links li", ".icons > *", ".nav-brand"], { willChange: "auto" });
        });
    }, navRef);

    return () => ctx.revert();
  }, []);

  // GSAP sidebar entry animation
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
        itemsSel,
        { y: 8, opacity: 0, duration: 0.2, stagger: 0.05 },
        "-=0.04"
      );

      if (isLoggedIn) {
        tl.from(footerSel, { y: 6, opacity: 0, duration: 0.18 }, "-=0.08");
      }
    }, sidebarScopeRef);

    return () => ctx.revert();
  }, [isOpen, isLoggedIn]);

  // Profile dropdown outside click / scroll closure
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileWrapperRef.current && !profileWrapperRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  useEffect(() => {
    const handleScrollProfile = () => {
      if (isProfileOpen) setIsProfileOpen(false);
    };
    window.addEventListener("scroll", handleScrollProfile);
    return () => window.removeEventListener("scroll", handleScrollProfile);
  }, [isProfileOpen]);

  const handleNavScroll = (targetId) => {
    if (window.location.pathname !== "/") {
      sessionStorage.setItem("scrollToSection", targetId);
      navigate("/");
    } else {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Sidebar link groups for easier maintenance
  const primaryLinks = [
  {
    label: "Home",
    icon: BiHomeHeart,
    onClick: () => {
      navigate("/");
      closeSidebar();
    },
  },
  {
    label: "About",
    icon: Feather,
    onClick: () => {
      handleNavScroll("about-section");
      closeSidebar();
    },
  },
  {
    label: "Collection",
    icon: TbPerfume,
    onClick: () => {
      handleNavScroll("collection-section");
      closeSidebar();
    },
  },
];

  const accountLinks = [
    ...(isLoggedIn ? [{ label: "My Orders", icon: MyOrderIcon, onClick: () => { navigate("/myorder"); closeSidebar(); } }] : []),
    { label: "Wishlist", icon: WishlistIcon, onClick: () => { navigate("/wishlist"); closeSidebar(); }, badge: wishCount },
    { label: "Cart", icon: CartIcon, onClick: () => { navigate("/cart"); closeSidebar(); }, badge: cartCount },
  ];

  const supportLinks = [
    { label: "Contact Us", icon: MailUsIcon, onClick: () => { navigate("/contact"); closeSidebar(); } },
  ];

  return (
    <header ref={navRef}>
      <nav
        id="navbar"
        style={{ top: navbarVisible ? "0" : "-50px", transition: "top 0.3s ease-in-out" }}
      >
        {/* LEFT: Brand */}
        <div className="part-1 nav-brand">
          <a className="logo" onClick={() => navigate("/")}> <h1>Devid Aura</h1> </a>
        </div>

        {/* CENTER: Links (desktop) */}
        <div className="part-2">
          <ul className="nav-links">
            <li><a onClick={() => navigate("/")}>Home</a></li>
            <li><a onClick={() => handleNavScroll("about-section")}>About</a></li>
            <li><a onClick={() => handleNavScroll("collection-section")}>Collection</a></li>
          </ul>
        </div>

        {/* RIGHT: Icons */}
        <div className="part-3">
          <div className="icons">
            <div className="wishlist-icon">
              <a onClick={() => navigate("/wishlist")}>
                <button id="wishlist-icon" className="icon-btn" aria-label={`Wishlist (${wishCount})`}>
                  <img className="wishlist-img" src={WishlistIcon} alt="wishlist" />
                  <span id="wishlist-count" className="badge">{wishCount >= 0 ? wishCount : 0}</span>
                </button>
              </a>
            </div>

            <div className="cart-icon">
              <a onClick={() => navigate("/cart")}>
                <button id="cart-icon" className="icon-btn" aria-label={`Cart (${cartCount})`}>
                  <img src={CartIcon} alt="Cart" />
                  <span id="cart-count" className="badge">{cartCount >= 0 ? cartCount : ""}</span>
                </button>
              </a>
            </div>

            {/* Profile / Sign in */}
            <div className="profile-wrapper" ref={profileWrapperRef}>
              <div className="profile-icon" id="profile-btn">
                <button id="profileButton" onClick={() => setIsProfileOpen((v) => !v)} aria-expanded={isProfileOpen} aria-controls="profileContent">
                  <img src={ProfileIcon} alt="Profile" />
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="profile-container">
                <div className={`profile-content ${isProfileOpen ? "active" : "hidden"}`} id="profileContent">
                  {/* -- Header Section (Conditional) -- */}
                  {isLoggedIn ? (
                    <div className="desktop-profile-info">
                      <img src={userdetails?.profileImage || user?.imageUrl || UserIcon} alt="User" className="mob-profile-img" />
                      <div className="user-data">
                        <div className="user-name-role">
                          <h3 id="profile-name">{userdetails?.name}</h3>
                          {userdetails?.role && (
                            <span className={`user-role-badge ${userdetails.role === "admin" ? "admin" : ""}`}>{userdetails.role}</span>
                          )}
                        </div>
                        <p id="profile-email">{user?.primaryEmailAddress?.emailAddress || "N/A"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="desktop-profile-info">
                      <img src={UserIcon} alt="Guest" className="mob-profile-img" />
                      <div className="user-data">
                        <h3>Guest Account</h3>
                        <p>Welcome to Devid Aura</p>
                      </div>
                    </div>
                  )}

                  {/* -- Links Section (Unified) -- */}
                  <ul>
                    {isLoggedIn ? (
                      <>
                        <li onClick={() => { navigate("/myaccount"); setIsProfileOpen(false); }}>
                          <img src={ProfileIcon} alt="My Account" />
                          <a>My Account</a>
                        </li>
                        <li onClick={() => { navigate("/myorder"); setIsProfileOpen(false); }}>
                          <img src={MyOrderIcon} alt="My Orders" />
                          <a>My Orders</a>
                        </li>
                      </>
                    ) : (
                      <li onClick={() => { navigate("/login"); setIsProfileOpen(false); }}>
                        <img src={ProfileIcon} alt="Login" />
                        <a>Login / Sign Up</a>
                      </li>
                    )}
                    <li onClick={() => { navigate("/contact"); setIsProfileOpen(false); }}>
                      <img src={MailUsIcon} alt="Contact Us" />
                      <a>Contact Us</a>
                    </li>
                    {isLoggedIn && userdetails?.role === "admin" && (
                      <li onClick={() => { navigate("/admin"); setIsProfileOpen(false); }}>
                        <img src={AdminIcon} alt="Admin Panel" />
                        <a>Admin Panel</a>
                      </li>
                    )}
                    {isLoggedIn && (
                      <li className="logout" id="logout-2" onClick={async (e) => { e.preventDefault(); await signOut({ redirectUrl: "/" }); setIsProfileOpen(false); }}>
                        <a>Log Out</a>
                        <img src={LogOutIcon} alt="Log Out" />
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* ===== Mobile View: hamburger + sidebar ===== */}
            <div className="part-1">
              <div className="mobile-view" ref={sidebarScopeRef}>
                <div className="menu-icon">
                  <button
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
                  <aside className={`sidebar ${isOpen ? "open" : ""}`} id="sidebar" role="dialog" aria-modal={isOpen} aria-labelledby="sidebarTitle">
                    <header className="sidebar-header">
                      <div className="sidebar-top">
                        <div className="sidebar-user-details">
                          <img src={isLoggedIn ? userdetails?.profileImage || user?.imageUrl || UserIcon : UserIcon} alt={isLoggedIn ? "User Profile" : "Guest"} className="user-avatar" />
                          <div className="user-info">
                            <h4 id="sidebarTitle">{isLoggedIn ? (userdetails?.name || user?.fullName) : 'Guest'}</h4>
                            <p className="user-email">{isLoggedIn ? user?.primaryEmailAddress?.emailAddress : 'Login to personalize your experience'}</p>
                            {isLoggedIn && <p className="user-role">{userdetails?.role || 'User'}</p>}
                          </div>
                        </div>

                      </div>

                      <div className="sidebar-actions">
                        <button className={`sidebar-action-btn ${isLoggedIn ? 'sidebar-view-account' : 'sidebar-signin'}`} onClick={() => { navigate(isLoggedIn ? '/myaccount' : '/login'); if (isLoggedIn) closeSidebar(); }}>
                          {isLoggedIn ? 'View Profile' : 'Login / Sign Up'}
                        </button>
                      </div>
                    </header>

                    <nav className="sidebar-nav">
                      <div className="sidebar-section">
                        <h5 className="section-title">Explore</h5>
                        <ul>
                          {primaryLinks.map((l) => (
                            <SidebarItem key={l.label} icon={l.icon} label={l.label} onClick={l.onClick} />
                          ))}
                        </ul>
                      </div>


                      <div className="sidebar-section">
                        <h5 className="section-title">Account</h5>
                        <ul>
                          {accountLinks.map((l) => (
                            <SidebarItem key={l.label} icon={l.icon} label={l.label} badge={l.badge} onClick={l.onClick} />
                          ))}

                          {isLoggedIn && userdetails?.role === 'admin' && (
                            <SidebarItem icon={AdminIcon} label={'Admin Panel'} onClick={() => { navigate('/admin'); closeSidebar(); }} />
                          )}
                        </ul>
                      </div>

                      <div className="sidebar-section">
                        <h5 className="section-title">Support</h5>
                        <ul>
                          {supportLinks.map((l) => (
                            <SidebarItem key={l.label} icon={l.icon} label={l.label} onClick={l.onClick} />
                          ))}
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
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;