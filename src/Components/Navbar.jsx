// src/Components/Navbar.jsx
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

// Icons (Lucide outline from react-icons/lu)
import {
  LuShoppingCart,
  LuHeart,
  LuUser,
  LuLogOut,
  LuPackage,
  LuMail,
  LuShield,
} from "react-icons/lu";

// Assets
import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolated.png";

// CSS
import "../style/navbar.css";

// Clerk
import { useUser, useClerk } from "@clerk/clerk-react";

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
  const navRef = useRef(null);
  const sidebarScopeRef = useRef(null);
  const profileAnimScopeRef = useRef(null);
  const profileWrapperRef = useRef(null);
  const profileContainerRef = useRef(null);

  // Hamburger toggle
  const toggleSidebar = (e) => {
    e.preventDefault();
    setIsOpen((v) => !v);
  };

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    document.documentElement.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);

  // Hide navbar on scroll down, show on scroll up
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

  // Outside click to close profile
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

  // GSAP page-load animation
  useLayoutEffect(() => {
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

  return (
    <header ref={navRef}>
      <nav
        id="navbar"
        style={{
          top: navbarVisible ? "0" : "-50px",
          transition: "top 0.3s ease-in-out",
        }}
      >
        {/* LEFT: Brand */}
        <div className="part-1 nav-brand">
          <a className="logo" onClick={() => navigate("/")}>
            <h1>DEVIDAURA</h1>
          </a>
        </div>

        {/* CENTER: Links */}
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
        <div className="part-3">
          <div className="icons">
            {/* Wishlist */}
            <div className="wishlist-icon">
              <a onClick={() => navigate("/wishlist")}>
                <button id="wishlist-icon" className="icon-btn">
                  <LuHeart size={22} />
                  <span id="wishlist-count">{wishlist.length}</span>
                </button>
              </a>
            </div>

            {/* Cart */}
            <div className="cart-icon">
              <a onClick={() => navigate("/cart")}>
                <button id="cart-icon" className="icon-btn">
                  <LuShoppingCart size={22} />
                  <span id="cart-count">{cart.length}</span>
                </button>
              </a>
            </div>

            {/* Profile / Sign in */}
            {isLoggedIn ? (
              <div className="profile-wrapper" ref={profileWrapperRef}>
                <div
                  className="profile-icon"
                  id="profile-btn"
                  ref={profileAnimScopeRef}
                >
                  <button
                    id="profileButton"
                    onClick={() => setIsProfileOpen((v) => !v)}
                    aria-expanded={isProfileOpen}
                    aria-controls="profileContent"
                  >
                    <LuUser size={26} />
                  </button>
                </div>

                {/* Profile Dropdown */}
                <div className="profile-container" ref={profileContainerRef}>
                  <div
                    className={`profile-content ${
                      isProfileOpen ? "active" : "hidden"
                    }`}
                    id="profileContent"
                  >
                    <div className="desktop-profile-info">
                      <img src={UserIcon} alt="User" />
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
                        <LuPackage size={18} /> <a>My Orders</a>
                      </li>
                      <li
                        onClick={() => {
                          navigate("/contact");
                          setIsProfileOpen(false);
                        }}
                      >
                        <LuMail size={18} /> <a>Contact Us</a>
                      </li>
                      {userdetails?.role === "admin" && (
                        <li
                          onClick={() => {
                            navigate("/admin");
                            setIsProfileOpen(false);
                          }}
                        >
                          <LuShield size={18} /> <a>Admin Panel</a>
                        </li>
                      )}
                      <li
                        className="logout"
                        onClick={async (e) => {
                          e.preventDefault();
                          await signOut({ redirectUrl: "/" });
                          setIsProfileOpen(false);
                        }}
                      >
                        <LuLogOut size={18} /> <a>Log Out</a>
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

            {/* ===== Mobile View: Hamburger + Sidebar (UNCHANGED) ===== */}
            <div className="part-1">
              <div className="mobile-view" ref={sidebarScopeRef}>
                <div className="menu-icon" onClick={toggleSidebar}>
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

                  {/* Sidebar */}
                  <div
                    className={`sidebar ${isOpen ? "open" : ""}`}
                    id="sidebar"
                  >
                    <header className="sidebar-header">
                      <div className="sidebar-user-avt-img">
                        <img src={UserIcon} alt="User" />
                        <h4>{userdetails?.name || "Guest"}</h4>
                      </div>
                      {isLoggedIn ? (
                        <div className="sidebar-user">
                          <p>
                            {user?.primaryEmailAddress?.emailAddress || "N/A"}
                          </p>
                        </div>
                      ) : (
                        <button
                          className="sidebar-signin"
                          onClick={() => navigate("/login")}
                        >
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
                          <LuPackage size={20} /> <span>My Orders</span>
                        </li>
                        <li
                          onClick={() => {
                            navigate("/wishlist");
                            toggleSidebar();
                          }}
                        >
                          <LuHeart size={20} /> <span>Wishlist</span>
                        </li>
                        <li
                          onClick={() => {
                            navigate("/cart");
                            toggleSidebar();
                          }}
                        >
                          <LuShoppingCart size={20} /> <span>Cart</span>
                        </li>
                        {isLoggedIn && userdetails?.role === "admin" && (
                          <li
                            onClick={() => {
                              navigate("/admin");
                              toggleSidebar();
                            }}
                          >
                            <LuShield size={20} /> <span>Admin Panel</span>
                          </li>
                        )}
                        <li
                          onClick={() => {
                            navigate("/contact");
                            toggleSidebar();
                          }}
                        >
                          <LuMail size={20} /> <span>Contact Us</span>
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
                          <LuLogOut size={20} /> <span>Log Out</span>
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
