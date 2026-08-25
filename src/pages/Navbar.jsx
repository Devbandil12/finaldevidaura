// src/Components/Navbar.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useContext, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Assets
import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolate.jpeg";

// Clerk
import { useUser, useClerk } from "@clerk/clerk-react";
import { useUserDetails } from "../features/users/hooks/useUsers";
import { useNotifications, useMarkAllAsRead, useClearAllNotifications } from "../features/notifications/hooks/useNotifications";
import { useCart } from "../features/cart/hooks/useCart";
import { useWishlist } from "../features/cart/hooks/useWishlist";
import { usePermissions } from "../features/admin/hooks/usePermissions";

// GSAP
import { gsap } from "gsap";

// Icons
import { BiHomeHeart } from "react-icons/bi";
import { 
  Feather, Bell, ShoppingCart, Sparkles, Store, 
  Heart, User, Package, Mail, LogOut, ShieldCheck,
  Settings, Tag
} from "lucide-react";

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
const SidebarItem = memo(({ icon: Icon, label, to, onClick, badge }) => {
  const commonClasses = "group relative flex items-center cursor-pointer py-3 px-6 transition-colors duration-200 hover:bg-[var(--surface)] w-full text-left font-body";

  const content = (
    <>
      {Icon &&
        (typeof Icon === "string" ? (
          <img src={Icon} alt="" aria-hidden="true" className="w-6 mr-4 grayscale transition-all duration-200 group-hover:grayscale-0 group-hover:scale-105" />
        ) : (
          <Icon className="w-[22px] h-[22px] mr-4 text-[var(--sub)] shrink-0 transition-all duration-200 group-hover:text-[var(--brand)] group-hover:scale-105" aria-hidden="true" strokeWidth={1.5} size={20} />
        ))}
      <span className="text-[0.95rem] text-[var(--text)] grow shadow-none group-hover:text-[var(--brand)] transition-colors">{label}</span>
      {typeof badge === "number" && (
        <span className="text-[0.8rem] font-semibold py-[2px] px-[8px] bg-[var(--surface-muted)] text-[var(--text)] rounded-[12px]" aria-hidden="true">{badge}</span>
      )}
    </>
  );

  if (to) {
    return <li><Link to={to} className={commonClasses} onClick={onClick}>{content}</Link></li>;
  }

  return <li className={commonClasses} onClick={onClick} role="button" tabIndex={0}>{content}</li>;
});

// --- Memoized Notification Item (Redesigned) ---
const NotificationItem = memo(({ notif, onNavigate }) => {
  const handleClick = useCallback(() => {
    onNavigate(notif.link);
  }, [onNavigate, notif.link]);

  // Luxury Icon Resolver
  const getIcon = () => {
    switch(notif.type) {
      case 'order': return <Package size={16} strokeWidth={1.5} className="text-[var(--success)]" />;
      case 'system': return <Settings size={16} strokeWidth={1.5} className="text-[var(--sub)]" />;
      case 'coupon': return <Tag size={16} strokeWidth={1.5} className="text-[var(--accent)]" />;
      default: return <Bell size={16} strokeWidth={1.5} className="text-[var(--brand)]" />;
    }
  };

  return (
    <li
      onClick={handleClick}
      className={`group flex items-start gap-3 p-3 cursor-pointer transition-all duration-200 rounded-xl font-body
      ${notif.isRead ? 'hover:bg-[var(--surface)]' : 'bg-[var(--surface)] hover:bg-[var(--border)]'}`}
    >
      {/* Icon Bubble */}
      <div className={`p-2.5 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-105 border shadow-sm
        ${notif.isRead ? 'bg-[var(--surface)] border-[var(--border)]' : 'bg-[var(--surface)] border-[var(--accent)]/40'}`}>
        {getIcon()}
      </div>
      
      {/* Content */}
      <div className="flex flex-col min-w-0 pt-0.5">
        <span className={`text-[13px] leading-snug !text-[var(--text)] whitespace-normal break-words 
          ${!notif.isRead ? 'font-[600]' : 'font-[500]'}`}>
          {notif.message}
        </span>
        <span className="text-[10px] uppercase tracking-widest font-semibold !text-[var(--muted)] mt-1.5 block">
          {notif.timeAgo}
        </span>
      </div>

      {/* Unread Dot */}
      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-[var(--brand)] mt-2 ml-auto shrink-0 shadow-sm" />
      )}
    </li>
  );
});

