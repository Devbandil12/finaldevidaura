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

// Assets
// Ensure these paths are correct relative to where Navbar.jsx is located
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Renamed from isOpen to isSidebarOpen for clarity
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
  const wishlistCount = wishlist.length; // Ensure wishlist count is also used

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
    // Cleanup function
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
      const isVisible = currentScroll < lastScrollTop || currentScroll < 10; // Always show if near top

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
    const mainBar = document.getElementById("navbar"); // top fixed bar

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
      gsap.set([".main-nav-links li", ".nav-utility-icons > *", ".nav-brand-logo"], {
        willChange: "transform, opacity",
        force3D: true,
      });

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".nav-brand-logo", { y: -8, autoAlpha: 0, duration: 0.26 })
        .from(
          ".main-nav-links li",
          { y: -8, autoAlpha: 0, duration: 0.22, stagger: 0.05 },
          "-=0.06"
        )
        .from(
          ".nav-utility-icons > *",
          { y: -8, autoAlpha: 0, duration: 0.2, stagger: 0.05 },
          "-=0.1"
        )
        .add(() => {
          gsap.set([".main-nav-links li", ".nav-utility-icons > *", ".nav-brand-logo"], {
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
      const headerSel = ".sidebar-header";
      const itemsSel = ".sidebar-nav li";
      const footerSel = ".sidebar-footer";

      // Reset any leftover styles
      gsap.set([headerSel, itemsSel, footerSel], { clearProps: "all" });

      // Start stagger *immediately* when sidebar opens
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(headerSel, { y: -8, opacity: 0, duration: 0.22 })
        .from(itemsSel, { y: 8, opacity: 0, duration: 0.2, stagger: 0.05 }, "-=0.04")
        .from(footerSel, { y: 6, opacity: 0, duration: 0.18 }, "-=0.08");
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
      tl.from(".profile-dropdown-content", { y: -10, autoAlpha: 0, duration: 0.18 })
        .from(
          ".profile-dropdown-content ul li",
          { y: 6, autoAlpha: 0, duration: 0.18, stagger: 0.04 },
          "-=0.04"
        );
    }, profileAnimScopeRef);

    return () => ctx.revert();
  }, [isProfileOpen]);

  return (
    <header ref={navRef}>
      <nav
        id="navbar"
        className={`devidaura-navbar ${navbarVisible ? "navbar-visible" : "navbar-hidden"}`}
      >
        {/* Navbar Left Section: Brand Logo & Main Navigation (Desktop) */}
        <div className="nav-left-section">
          {/* Brand Logo */}
          <div className="nav-brand-logo">
            <a className="logo" onClick={() => navigate("/")}>
              <h1>DEVI<span className="text-accent">DAURA</span></h1>
            </a>
          </div>

          {/* Main Navigation Links (Desktop) */}
          <ul className="main-nav-links">
            <li>
              <a onClick={() => navigate("/")}>Home</a>
            </li>
            <li>
              <a
                onClick={() =>
                  document
                    .getElementById("products-section")
                    ?.scrollIntoView({ behavior: "smooth" })
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
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Shop
              </a>
            </li>
          </ul>
        </div>

        {/* Navbar Right Section: Utility Icons & Mobile Menu */}
        <div className="nav-right-section">
          <div className="nav-utility-icons">
            {/* Wishlist */}
            <div className="nav-icon-wrapper">
              <a onClick={() => navigate("/wishlist")}>
                <button aria-label="Wishlist" className="icon-btn">
                  <img src={WishlistIcon} alt="Wishlist" />
                  {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
                </button>
              </a>
            </div>

            {/* Cart */}
            <div className="nav-icon-wrapper">
              <a onClick={() => navigate("/cart")}>
                <button aria-label="Cart" className="icon-btn">
                  <img src={CartIcon} alt="Cart" />
                  {cartCount > 0 && <span className="badge">{cartCount}</span>}
                </button>
              </a>
            </div>

            {/* Profile / Sign In */}
            {isLoggedIn ? (
              <div className="profile-wrapper" ref={profileWrapperRef}>
                <div className="profile-icon" ref={profileAnimScopeRef}>
                  <button
                    aria-label="Profile menu"
                    onClick={() => setIsProfileOpen((v) => !v)}
                    aria-expanded={isProfileOpen}
                    aria-controls="profileDropdownContent"
                    className="icon-btn profile-btn"
                  >
                    <img src={ProfileIcon} alt="Profile" />
                  </button>
                </div>

                {/* Profile Dropdown */}
                <div
                  className={`profile-dropdown-content ${isProfileOpen ? "active" : "hidden"}`}
                  id="profileDropdownContent"
                >
                  <div className="dropdown-user-info">
                    <img src={UserIcon} alt="User" className="user-avatar" />
                    <div className="user-details">
                      <h3>{userdetails?.name || "User"}</h3>
                      <p>{user?.primaryEmailAddress?.emailAddress || "N/A"}</p>
                    </div>
                  </div>

                  <ul className="dropdown-links">
                    <li
                      onClick={() => {
                        navigate("/myorder");
                        setIsProfileOpen(false);
                      }}
                    >
                      <img src={MyOrderIcon} alt="" />
                      <span>My Orders</span>
                    </li>
                    <li
                      onClick={() => {
                        navigate("/contact");
                        setIsProfileOpen(false);
                      }}
                    >
                      <img src={MailUsIcon} alt="" />
                      <span>Contact Us</span>
                    </li>
                    {isLoggedIn && user && userdetails?.role === "admin" && (
                      <li
                        onClick={() => {
                          navigate("/admin");
                          setIsProfileOpen(false);
                        }}
                      >
                        <img src={AdminIcon} alt="" />
                        <span>Admin Panel</span>
                      </li>
                    )}
                    <li
                      className="logout-link"
                      onClick={async (e) => {
                        e.preventDefault();
                        await signOut({ redirectUrl: "/" });
                        setIsProfileOpen(false);
                      }}
                    >
                      <span>Log Out</span>
                      <img src={LogOutIcon} alt="Log out" />
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="desktop-signin-button">
                <button className="btn-primary" onClick={() => navigate("/login")}>
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="mobile-menu-toggle" ref={sidebarScopeRef}>
            <button
              aria-label="Open menu"
              className="menu-icon"
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
            <div className={`sidebar ${isSidebarOpen ? "open" : ""}`} id="sidebar">
              <header className="sidebar-header">
                <div className="sidebar-user-avatar-section">
                  <img src={UserIcon} alt="User" />
                  <h4>{userdetails?.name || "Guest"}</h4>
                </div>
                {isLoggedIn ? (
                  <p className="sidebar-user-email">
                    {user?.primaryEmailAddress?.emailAddress || "N/A"}
                  </p>
                ) : (
                  <button className="btn-primary sidebar-signin-btn" onClick={() => navigate("/login")}>
                    Login / Sign Up
                  </button>
                )}
                <button className="sidebar-close-btn" onClick={toggleSidebar} aria-label="Close menu">
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
                    className="btn-text-icon logout-btn"
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
      </nav>
    </header>
  );
};

export default Navbar;