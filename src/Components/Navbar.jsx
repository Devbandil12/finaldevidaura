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
import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolated.png";
import MyOrderIcon from "../assets/order-svgrepo-com.svg";
import MailUsIcon from "../assets/mail-svgrepo-com.svg";
import LogOutIcon from "../assets/logout-svgrepo-com.svg";
import CartIcon from "../assets/cart-svgrepo-com.svg";
import AdminIcon from "../assets/admin.png";
import WishlistIcon from "../assets/wishlist-svgrepo-com.svg";
import ProfileIcon from "../assets/profile-simple-svgrepo-com.svg";

// CSS
import "../style/navbar.css"; // Ensure this path is correct

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
  const [isOpen, setIsOpen] = useState(false); // sidebar
  const [navbarVisible, setNavbarVisible] = useState(true);

  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isLoggedIn = isSignedIn;

  const navigate = useNavigate();

  // ---- Refs ----
  const navRef = useRef(null);            // scope for page-load GSAP
  const sidebarScopeRef = useRef(null);   // scope for sidebar GSAP
  const profileAnimScopeRef = useRef(null); // scope for profile dropdown GSAP
  const profileWrapperRef = useRef(null); // wrapper for outside-click
  const profileContainerRef = useRef(null);

  // -------------------------
  // Counts
  // -------------------------
  const cartCount = cart.length;

  // -------------------------
  // Hamburger toggle
  // -------------------------
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

  // -------------------------
  // Hide navbar on scroll down, show on scroll up
  // -------------------------
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;
      const isVisible = currentScroll < lastScrollTop;

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
  // Compute sidebar top offset (main navbar + MobileBackBar)
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
    gsap.set([".nav-links li", ".icons > *", ".nav-brand"], {
      willChange: "transform, opacity",
      force3D: true,
    });

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
        gsap.set([".nav-links li", ".icons > *", ".nav-brand"], {
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
    if (!isOpen) return;
  
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
  }, [isOpen]);

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
      tl.from(".profile-content", { y: -10, autoAlpha: 0, duration: 0.18 })
        .from(
          ".profile-content ul li",
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
        className={navbarVisible ? "navbar-visible" : "navbar-hidden"}
      >
        {/* LEFT: Brand */}
        <div className="navbar-part-1 nav-brand">
          <a className="logo" onClick={() => navigate("/")}>
            <h1>DEVIDAURA</h1>
          </a>
        </div>

        {/* CENTER: Links (desktop) */}
        <div className="navbar-part-2">
          <ul className="nav-links">
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

        {/* RIGHT: Icons */}
        <div className="navbar-part-3">
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
                    {cart.length >= 0 ? cart.length : ""}
                  </span>
                </button>
              </a>
            </div>

            {/* Profile / Sign in */}
            {isLoggedIn ? (
              <div
                className="profile-wrapper"
                ref={profileWrapperRef}
              >
                <div className="profile-icon" id="profile-btn" ref={profileAnimScopeRef}>
                  <button
                    id="profileButton"
                    onClick={() => setIsProfileOpen((v) => !v)}
                    aria-expanded={isProfileOpen}
                    aria-controls="profileContent"
                  >
                    <img src={ProfileIcon} alt="Profile" />
                  </button>
                </div>

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
                        <h3 id="profile-name">{userdetails?.name}</h3>
                        <p id="profile-email">
                          {user?.primaryEmailAddress?.emailAddress || "N/A"}
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
            <div id="loginSignupButtons" className="desktop-login-signup">
              <button id="loginButton" onClick={() => navigate("/login")}>
                <span className="btn-text">Sign Up</span>
              </button>
            </div>
            )}

            {/* ===== Mobile View: hamburger + sidebar ===== */}
            <div className="mobile-menu-wrapper" ref={sidebarScopeRef}>
              <div className="menu-icon" onClick={toggleSidebar}>
                {/* hamburger unchanged */}
                <div className="menu-container">
                  <div className={`hamburger ${isOpen ? "active" : ""}`} id="hamburger">
                    <div className="line" />
                    <div className="line" />
                    <div className="line" />
                  </div>
                </div>

                {/* Sidebar */}
                <div className={`sidebar ${isOpen ? "open" : ""}`} id="sidebar">
                  <header className="sidebar-header">
                    <div className="sidebar-user-avt-img">
                      <img src={UserIcon} alt="User" />
                      <h4>{userdetails?.name || "Guest"}</h4>
                    </div>
                    {isLoggedIn ? (
                      <div className="sidebar-user">
                        <p>{user?.primaryEmailAddress?.emailAddress || "N/A"}</p>
                      </div>
                    ) : (
                      <button className="sidebar-signin" onClick={() => navigate("/login")}>
                        Login / Sign Up
                      </button>
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
            {/* ===== /Mobile View ===== */}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

