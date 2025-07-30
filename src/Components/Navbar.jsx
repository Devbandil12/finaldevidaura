// src/Components/Navbar.js

import React, { useState, useEffect, useContext, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";

import "../style/navbar.css";

import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolated.png";
import MyOrderIcon from "../assets/order-svgrepo-com.svg";
import MailUsIcon from "../assets/mail-svgrepo-com.svg";
import LogOutIcon from "../assets/logout-svgrepo-com.svg";
import CartIcon from "../assets/cart-svgrepo-com.svg";
import AdminIcon from "../assets/admin.png";
import WishlistIcon from "../assets/wishlist-svgrepo-com.svg";
import ProfileIcon from "../assets/profile-simple-svgrepo-com.svg";

import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

// NEW: GSAP
import { gsap } from "gsap";

const Navbar = ({ onVisibilityChange }) => {
  const { wishlist, cart } = useContext(CartContext);
  const [cartCount, setCartCount] = useState(0);

  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isLoggedIn = isSignedIn;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // sidebar
  const [navbarVisible, setNavbarVisible] = useState(true);

  const navigate = useNavigate();
  const profileContainerRef = useRef(null);

  // NEW: refs to scope GSAP
  const navRef = useRef(null);
  const sidebarRef = useRef(null);
  const profileRef = useRef(null);

  const { userdetails } = useContext(UserContext);

  // Update cart count when cart changes
  useEffect(() => {
    if (cart) setCartCount(cart.length);
  }, [cart]);

  // Toggle the mobile sidebar (hamburger logic unchanged)
  const toggleSidebar = (e) => {
    e.preventDefault();
    setIsOpen((v) => !v);
  };

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [isOpen]);

  // Hide navbar on scroll down, show on scroll up (unchanged)
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

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close profile dropdown on scroll
  useEffect(() => {
    const handleScrollProfile = () => {
      if (isProfileOpen) setIsProfileOpen(false);
    };
    window.addEventListener("scroll", handleScrollProfile);
    return () => window.removeEventListener("scroll", handleScrollProfile);
  }, [isProfileOpen]);

  // =======================
  // GSAP: Page-load stagger
  // =======================
  useLayoutEffect(() => {
    // Respect reduced motion
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".nav-brand", { y: -10, opacity: 0, duration: 0.4 })
        .from(".nav-links li", { y: -12, opacity: 0, stagger: 0.06, duration: 0.35 }, "-=0.1")
        .from(".icons > *", { y: -10, opacity: 0, stagger: 0.06, duration: 0.35 }, "-=0.2");
    }, navRef);

    return () => ctx.revert();
  }, []);

  // =======================
  // GSAP: Sidebar stagger
  // =======================
  useEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    if (isOpen) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
        tl.from(".sidebar-header", { y: -8, opacity: 0, duration: 0.25 })
          .from(".sidebar-nav li", { y: 8, opacity: 0, stagger: 0.06, duration: 0.25 }, "-=0.05")
          .from(".sidebar-footer", { y: 6, opacity: 0, duration: 0.2 }, "-=0.08");
      }, sidebarRef);
      return () => ctx.revert();
    }
  }, [isOpen]);

  // ==============================
  // GSAP: Profile dropdown reveal
  // ==============================
  useEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    if (isProfileOpen) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
        tl.from(".profile-content", { y: -10, opacity: 0, duration: 0.2 })
          .from(".profile-content ul li", { y: 6, opacity: 0, stagger: 0.04, duration: 0.2 }, "-=0.05");
      }, profileRef);
      return () => ctx.revert();
    }
  }, [isProfileOpen]);

  return (
    <header ref={navRef}>
      <nav
        id="navbar"
        style={{
          top: navbarVisible ? "0" : "-50px",
          transition: "top 0.3s ease-in-out", // keep your original scroll transition
        }}
      >
        {/* LEFT: Brand */}
        <div className="part-1 nav-brand">
          <a className="logo" onClick={() => navigate("/")}>
            <h1>DEVIDAURA</h1>
          </a>
        </div>

        {/* CENTER: Links (desktop) */}
        <div className="part-2">
          <ul className="nav-links">
            <li>
              <a onClick={() => navigate("/")}>Home</a>
            </li>
            <li>
              <a
                onClick={() =>
                  document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Collection
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  document.getElementById("shop-section")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Shop
              </a>
            </li>
          </ul>
        </div>

        {/* RIGHT: Icons row */}
        <div className="part-3">
          <div className="icons">
            {/* Wishlist */}
            <div className="wishlist-icon">
              <a onClick={() => navigate("/wishlist")}>
                <button id="wishlist-icon" className="icon-btn">
                  <img className="wishlist-img" src={WishlistIcon} alt="wishlist" />
                  <span id="wishlist-count" className="badge">
                    {wishlist.length >= 0 ? wishlist.length : 0}
                  </span>
                </button>
              </a>
            </div>

            {/* Cart */}
            <div className="cart-icon">
              <a onClick={() => navigate("/cart")}>
                <button id="cart-icon" className="icon-btn">
                  <img src={CartIcon} alt="Cart" />
                  <span id="cart-count" className="badge">
                    {cartCount >= 0 ? cartCount : ""}
                  </span>
                </button>
              </a>
            </div>

            {/* Profile / Sign in */}
            {isLoggedIn ? (
              <div className="profile-icon" id="profile-btn" ref={profileRef}>
                <button
                  id="profileButton"
                  onClick={() => setIsProfileOpen((v) => !v)}
                  aria-expanded={isProfileOpen}
                  aria-controls="profileContent"
                >
                  <img src={ProfileIcon} alt="Profile" />
                </button>

                {/* Profile Dropdown */}
                <div className="profile-container" ref={profileContainerRef}>
                  <div
                    className={`profile-content ${isProfileOpen ? "active" : "hidden"}`}
                    id="profileContent"
                  >
                    <div className="desktop-profile-info">
                      <img
                        src={UserIcon}
                        alt="User"
                        className="mob-profile-img"
                        id="mob-profile-img"
                      />
                      <div className="user-data">
                        <h3 id="profile-name">{user?.fullName}</h3>
                        <p id="profile-email">
                          {user?.primaryEmailAddress?.emailAddress ||
                            user?.primaryEmailAddress?.emailAddress ||
                            "N/A"}
                        </p>
                      </div>
                    </div>

                    <ul>
                      <li
                        onClick={() => {
                          navigate("/myorder");
                          setIsProfileOpen(false);
                        }}
                      >
                        <img src={MyOrderIcon} alt="" />
                        <a>My Orders</a>
                      </li>
                      <li
                        onClick={() => {
                          navigate("/contact");
                          setIsProfileOpen(false);
                        }}
                      >
                        <img src={MailUsIcon} alt="" />
                        <a>Contact Us</a>
                      </li>
                      {isLoggedIn && user && userdetails?.role === "admin" && (
                        <li
                          onClick={() => {
                            navigate("/admin");
                            setIsProfileOpen(false);
                          }}
                        >
                          <img src={AdminIcon} alt="" />
                          <a>Admin Panel</a>
                        </li>
                      )}
                      <li
                        className="logout"
                        id="logout-2"
                        onClick={async (e) => {
                          e.preventDefault();
                          await signOut({ redirectUrl: "/" });
                          setIsProfileOpen(false);
                        }}
                      >
                        <a id="logout-btn-2">Log Out</a>
                        <img src={LogOutIcon} alt="" />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <SignInButton>
                <div id="loginSignupButtons" className="desktop-login-signup">
                  <button id="loginButton">
                    <span className="btn-text">Sign Up</span>
                  </button>
                </div>
              </SignInButton>
            )}

            {/* ===== Mobile View: hamburger + sidebar (UNCHANGED logic & CSS) ===== */}
            <div className="part-1">
              <div className="mobile-view" ref={sidebarRef}>
                <div className="menu-icon" onClick={toggleSidebar}>
                  {/* hamburger unchanged */}
                  <div className="menu-container">
                    <div className={`hamburger ${isOpen ? "active" : ""}`} id="hamburger">
                      <div className="line" />
                      <div className="line" />
                      <div className="line" />
                    </div>
                  </div>

                  {/* sidebar content (same structure; styled + animated) */}
                  <div className={`sidebar ${isOpen ? "open" : ""}`} id="sidebar">
                    <header className="sidebar-header">
                      <img src={UserIcon} alt="User" />
                      {isLoggedIn ? (
                        <div className="sidebar-user">
                          <h4>{user?.fullName}</h4>
                          <p>{user?.primaryEmailAddress?.emailAddress || "N/A"}</p>
                        </div>
                      ) : (
                        <SignInButton>
                          <button className="sidebar-signin">Login / Sign Up</button>
                        </SignInButton>
                      )}
                      <button className="sidebar-close" onClick={toggleSidebar}>
                        ✕
                      </button>
                    </header>

                    <nav className="sidebar-nav">
                      <ul>
                        <li
                          onClick={() => {
                            navigate("/myorder");
                            toggleSidebar();
                          }}
                        >
                          <img src={MyOrderIcon} alt="" />
                          <span>My Orders</span>
                        </li>
                        <li
                          onClick={() => {
                            navigate("/wishlist");
                            toggleSidebar();
                          }}
                        >
                          <img src={WishlistIcon} alt="" />
                          <span>Wishlist</span>
                        </li>
                        <li
                          onClick={() => {
                            navigate("/cart");
                            toggleSidebar();
                          }}
                        >
                          <img src={CartIcon} alt="" />
                          <span>Cart</span>
                        </li>
                        {isLoggedIn && userdetails?.role === "admin" && (
                          <li
                            onClick={() => {
                              navigate("/admin");
                              toggleSidebar();
                            }}
                          >
                            <img src={AdminIcon} alt="" />
                            <span>Admin Panel</span>
                          </li>
                        )}
                        <li
                          onClick={() => {
                            navigate("/contact");
                            toggleSidebar();
                          }}
                        >
                          <img src={MailUsIcon} alt="" />
                          <span>Contact Us</span>
                        </li>
                      </ul>
                    </nav>

                    {isLoggedIn && (
                      <footer className="sidebar-footer">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            await signOut({ redirectUrl: "/" });
                            toggleSidebar();
                          }}
                        >
                          <img src={LogOutIcon} alt="Log out" />
                          <span>Log Out</span>
                        </button>
                      </footer>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* ===== /Mobile View ===== */}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
