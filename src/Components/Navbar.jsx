// src/Components/Navbar.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShoppingCart,
  FaHeart,
  FaUserCircle,
  FaSignOutAlt,
  FaBoxOpen,
  FaEnvelope,
  FaUserShield,
} from "react-icons/fa";

import { useUser, useClerk } from "@clerk/clerk-react";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

import "../style/navbar.css"; // keep for hamburger only

const Navbar = () => {
  const { wishlist, cart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);

  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isLoggedIn = isSignedIn;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);

  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen((v) => !v);

  // Hide navbar on scroll
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      setNavbarVisible(currentScroll < lastScrollTop);
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sidebar animation variants
  const sidebarVariants = {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: {
        type: "tween",
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
    exit: { x: "100%", transition: { duration: 0.25 } },
  };

  const linkVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <header
      className="fixed w-full z-50"
      style={{ top: navbarVisible ? "0" : "-70px", transition: "top 0.3s ease-in-out" }}
    >
      <nav className="flex items-center justify-between px-6 py-3 backdrop-blur-lg bg-white/70 shadow-md border-b">
        {/* Brand */}
        <div onClick={() => navigate("/")} className="cursor-pointer select-none">
          <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            DEVIDAURA
          </h1>
        </div>

        {/* Links */}
        <div className="hidden md:flex space-x-8 font-semibold text-gray-800">
          <a onClick={() => navigate("/")} className="hover:text-gray-600 cursor-pointer">
            Home
          </a>
          <a
            onClick={() =>
              document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })
            }
            className="hover:text-gray-600 cursor-pointer"
          >
            Collection
          </a>
          <a
            onClick={() =>
              document.getElementById("shop-section")?.scrollIntoView({ behavior: "smooth" })
            }
            className="hover:text-gray-600 cursor-pointer"
          >
            Shop
          </a>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-5">
          {/* Wishlist */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => navigate("/wishlist")}
            className="relative text-gray-700 hover:text-black"
          >
            <FaHeart size={22} />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white rounded-full px-2 font-bold">
                {wishlist.length}
              </span>
            )}
          </motion.button>

          {/* Cart */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => navigate("/cart")}
            className="relative text-gray-700 hover:text-black"
          >
            <FaShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full px-2 font-bold">
                {cart.length}
              </span>
            )}
          </motion.button>

          {/* Profile / Auth */}
          {isLoggedIn ? (
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsProfileOpen((v) => !v)}
                className="text-gray-700 hover:text-black"
              >
                <FaUserCircle size={26} />
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-lg border p-3"
                  >
                    <div className="px-2 py-2 border-b">
                      <h3 className="font-bold text-gray-900">{userdetails?.name}</h3>
                      <p className="text-sm text-gray-500">
                        {user?.primaryEmailAddress?.emailAddress || "N/A"}
                      </p>
                    </div>
                    <ul className="mt-2 space-y-2">
                      <li onClick={() => navigate("/myorder")} className="flex items-center gap-2 cursor-pointer hover:text-black">
                        <FaBoxOpen /> My Orders
                      </li>
                      <li onClick={() => navigate("/contact")} className="flex items-center gap-2 cursor-pointer hover:text-black">
                        <FaEnvelope /> Contact Us
                      </li>
                      {userdetails?.role === "admin" && (
                        <li onClick={() => navigate("/admin")} className="flex items-center gap-2 cursor-pointer hover:text-black">
                          <FaUserShield /> Admin Panel
                        </li>
                      )}
                      <li
                        onClick={async () => {
                          await signOut({ redirectUrl: "/" });
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-2 text-red-600 cursor-pointer"
                      >
                        <FaSignOutAlt /> Log Out
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-1.5 rounded-lg bg-black text-white font-semibold hover:opacity-90"
            >
              Sign Up
            </button>
          )}

          {/* Mobile Hamburger (unchanged) */}
          <div className="md:hidden flex items-center">
            <div className="mobile-view">
              <div className="menu-icon" onClick={toggleSidebar}>
                <div className="menu-container">
                  <div className={`hamburger ${isOpen ? "active" : ""}`} id="hamburger">
                    <div className="line" />
                    <div className="line" />
                    <div className="line" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar with swipe gesture */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={toggleSidebar}
            />

            {/* Sidebar */}
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.x > 100) toggleSidebar(); // swipe right to close
              }}
              className="fixed top-0 right-0 h-screen w-72 bg-white z-50 shadow-xl flex flex-col"
            >
              <header className="p-4 border-b flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{userdetails?.name || "Guest"}</h4>
                  {isLoggedIn && (
                    <p className="text-sm text-gray-500">
                      {user?.primaryEmailAddress?.emailAddress || "N/A"}
                    </p>
                  )}
                </div>
                {!isLoggedIn && (
                  <button
                    className="bg-black text-white px-3 py-1 rounded-md"
                    onClick={() => navigate("/login")}
                  >
                    Login / Sign Up
                  </button>
                )}
                <button className="text-lg" onClick={toggleSidebar}>
                  ✕
                </button>
              </header>

              <nav className="p-4 flex-1 overflow-y-auto">
                <motion.ul className="space-y-4 font-semibold">
                  <motion.li variants={linkVariants} onClick={() => { navigate("/myorder"); toggleSidebar(); }} className="flex items-center gap-2 cursor-pointer">
                    <FaBoxOpen /> My Orders
                  </motion.li>
                  <motion.li variants={linkVariants} onClick={() => { navigate("/wishlist"); toggleSidebar(); }} className="flex items-center gap-2 cursor-pointer">
                    <FaHeart /> Wishlist
                  </motion.li>
                  <motion.li variants={linkVariants} onClick={() => { navigate("/cart"); toggleSidebar(); }} className="flex items-center gap-2 cursor-pointer">
                    <FaShoppingCart /> Cart
                  </motion.li>
                  {isLoggedIn && userdetails?.role === "admin" && (
                    <motion.li variants={linkVariants} onClick={() => { navigate("/admin"); toggleSidebar(); }} className="flex items-center gap-2 cursor-pointer">
                      <FaUserShield /> Admin Panel
                    </motion.li>
                  )}
                  <motion.li variants={linkVariants} onClick={() => { navigate("/contact"); toggleSidebar(); }} className="flex items-center gap-2 cursor-pointer">
                    <FaEnvelope /> Contact Us
                  </motion.li>
                </motion.ul>
              </nav>

              {isLoggedIn && (
                <footer className="p-4 border-t">
                  <motion.button
                    variants={linkVariants}
                    onClick={async () => {
                      await signOut({ redirectUrl: "/" });
                      toggleSidebar();
                    }}
                    className="flex items-center gap-2 text-red-600 font-bold"
                  >
                    <FaSignOutAlt /> Log Out
                  </motion.button>
                </footer>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