const springConfig = { type: "spring", stiffness: 500, damping: 30, mass: 1 };

const Navbar = ({ onVisibilityChange }) => {
  const { data: cart = [] } = useCart();
  const { data: wishlist = [] } = useWishlist();
  const { data: userdetails } = useUserDetails();
  const { role: adminRole } = usePermissions();
  const { data: notifications = [] } = useNotifications();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: clearAllNotifications } = useClearAllNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

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
  const location = useLocation();

  const navRef = useRef(null);
  const sidebarScopeRef = useRef(null);
  const hamburgerRef = useRef(null);
  const profileWrapperRef = useRef(null);
  const notificationRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const cartCount = cart?.length || 0;
  const wishCount = wishlist?.length || 0;

  const toggleProfile = useCallback(() => {
    setIsProfileOpen(prev => {
      if (!prev) setIsNotificationOpen(false);
      return !prev;
    });
  }, []);

  const toggleNotification = useCallback(() => {
    setIsNotificationOpen(prev => {
      if (!prev) setIsProfileOpen(false);
      return !prev;
    });
  }, []);

  const toggleSidebar = useCallback((e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setIsOpen(v => !v);
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

  const handleNotificationClick = useCallback((link) => {
    navigate(link || '/');
    setIsNotificationOpen(false);
  }, [navigate]);

  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const processed = notifications.map(notif => ({
      ...notif,
      date: new Date(notif.createdAt),
      timeAgo: timeAgo(new Date(notif.createdAt), now)
    }));

    return processed.reduce((groups, notif) => {
      const groupKey = getRelativeTimeGroup(notif.date, now);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(notif);
      return groups;
    }, {});
  }, [notifications]);

  useEffect(() => {
    let lastScrollTop = 0;
    let ticking = false;

    const handleScroll = () => {
      setIsProfileOpen(prev => (prev ? false : prev));
      setIsNotificationOpen(prev => (prev ? false : prev));

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
          const scrollDelta = Math.abs(currentScroll - lastScrollTop);

          if (scrollDelta < 10) {
            ticking = false;
            return;
          }

          const isVisible = currentScroll < lastScrollTop || currentScroll < 50;
          setNavbarVisible(isVisible);
          if (onVisibilityChange) onVisibilityChange(isVisible);
          setIsScrolled(currentScroll > 50);

          lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onVisibilityChange]);

  useEffect(() => {
    if (isOpen || isAuthModalOpen) {
      if (isOpen) previouslyFocusedRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (isOpen) {
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

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.set([".nav-links li", ".icons > *", ".nav-brand"], { willChange: "transform, opacity", force3D: true, backfaceVisibility: "hidden" });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".nav-brand", { y: -20, autoAlpha: 0, duration: 0.6 })
        .from(".nav-links li", { y: -20, autoAlpha: 0, duration: 0.5, stagger: 0.05 }, "-=0.4")
        .from(".icons > *", { y: -20, autoAlpha: 0, duration: 0.5, stagger: 0.05 }, "-=0.4")
        .add(() => gsap.set([".nav-links li", ".icons > *", ".nav-brand"], { willChange: "auto" }));
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
      tl.from(headerSel, { y: -10, opacity: 0, duration: 0.3 })
        .from(itemsSel, { x: -20, opacity: 0, duration: 0.25, stagger: 0.04 }, "-=0.15");
      if (isLoggedIn) tl.from(footerSel, { y: 20, opacity: 0, duration: 0.3 }, "-=0.1");
    }, sidebarScopeRef);
    return () => ctx.revert();
  }, [isOpen, isLoggedIn]);

  const primaryLinks = useMemo(() => [
    { label: "Home", icon: BiHomeHeart, to: "/", onClick: closeSidebar },
    { label: "All Products", icon: Store, to: "/products", onClick: closeSidebar },
    { label: "Build Combo", icon: Sparkles, to: "/custom-combo", onClick: closeSidebar },
    { label: "Our Story", icon: (props) => <Feather {...props} strokeWidth={1.75} />, to: "/about", onClick: closeSidebar },
  ], [closeSidebar]);

  const accountLinks = useMemo(() => [
    ...(isLoggedIn ? [{ label: "My Orders", icon: Package, to: "/myorder", onClick: closeSidebar }] : []),
    { label: "Wishlist", icon: Heart, to: "/wishlist", onClick: closeSidebar, badge: wishCount },
    { label: "Cart", icon: ShoppingCart, to: "/cart", onClick: closeSidebar, badge: cartCount },
  ], [isLoggedIn, closeSidebar, wishCount, cartCount]);

  const supportLinks = useMemo(() => [
    { label: "Contact Us", icon: Mail, to: "/contact", onClick: closeSidebar },
  ], [closeSidebar]);

  const isHomePage = location.pathname === "/";
  const navbarTransitionClass = "transition-[transform,width,border-radius,background-color,top,box-shadow,padding] duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";
  
  const navbarBaseClass = `fixed left-0 right-0 mx-auto flex items-center justify-between z-[9999] pointer-events-auto backface-hidden antialiased will-change-[transform,width,border-radius,background-color,top] ${navbarTransitionClass} ${!isHomePage ? "max-[850px]:!bg-[var(--surface)]" : ""}`;

  const navbarStateClass = isScrolled
    ? `w-[95%] sm:w-[96%] max-w-[1440px] h-[60px] top-[10px] rounded-[50px] px-[15px] md:px-[25px] lg:px-[30px] bg-[var(--glass-bg)] backdrop-blur-[12px] saturate-[180%] border border-[var(--border)] shadow-[var(--shadow-strong)] text-[var(--text)]`
    : `w-full h-[60px] top-0 px-[15px] md:px-[2rem] lg:px-[3rem] pt-[0.7rem] rounded-none bg-transparent`;

  const textColorClass = !isScrolled ? "text-[var(--text)] mix-blend-normal shadow-none" : "text-[var(--text)] shadow-none font-normal";
  
  const iconBtnClass = `group relative inline-flex items-center justify-center border-none bg-transparent cursor-pointer p-[5px] min-[400px]:p-[6px] sm:p-[8px] lg:p-[10px] rounded-full transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:bg-[var(--overlay-light)] hover:scale-115 active:scale-95 ${!isScrolled ? "text-[var(--text)]" : "text-[var(--text)] hover:bg-[var(--overlay-light)]"}`;

  return (
    <header ref={navRef} className="w-full flex justify-center items-center z-[9999]">
      <nav id="navbar" className={`${navbarBaseClass} ${navbarStateClass} ${isOpen ? "" : ""}`} style={{ transform: navbarVisible ? "translateY(0)" : "translateY(-180%)" }}>
        
        {/* Brand Container */}
        <div className={`part-1 nav-brand flex items-center shrink-0 z-10 ${textColorClass}`}>
          <Link to="/" className="logo no-underline cursor-pointer">
            <h1 className="text-[1.3rem] sm:text-[1.5rem] md:text-[1.6rem] tracking-[0.5px] m-0 !text-[var(--text)] whitespace-nowrap font-display font-medium">
              DEVID AURA
            </h1>
          </Link>
        </div>

        {/* Desktop Links Container */}
        <div className="part-2 absolute left-1/2 -translate-x-1/2 w-auto hidden min-[850px]:flex items-center justify-center">
          <ul className="nav-links flex gap-[1.2rem] lg:gap-[2.5rem] xl:gap-[3rem] m-0 p-0 list-none">
            {["Home", "Shop", "Build Combo", "Our Story"].map((text, idx) => {
              const paths = ["/", "/products", "/custom-combo", "/about"];
              return (
                <li key={text} className="text-[1.1rem] lg:text-[1.2rem] cursor-pointer">
                  <Link
                    to={paths[idx]}
                    className={`relative font-body text-[15px] lg:text-[16px] no-underline font-[400] !text-[var(--text)] transition-all
                            after:content-[''] after:absolute after:left-0 after:-bottom-[2px] after:w-0 after:h-[1px] after:transition-[width] after:duration-500 after:ease-in-out hover:after:w-full
                            ${!isScrolled ? "after:bg-[var(--accent)] after:shadow-none" : "after:bg-[var(--accent)] text-[var(--text)]"}`}
                    style={{ color: 'var(--text)' }}
                  >
                    {text}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Right Icons Container */}
        <div className="part-3 flex justify-end shrink-0 items-center z-10">
          <motion.div className="icons flex items-center gap-[2px] min-[400px]:gap-[4px] sm:gap-[6px] lg:gap-[10px]" layout transition={springConfig}>
            
            <motion.div layout className="wishlist-icon flex items-center max-[850px]:hidden">
              <Link to="/wishlist" id="wishlist-icon" className={iconBtnClass} aria-label={`Wishlist (${wishCount})`}>
                <Heart strokeWidth={1.5} className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[var(--text)] group-hover:text-[var(--brand)] transition-colors" />
                {wishCount > 0 && (
                  <span className="badge absolute top-[4px] right-[4px] sm:top-[6px] sm:right-[6px] flex items-center justify-center min-w-[10px] h-[12px] px-[3px] text-[8px] font-semibold text-[var(--brand)] bg-[var(--accent)] rounded-full text-center border border-[var(--surface)] shadow-none font-body">
                    {wishCount}
                  </span>
                )}
              </Link>
            </motion.div>

            <motion.div layout className="cart-icon flex items-center">
              <Link to="/cart" id="cart-icon" className={iconBtnClass} aria-label={`Cart (${cartCount})`}>
                <ShoppingCart strokeWidth={1.5} className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[var(--text)] group-hover:text-[var(--brand)] transition-colors" />
                {cartCount > 0 && (
                  <span className="badge absolute top-[4px] right-[4px] sm:top-[6px] sm:right-[6px] flex items-center justify-center min-w-[10px] h-[12px] px-[3px] text-[8px] font-semibold text-[var(--brand)] bg-[var(--accent)] rounded-full text-center border border-[var(--surface)] shadow-none font-body">
                    {cartCount}
                  </span>
                )}
              </Link>
            </motion.div>

            {isLoggedIn && (
              <motion.div layout className="notification-wrapper flex items-center relative" ref={notificationRef}>
                <div className="notification-icon">
                  <button onClick={toggleNotification} className={iconBtnClass} aria-label={`Notifications (${unreadCount})`}>
                    <Bell strokeWidth={1.5} className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[var(--text)] group-hover:text-[var(--brand)] transition-colors" />
                    {unreadCount > 0 && (
                      <span className="badge absolute top-[4px] right-[4px] sm:top-[6px] sm:right-[6px] flex items-center justify-center min-w-[10px] h-[12px] px-[3px] text-[8px] font-semibold text-[var(--brand)] bg-[var(--accent)] rounded-full text-center border border-[var(--surface)] shadow-none font-body">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* REDESIGNED NOTIFICATION DROPDOWN */}
                <div
                  className={`notification-dropdown absolute top-[55px] right-[-10px] sm:right-0 bg-[var(--surface)] rounded-2xl w-[90vw] max-w-[360px] sm:w-[360px] sm:min-w-[360px] p-2 border border-[var(--border)] shadow-[var(--shadow-strong)] overflow-hidden origin-top-right will-change-[transform,opacity] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[1000]
                  ${isNotificationOpen ? "opacity-100 translate-y-0 scale-100 visible" : "opacity-0 -translate-y-3 scale-95 invisible"}`}
                >
                  <div className="flex justify-between items-center p-3 mb-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <h3 className="text-[18px] font-[500] font-display text-[var(--text)] m-0 shadow-none">Notifications</h3>
                    <div className="buttons flex items-center gap-3 font-body">
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-[12px] font-[600] bg-transparent border-none text-[var(--accent)] hover:text-[var(--brand)] transition-colors cursor-pointer p-0">
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} className="text-[12px] font-[600] bg-transparent border-none text-[var(--error)] opacity-80 hover:opacity-100 transition-opacity cursor-pointer p-0">
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <ul className="list-none m-0 p-0 max-h-[340px] overflow-y-auto smooth-scrollbar flex flex-col gap-1 pr-1">
                    {notifications.length === 0 ? (
                      <li className="p-8 text-center text-[var(--muted)] text-[14px] font-display italic pointer-events-none">No new notifications.</li>
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
                            <li className="px-3 py-2 text-[10px] font-[700] font-body tracking-widest uppercase text-[var(--muted)] sticky top-0 bg-[var(--surface)]/95 backdrop-blur-sm z-10 pointer-events-none">
                              {groupKey}
                            </li>
                            {groupedNotifications[groupKey].map(notif => (
                              <NotificationItem key={notif.id} notif={notif} onNavigate={handleNotificationClick} />
                            ))}
                          </React.Fragment>
                        ))
                    )}
                  </ul>
                </div>
              </motion.div>
            )}

            <motion.div layout className="auth-item-container flex items-center justify-center min-w-[44px] max-[850px]:hidden relative" ref={profileWrapperRef}>
              <AnimatePresence mode="popLayout" initial={false} >
                {isLoggedIn ? (
                  <motion.div
                    key="profile-btn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="profile-wrapper flex items-center"
                  >
                    <div className="profile-icon" id="profile-btn">
                      <button id="profileButton" className={iconBtnClass} onClick={toggleProfile} aria-expanded={isProfileOpen} aria-label="User Profile">
                        <User strokeWidth={1.5} className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[var(--text)] group-hover:text-[var(--brand)] transition-colors" />
                      </button>
                    </div>
                    
                    {/* REDESIGNED PROFILE DROPDOWN */}
                    <div className="profile-container">
                      <div
                        className={`profile-content absolute top-[55px] right-[-10px] sm:right-0 bg-[var(--surface)] rounded-2xl w-[90vw] max-w-[320px] sm:w-[320px] sm:min-w-[320px] p-2 border border-[var(--border)] shadow-[var(--shadow-strong)] overflow-hidden origin-top-right will-change-[transform,opacity] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[1000] 
                        ${isProfileOpen ? "opacity-100 translate-y-0 scale-100 visible" : "opacity-0 -translate-y-3 scale-95 invisible"}`}
                      >
                        {/* Profile Header */}
                        <div className="flex items-center gap-3.5 p-3 mb-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                          <img src={userdetails?.profileImage || user?.imageUrl || UserIcon} alt="User" className="w-[46px] h-[46px] rounded-full object-cover border shadow-sm border-[var(--border)] blend-luxury" />
                          <div className="flex flex-col gap-0.5 items-start min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-[18px] font-display font-[500] text-[var(--text)] m-0 truncate">{userdetails?.name}</h3>
                              {adminRole && (
                                <span className={`font-body text-[9px] font-[700] tracking-wider px-2 py-0.5 rounded-md uppercase bg-[var(--accent-soft)] text-[var(--brand)] border border-[var(--accent)]/30`}>
                                  {adminRole}
                                </span>
                              )}
                            </div>
                            <p className="font-body text-[12px] text-[var(--sub)] font-[400] m-0 truncate w-full max-w-[190px]">
                              {user?.primaryEmailAddress?.emailAddress || "NA"}
                            </p>
                          </div>
                        </div>
                        
                        {/* Profile Links */}
                        <ul className="list-none m-0 p-0 font-body flex flex-col gap-0.5">
                          {[
                            { icon: User, text: "My Account", path: "/myaccount" },
                            { icon: Package, text: "My Orders", path: "/myorder" },
                            { icon: Mail, text: "Contact Us", path: "/contact" }
                          ].map((item, i) => (
                            <li key={i}>
                              <Link
                                to={item.path}
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 p-2.5 px-3 cursor-pointer rounded-lg hover:bg-[var(--surface)] transition-colors group no-underline"
                              >
                                <item.icon size={18} strokeWidth={1.5} className="text-[var(--sub)] group-hover:text-[var(--brand)] transition-colors" />
                                <span className="text-[var(--sub)] font-[500] text-[14px] shadow-none group-hover:text-[var(--brand)] transition-colors">{item.text}</span>
                              </Link>
                            </li>
                          ))}

                          {adminRole && (
                            <li>
                              <Link
                                to="/admin"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 p-2.5 px-3 cursor-pointer rounded-lg hover:bg-[var(--surface)] transition-colors group no-underline"
                              >
                                <ShieldCheck size={18} strokeWidth={1.5} className="text-[var(--sub)] group-hover:text-[var(--brand)] transition-colors" />
                                <span className="text-[var(--sub)] font-[500] text-[14px] shadow-none group-hover:text-[var(--brand)] transition-colors">Admin Panel</span>
                              </Link>
                            </li>
                          )}
                          
                          {/* Elegant Divider */}
                          <div className="h-px bg-[var(--border)] mx-2 my-1" />
                          
                          <li>
                            <button
                              className="w-full flex items-center gap-3 p-2.5 px-3 cursor-pointer rounded-lg bg-transparent border-none hover:bg-[var(--error)]/5 transition-colors group text-left"
                              onClick={async (e) => { e.preventDefault(); await signOut({ redirectUrl: "/" }); setIsProfileOpen(false); }}
                            >
                              <LogOut size={18} strokeWidth={1.5} className="text-[var(--sub)] group-hover:text-[var(--error)] transition-colors" />
                              <span className="text-[var(--sub)] font-[500] text-[14px] shadow-none group-hover:text-[var(--error)] transition-colors">Log Out</span>
                            </button>
                          </li>
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
                    className="nav-signin-btn font-body flex items-center gap-[8px] bg-[var(--brand)] text-[var(--surface)] border-none py-[8px] px-[20px] rounded-full text-[14px] font-[600] cursor-pointer transition-all duration-200 ml-[10px] whitespace-nowrap hover:bg-[var(--brand-hover)] hover:scale-102 hover:shadow-[var(--shadow-strong)]"
                    onClick={openAuthModal}
                  >
                    <User size={18} strokeWidth={2} className="text-[var(--surface)]" />
                    <span>Sign In</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Mobile Hamburger Wrapper (Left Untouched) */}
            <motion.div layout className="mobile-view flex items-center min-[850px]:hidden ml-1 sm:ml-2">
              <div className="menu-icon flex items-center relative z-[99999]">
                <button
                  ref={hamburgerRef}
                  className="hamburger-btn bg-none border-none p-0 cursor-pointer relative pointer-events-auto"
                  id="hamburger-toggle"
                  aria-label={isOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isOpen}
                  onClick={(e) => { toggleSidebar(e); }}
                >
                  <div className={`hamburger w-[35px] h-[25px] flex flex-col justify-between items-center transition-transform duration-500 ease-linear ${isOpen ? "active" : ""}`}>
                    <div
                      className={`line h-[3px] bg-[var(--text)] transition-all duration-500 ease-linear rounded-full origin-center
                      ${isOpen ? "" : "w-[17.5px] -translate-x-1/2"}`}
                      style={isOpen ? { transform: 'rotate(-135deg) translateY(-240%)', backgroundColor: 'var(--text)', width: '18.5px' } : {}}
                    />
                    <div
                      className={`line h-[3px] bg-[var(--text)] transition-all duration-500 ease-linear rounded-full 
                      ${isOpen ? "" : "w-[35px]"}`}
                      style={isOpen ? { transform: 'rotate(-45deg)', backgroundColor: 'var(--text)', width: '35px' } : {}}
                    />
                    <div
                      className={`line h-[3px] bg-[var(--text)] transition-all duration-500 ease-linear rounded-full origin-center
                      ${isOpen ? "" : "w-[17.5px] translate-x-1/2"}`}
                      style={isOpen ? { transform: 'rotate(-135deg) translateY(255%)', backgroundColor: 'var(--text)', width: '21px' } : {}}
                    />
                  </div>
                </button>

                {createPortal(
                  <aside
                    ref={sidebarScopeRef}
                    className={`sidebar flex flex-col justify-between fixed top-0 right-0 bottom-0 h-[100dvh] w-[85vw] max-w-[350px] bg-[var(--surface)] text-[var(--text)] overflow-hidden z-[99999] pointer-events-auto shadow-[var(--shadow-strong)] mt-0 p-0 rounded-none rounded-tl-[30px] rounded-bl-[30px] will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] 
                    ${isOpen ? "translate-x-0" : "translate-x-full"}`}
                    id="sidebar"
                    role="dialog"
                    aria-modal={isOpen}
                    aria-label="Mobile Navigation Menu"
                  >
                    <div className="menu-icon flex items-center w-full p-[1rem] pl-[1.4rem] pt-[1.38rem] pb-[0.8rem] justify-start">
                      <button
                        ref={hamburgerRef}
                        className="hamburger-btn bg-none border-none p-0 cursor-pointer relative pointer-events-auto"
                        id="hamburger-toggle"
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isOpen}
                        onClick={(e) => { toggleSidebar(e); }}
                      >
                        <div className={`hamburger w-[35px] h-[25px] flex flex-col justify-between items-center transition-transform duration-500 ease-linear ${isOpen ? "active" : ""}`}>
                          <div
                            className={`line h-[3px] bg-[var(--text)] transition-all duration-500 ease-linear rounded-full origin-center
                            ${isOpen ? "" : "w-[17.5px] -translate-x-1/2"}`}
                            style={isOpen ? { transform: 'rotate(-135deg) translateY(-240%)', backgroundColor: 'var(--text)', width: '18.5px' } : {}}
                          />
                          <div
                            className={`line h-[3px] bg-[var(--text)] transition-all duration-500 ease-linear rounded-full 
                            ${isOpen ? "" : "w-[35px]"}`}
                            style={isOpen ? { transform: 'rotate(-45deg)', backgroundColor: 'var(--text)', width: '35px' } : {}}
                          />
                          <div
                            className={`line h-[3px] bg-[var(--text)] transition-all duration-500 ease-linear rounded-full origin-center
                            ${isOpen ? "" : "w-[17.5px] translate-x-1/2"}`}
                            style={isOpen ? { transform: 'rotate(-135deg) translateY(255%)', backgroundColor: 'var(--text)', width: '21px' } : {}}
                          />
                        </div>
                      </button>
                    </div>
                    <header className="sidebar-header pt-[0px] sticky top-0 z-[10] p-[1rem_1.5rem] border-b border-[var(--border)] border-t border-[var(--border)] bg-[var(--surface)] flex flex-col">
                      <div className="sidebar-top flex justify-between items-start mb-[1rem] pt-[5px]">
                        <div className="sidebar-user-details flex items-center text-left">
                          <img
                            src={isLoggedIn ? userdetails?.profileImage || user?.imageUrl || UserIcon : UserIcon}
                            alt=""
                            className="user-avatar w-[56px] h-[56px] rounded-[10%] object-cover mr-[1rem] shadow-[0_0_0_2px_var(--surface)]"
                          />
                          <div className="user-info flex flex-col items-start text-left min-w-0">
                            <h4 className="text-[1.25rem] font-display font-[500] m-0 !text-[var(--text)] leading-[1.2] break-words shadow-none">
                              {isLoggedIn ? (userdetails?.name || user?.fullName) : 'Guest'}
                            </h4>
                            <p className="user-email font-body text-[0.85rem] !text-[var(--sub)] m-[0.1rem_0_0_0] whitespace-nowrap overflow-hidden text-ellipsis w-[180px] sm:w-[200px] shadow-none">
                              {isLoggedIn ? user?.primaryEmailAddress?.emailAddress : 'Login'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="sidebar-actions">
                        <button
                          className={`sidebar-action-btn font-body w-full p-[0.5rem_0.75rem] text-[0.95rem] font-[600] rounded-[16px] cursor-pointer capitalize transition-all duration-200 
                          ${isLoggedIn
                              ? 'sidebar-view-account bg-[var(--brand)] text-[var(--surface)] border-none hover:bg-[var(--brand-hover)]'
                              : 'sidebar-signin bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)]'}`}
                          onClick={() => {
                            if (isLoggedIn) { navigate('/myaccount'); closeSidebar(); }
                            else { openAuthModal(); closeSidebar(); }
                          }}
                        >
                          {isLoggedIn ? 'View Profile' : 'Login / Sign Up'}
                        </button>
                      </div>
                    </header>

                    <nav className="sidebar-nav p-[1rem_0] grow overflow-y-auto smooth-scrollbar">
                      <div className="sidebar-section mb-[1.4rem] mt-[0.5rem]">
                        <div role="heading" aria-level="3" className="section-title font-body text-[0.95rem] font-[600] text-[var(--muted)] uppercase tracking-[0.5px] p-[0_1.5rem_0.5rem_1.5rem] mt-0 shadow-none">Explore</div>
                        <ul className="list-none m-0 p-0">
                          {primaryLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} to={l.to} onClick={l.onClick} />))}
                        </ul>
                      </div>
                      <div className="sidebar-section mb-[1.4rem] mt-[0.5rem]">
                        <div role="heading" aria-level="3" className="section-title font-body text-[0.95rem] font-[600] text-[var(--muted)] uppercase tracking-[0.5px] p-[0_1.5rem_0.5rem_1.5rem] mt-0 shadow-none">Account</div>
                        <ul className="list-none m-0 p-0">
                          {accountLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} badge={l.badge} to={l.to} onClick={l.onClick} />))}
                          {isLoggedIn && adminRole && (<SidebarItem icon={ShieldCheck} label={'Admin Panel'} to={'/admin'} onClick={() => { closeSidebar(); }} />)}
                        </ul>
                      </div>
                      <div className="sidebar-section mb-[1.4rem] mt-[0.5rem]">
                        <div role="heading" aria-level="3" className="section-title font-body text-[0.95rem] font-[600] text-[var(--muted)] uppercase tracking-[0.5px] p-[0_1.5rem_0.5rem_1.5rem] mt-0 shadow-none">Support</div>
                        <ul className="list-none m-0 p-0">
                          {supportLinks.map((l) => (<SidebarItem key={l.label} icon={l.icon} label={l.label} to={l.to} onClick={l.onClick} />))}
                        </ul>
                      </div>
                    </nav>

                    {isLoggedIn && (
                      <footer className="sidebar-footer p-[1rem_1.5rem] border-t border-[var(--border)] text-left">
                        <button
                          onClick={async (e) => { e.preventDefault(); await signOut({ redirectUrl: '/' }); closeSidebar(); }}
                          className="flex items-center gap-[0.75rem] font-body bg-none border-none text-[1rem] cursor-pointer !text-[var(--error)] font-[600] shadow-none hover:opacity-80 transition-opacity"
                        >
                          <LogOut size={20} strokeWidth={2.5} className="text-[var(--error)]" />
                          <span>Log Out</span>
                        </button>
                      </footer>
                    )}
                  </aside>,
                  document.body
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </nav>

      {isAuthModalOpen && <CustomAuthModal onClose={closeAuthModal} />}
    </header>
  );
};

export default Navbar;