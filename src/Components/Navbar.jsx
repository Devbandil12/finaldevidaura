// src/Components/Navbar.js
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

// React Icons - Choose the best ones from here!
// I'm using Font Awesome (Fa) as an example. You can explore others like Io (Ionicons), Md (Material Design), etc.
import {
  FaBars,        // Hamburger icon
  FaHeart,       // Wishlist
  FaShoppingCart, // Cart
  FaUserCircle,  // Profile
  FaSignOutAlt,  // Logout
  FaBox,         // My Orders
  FaEnvelope,    // Contact Us
  FaUserShield,  // Admin Panel
} from 'react-icons/fa';

// CSS (for global font and preserved hamburger animation)
import "../style/navbar.css";

// Clerk
import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";

// Contexts
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

// GSAP
import { gsap } from "gsap";

const Navbar = ({ onVisibilityChange }) => {
  const { wishlist, cart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);

  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isLoggedIn = isSignedIn;

  const navigate = useNavigate();

  // ---- Refs ----
  const navRef = useRef(null);
  const sidebarScopeRef = useRef(null);
  const profileAnimScopeRef = useRef(null);
  const profileWrapperRef = useRef(null);

  // -------------------------
  // Counts
  // -------------------------
  const cartCount = cart.length;
  const wishlistCount = wishlist.length;

  // -------------------------
  // Hamburger / Sidebar toggle
  // -------------------------
  const toggleSidebar = (e) => {
    e.preventDefault();
    setIsSidebarOpen((v) => !v);
  };

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, [isSidebarOpen]);

  // -------------------------
  // Hide navbar on scroll down, show on scroll up
  // -------------------------
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;
      const isVisible = currentScroll < lastScrollTop || currentScroll < 10;

      setNavbarVisible(isVisible);
      if (onVisibilityChange) onVisibilityChange(isVisible);

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onVisibilityChange]);

  // -------------------------
  // Outside click to close profile
  // -------------------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileWrapperRef.current &&
        !profileWrapperRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  // Close profile dropdown on scroll
  useEffect(() => {
    const handleScrollProfile = () => {
      if (isProfileOpen) setIsProfileOpen(false);
    };
    window.addEventListener("scroll", handleScrollProfile);
    return () => window.removeEventListener("scroll", handleScrollProfile);
  }, [isProfileOpen]);

  // ===========================================================
  // Compute sidebar top offset (main navbar)
  // ===========================================================
  const updateSidebarOffset = useCallback(() => {
    const mainBar = document.getElementById("navbar");

    const visibleHeight = (el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, window.innerHeight);
      return Math.max(0, bottom - top);
    };

    const offset = visibleHeight(mainBar);
    document.documentElement.style.setProperty(
      "--sidebar-top",
      `${offset}px`
    );
  }, []);

  // Run on mount + resize/orientation change + observe bars
  useLayoutEffect(() => {
    updateSidebarOffset();
    const onRes = () => updateSidebarOffset();
    window.addEventListener("resize", onRes);
    window.addEventListener("orientationchange", onRes);

    const ro = new ResizeObserver(updateSidebarOffset);
    const mainBar = document.getElementById("navbar");

    if (mainBar) ro.observe(mainBar);

    return () => {
      window.removeEventListener("resize", onRes);
      window.removeEventListener("orientationchange", onRes);
      ro.disconnect();
    };
  }, [updateSidebarOffset]);

  // Update when main bar hides/shows
  useEffect(() => {
    updateSidebarOffset();
  }, [navbarVisible, updateSidebarOffset]);

  // =======================
  // GSAP: Page-load stagger
  // =======================
  useLayoutEffect(() => {
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.set([".nav-main-link", ".nav-icon-btn", ".nav-brand-logo-text"], {
        willChange: "transform, opacity",
        force3D: true,
      });

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".nav-brand-logo-text", { y: -8, autoAlpha: 0, duration: 0.26 })
        .from(
          ".nav-main-link",
          { y: -8, autoAlpha: 0, duration: 0.22, stagger: 0.05 },
          "-=0.06"
        )
        .from(
          ".nav-icon-btn",
          { y: -8, autoAlpha: 0, duration: 0.2, stagger: 0.05 },
          "-=0.1"
        )
        .add(() => {
          gsap.set([".nav-main-link", ".nav-icon-btn", ".nav-brand-logo-text"], {
            willChange: "auto",
          });
        });
    }, navRef);

    return () => ctx.revert();
  }, []);

  // =======================
  // GSAP: Sidebar stagger (start immediately)
  // =======================
  useEffect(() => {
    if (!isSidebarOpen) return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".sidebar-header-section", { y: -8, opacity: 0, duration: 0.22 })
        .from(".sidebar-nav-item", { y: 8, opacity: 0, duration: 0.2, stagger: 0.05 }, "-=0.04")
        .from(".sidebar-footer-section", { y: 6, opacity: 0, duration: 0.18 }, "-=0.08");
    }, sidebarScopeRef);

    return () => ctx.revert();
  }, [isSidebarOpen]);


  // ==============================
  // GSAP: Profile dropdown reveal
  // ==============================
  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    if (!isProfileOpen) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".profile-dropdown-menu", { y: -10, autoAlpha: 0, duration: 0.18 })
        .from(
          ".profile-dropdown-menu-item",
          { y: 6, autoAlpha: 0, duration: 0.18, stagger: 0.04 },
          "-=0.04"
        );
    }, profileAnimScopeRef);

    return () => ctx.revert();
  }, [isProfileOpen]);

  return (
    <header ref={navRef} className="font-inter">
      <nav
        id="navbar"
        className={`devidaura-navbar fixed w-full z-50 transition-transform duration-300 ease-in-out font-inter
          ${navbarVisible ? "translate-y-0" : "-translate-y-full"}
          bg-white/90 backdrop-blur-md md:bg-transparent md:backdrop-blur-none
          lg:bg-transparent lg:backdrop-blur-none`}
      >
        {/* Navbar Left Section: Brand Logo & Main Navigation (Desktop) */}
        <div className="flex items-center space-x-8 lg:space-x-12">
          {/* Brand Logo */}
          <div className="nav-brand-logo">
            <a className="text-2xl font-extrabold text-gray-900 cursor-pointer nav-brand-logo-text" onClick={() => navigate("/")}>
              DEVI<span className="text-blue-600">DAURA</span>
            </a>
          </div>

          {/* Main Navigation Links (Desktop) */}
          <ul className="hidden lg:flex items-center space-x-6">
            <li>
              <a onClick={() => navigate("/")} className="nav-main-link text-gray-700 hover:text-blue-600 relative group text-lg font-medium transition-colors">
                Home
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  document
                    .getElementById("products-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="nav-main-link text-gray-700 hover:text-blue-600 relative group text-lg font-medium transition-colors"
              >
                Collection
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  document
                    .getElementById("shop-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="nav-main-link text-gray-700 hover:text-blue-600 relative group text-lg font-medium transition-colors"
              >
                Shop
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
          </ul>
        </div>

        {/* Navbar Right Section: Utility Icons & Mobile Menu */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Wishlist */}
            <div className="relative">
              <a onClick={() => navigate("/wishlist")} aria-label="Wishlist">
                <button className="nav-icon-btn p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                  <FaHeart className="w-6 h-6 text-gray-700" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </a>
            </div>

            {/* Cart */}
            <div className="relative">
              <a onClick={() => navigate("/cart")} aria-label="Cart">
                <button id="cart-icon" className="nav-icon-btn p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                  <FaShoppingCart className="w-6 h-6 text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              </a>
            </div>

            {/* Profile / Sign In */}
            {isLoggedIn ? (
              <div className="relative" ref={profileWrapperRef}>
                <button
                  aria-label="Profile menu"
                  onClick={() => setIsProfileOpen((v) => !v)}
                  aria-expanded={isProfileOpen}
                  className="nav-icon-btn w-10 h-10 rounded-full border-2 border-transparent hover:border-blue-500 transition-colors flex items-center justify-center"
                  ref={profileAnimScopeRef}
                >
                  <FaUserCircle className="w-7 h-7 text-gray-700" />
                </button>

                {/* Profile Dropdown */}
                <div
                  className={`profile-dropdown-menu absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl py-2 ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-out z-50
                    ${isProfileOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
                  id="profileDropdownContent"
                >
                  <div className="px-4 py-2 border-b border-gray-100 mb-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {userdetails?.name || user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.primaryEmailAddress?.emailAddress || "N/A"}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    <li
                      onClick={() => {
                        navigate("/myorder");
                        setIsProfileOpen(false);
                      }}
                      className="profile-dropdown-menu-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer space-x-3"
                    >
                      <FaBox className="w-5 h-5 text-gray-500" />
                      <span>My Orders</span>
                    </li>
                    <li
                      onClick={() => {
                        navigate("/contact");
                        setIsProfileOpen(false);
                      }}
                      className="profile-dropdown-menu-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer space-x-3"
                    >
                      <FaEnvelope className="w-5 h-5 text-gray-500" />
                      <span>Contact Us</span>
                    </li>
                    {isLoggedIn && user && userdetails?.role === "admin" && (
                      <li
                        onClick={() => {
                          navigate("/admin");
                          setIsProfileOpen(false);
                        }}
                        className="profile-dropdown-menu-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer space-x-3"
                      >
                        <FaUserShield className="w-5 h-5 text-gray-500" />
                        <span>Admin Panel</span>
                      </li>
                    )}
                    <li
                      className="profile-dropdown-menu-item flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer space-x-3 border-t border-gray-100 mt-2 pt-2"
                      onClick={async (e) => {
                        e.preventDefault();
                        await signOut({ redirectUrl: "/" });
                        setIsProfileOpen(false);
                      }}
                    >
                      <FaSignOutAlt className="w-5 h-5 text-red-500" />
                      <span>Log Out</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="hidden lg:block"> {/* Only show signup button on desktop */}
                <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition-all duration-300" onClick={() => navigate("/login")}>
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="lg:hidden" ref={sidebarScopeRef}>
            <button
              aria-label="Open menu"
              className="menu-icon p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={toggleSidebar}
            >
              <div className="menu-container">
                <div className={`hamburger ${isSidebarOpen ? "active" : ""}`}>
                  <div className="line" />
                  <div className="line" />
                  <div className="line" />
                </div>
              </div>
            </button>

            {/* Sidebar (Mobile) */}
            <div className={`sidebar fixed inset-y-0 right-0 w-64 md:w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col
              ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
              style={{ top: 'var(--sidebar-top)' }}
            >
              {/* Sidebar Header */}
              <header className="sidebar-header-section p-6 flex flex-col items-start border-b border-gray-200 space-y-4">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <FaUserCircle className="w-10 h-10 text-gray-700" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {userdetails?.name || user?.fullName || "Guest"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {user?.primaryEmailAddress?.emailAddress || "N/A"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <button className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors" onClick={() => navigate("/login")}>
                    Login / Sign Up
                  </button>
                )}
                 {/* No explicit close button needed - hamburger toggles it */}
              </header>

              {/* Sidebar Navigation */}
              <nav className="flex-grow overflow-y-auto p-4">
                <ul className="space-y-1">
                  <li
                    onClick={() => {
                      navigate("/myorder");
                      toggleSidebar();
                    }}
                    className="sidebar-nav-item flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <FaBox className="w-5 h-5 text-gray-500" />
                    <span>My Orders</span>
                  </li>
                  <li
                    onClick={() => {
                      navigate("/wishlist");
                      toggleSidebar();
                    }}
                    className="sidebar-nav-item flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <FaHeart className="w-5 h-5 text-gray-500" />
                    <span>Wishlist</span>
                  </li>
                  <li
                    onClick={() => {
                      navigate("/cart");
                      toggleSidebar();
                    }}
                    className="sidebar-nav-item flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <FaShoppingCart className="w-5 h-5 text-gray-500" />
                    <span>Cart</span>
                  </li>
                  {isLoggedIn && user && userdetails?.role === "admin" && (
                    <li
                      onClick={() => {
                        navigate("/admin");
                        toggleSidebar();
                      }}
                      className="sidebar-nav-item flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <FaUserShield className="w-5 h-5 text-gray-500" />
                      <span>Admin Panel</span>
                    </li>
                  )}
                  <li
                    onClick={() => {
                      navigate("/contact");
                      toggleSidebar();
                    }}
                    className="sidebar-nav-item flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <FaEnvelope className="w-5 h-5 text-gray-500" />
                    <span>Contact Us</span>
                  </li>
                </ul>
              </nav>

              {/* Sidebar Footer */}
              {isLoggedIn && (
                <footer className="sidebar-footer-section p-6 border-t border-gray-200">
                  <button
                    className="flex items-center space-x-3 text-red-600 font-semibold hover:text-red-700 transition-colors w-full justify-center"
                    onClick={async (e) => {
                      e.preventDefault();
                      await signOut({ redirectUrl: "/" });
                      toggleSidebar();
                    }}
                  >
                    <FaSignOutAlt className="w-5 h-5" />
                    <span>Log Out</span>
                  </button>
                </footer>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
