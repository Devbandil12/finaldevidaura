// src/Components/Navbar.js

import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ------------------------------------------------------------------
// Asset Imports
// ------------------------------------------------------------------
import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolated.png";
import MyOrderIcon from "../assets/order-svgrepo-com.svg";
import MailUsIcon from "../assets/mail-svgrepo-com.svg";
import LogOutIcon from "../assets/logout-svgrepo-com.svg";
import CartIcon from "../assets/cart-svgrepo-com.svg";
import AdminIcon from "../assets/admin.png";
import WishlistIcon from "../assets/wishlist-svgrepo-com.svg";
import ProfileIcon from "../assets/profile-simple-svgrepo-com.svg";

// ------------------------------------------------------------------
// CSS Import
// ------------------------------------------------------------------
import "../style/navbar.css";

// Import Clerk hooks
import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";
// Import Cart Context
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

const Navbar = () => {
  const { wishlist, cart } = useContext(CartContext);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const isLoggedIn = isSignedIn;

  // State to control profile dropdown
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // State to control mobile sidebar
  const [isOpen, setIsOpen] = useState(false);
  // State to control navbar visibility (hide on scroll down, show on scroll up)
  const [navbarVisible, setNavbarVisible] = useState(true);

  // Create a ref for the profile container
  const profileContainerRef = useRef(null);
  const { userdetails } = useContext(UserContext);

  // Update cart count when cart changes
  useEffect(() => {
    if (cart) setCartCount(cart.length);
  }, [cart]);

  // Toggle the mobile sidebar
  const toggleSidebar = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [isOpen]);

  // Hide navbar on scroll down and show on scroll up
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll > lastScrollTop) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile dropdown on clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileContainerRef]);

  // Close profile dropdown when navigating to another route
  useEffect(() => {
    const handleRouteChange = () => {
      setIsProfileOpen(false);
    };

    // Listen for route changes and close the profile dropdown
    navigate(handleRouteChange);
  }, [navigate]);

  // Close profile dropdown when clicking any <li> inside the dropdown
  const closeProfileDropdownOnClick = () => {
    setIsProfileOpen(false);
  };

  // Close profile dropdown on scrolling
  useEffect(() => {
    const handleScrollProfile = () => {
      if (isProfileOpen) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("scroll", handleScrollProfile);
    return () => window.removeEventListener("scroll", handleScrollProfile);
  }, [isProfileOpen]);

  return (
    <header>
      <nav
        id="navbar"
        style={{
          top: navbarVisible ? "0" : "-80px",
          transition: "top 0.3s ease-in-out",
        }}
      >
        {/* ------------------ Part 1: Logo ------------------ */}
        <div className="part-1">
          <a className="logo" onClick={() => navigate("/")}>
            <h1>DEVIDAURA</h1>
          </a>
        </div>

        {/* ------------------ Part 2: Navigation Links ------------------ */}
        <div className="part-2">
          <ul className="nav-links">
            <li>
              <a onClick={() => navigate("/")}>Home</a>
            </li>
            <li>
              <a
                onClick={() =>
                  document
                    .getElementById("products-section")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Collection
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  document
                    .getElementById("shop-section")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Shop
              </a>
            </li>
          </ul>
        </div>

        {/* ------------------ Part 3: User Icons & Sidebar ------------------ */}
        <div className="part-3">
          <div className="icons">
            {/* Wishlist Icon */}
            <div className="wishlist-icon">
              <a onClick={() => navigate("/wishlist")}>
                <button id="wishlist-icon">
                  <img
                    className="wishlist-img"
                    src={WishlistIcon}
                    alt="wishlist"
                  />
                  <span id="wishlist-count">
                    {wishlist.length >= 0 ? wishlist.length : 0}
                  </span>
                </button>
              </a>
            </div>
            {/* Cart Icon */}
            <div className="cart-icon">
              <a onClick={() => navigate("/cart")}>
                <button id="cart-icon">
                  <img src={CartIcon} alt="Cart" />
                  <span id="cart-count" className={`${!cartCount}`}>
                    {cartCount >= 0 ? cartCount : ""}
                  </span>
                </button>
              </a>
            </div>
            {/* Login/SignUp or Profile */}
            {isLoggedIn ? (
              <div className="profile-icon" id="profile-btn">
                <button
                  id="profileButton"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <img src={ProfileIcon} alt="Profile" />
                </button>
              </div>
            ) : (
              <SignInButton>
                <div id="loginSignupButtons">
                  <button id="loginButton">
                    <span className="btn-text">Sign Up</span>
                  </button>
                </div>
              </SignInButton>
            )}

            {/* Profile Dropdown Content */}
            {isLoggedIn && user && (
              <div className="profile-container" ref={profileContainerRef}>
                <div
                  className={`profile-content ${
                    isProfileOpen ? "active" : "hidden"
                  }`}
                  id="profileContent"
                >
                  <div className="desktop-profile-info">
                    <img
                      src={UserIcon}
                      alt="User Image"
                      className="mob-profile-img"
                      id="mob-profile-img"
                    />
                    <div className="user-data">
                      <h3 id="profile-name">{user.fullName}</h3>
                      <p id="profile-email">
                        {user.primaryEmailAddress?.emailAddress ||
                          user.primaryEmailAddress.emailAddress ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                  <ul>
                    <li
                      onClick={() => {
                        navigate("/myorder");
                        closeProfileDropdownOnClick();
                      }}
                    >
                      <img src={MyOrderIcon} alt="" />
                      <a>My Orders</a>
                    </li>
                    <li
                      onClick={() => {
                        navigate("/contact");
                        closeProfileDropdownOnClick();
                      }}
                    >
                      <img src={MailUsIcon} alt="" />
                      <a>Contact Us</a>
                    </li>
                    {isLoggedIn && user && userdetails?.role === "admin" && (
                      <li
                        onClick={() => {
                          navigate("/admin");
                          closeProfileDropdownOnClick();
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
                        closeProfileDropdownOnClick();
                      }}
                    >
                      <a id="logout-btn-2">Log Out</a>
                      <img src={LogOutIcon} alt="" />
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* ------------------ Mobile View Sidebar ------------------ */}
            <div className="part-1">
              <div className="mobile-view">
                <div className="menu-icon" onClick={toggleSidebar}>
                  {/* hamburger unchanged */}
                  <div className="menu-container">
                    <div
                      className={`hamburger ${isOpen ? "active" : ""}`}
                      id="hamburger"
                    >
                      <div className="line" />
                      <div className="line" />
                      <div className="line" />
                    </div>
                  </div>
                  {/* redesigned sidebar content */}
                  <div
                    className={`sidebar ${isOpen ? "open" : ""}`}
                    id="sidebar"
                  >
                    <header className="sidebar-header">
                      <img src={UserIcon} alt="User" />
                      {isLoggedIn ? (
                        <div className="sidebar-user">
                          <h4>{user.fullName}</h4>
                          <p>
                            {user.primaryEmailAddress?.emailAddress || "N/A"}
                          </p>
                        </div>
                      ) : (
                        <SignInButton>
                          <button className="sidebar-signin">
                            Login / Sign Up
                          </button>
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
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
