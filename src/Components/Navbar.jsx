import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useLayoutEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

// Clerk
import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";

// Contexts
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

// Shadcn UI Components
// Using your Button component directly
import { Button } from "./ui/button"; // Assuming this is where your provided code is
// Using your DropdownMenu components directly
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"; // Assuming this is where your provided code is
// Using your Sheet components directly
import { Sheet, SheetTrigger, SheetContent } from "./ui/sheet"; // Assuming this is where your provided code is

// Lucide React Icons
import {
  Menu, // Will be animated
  UserRound, // For profile, distinct from generic user
  Heart,
  ShoppingCart,
  Package,
  Mail,
  LogOut,
  Settings,
  X, // For closing sidebar
} from "lucide-react";

// --- Custom Animated Hamburger Component ---
const AnimatedHamburger = ({ isOpen, onClick }) => (
  <button
    className="flex h-8 w-8 flex-col items-center justify-center space-y-1.5 focus:outline-none md:hidden"
    onClick={onClick}
    aria-label="Toggle menu"
  >
    <span
      className={`block h-0.5 w-6 transform bg-foreground transition duration-300 ease-in-out ${
        isOpen ? "translate-y-2 rotate-45" : ""
      }`}
    ></span>
    <span
      className={`block h-0.5 w-6 bg-foreground transition duration-300 ease-in-out ${
        isOpen ? "opacity-0" : ""
      }`}
    ></span>
    <span
      className={`block h-0.5 w-6 transform bg-foreground transition duration-300 ease-in-out ${
        isOpen ? "-translate-y-2 -rotate-45" : ""
      }`}
    ></span>
  </button>
);
// --- End Custom Animated Hamburger Component ---

const Navbar = ({ onVisibilityChange }) => {
  const { wishlist, cart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navbarScrolled, setNavbarScrolled] = useState(false); // Track scroll for navbar background
  const [navbarVisible, setNavbarVisible] = useState(true); // Hide/show on scroll

  const navRef = useRef(null);

  const cartCount = cart.length;
  const wishlistCount = wishlist.length;

  // Handle scroll for navbar background and hide/show
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      setNavbarScrolled(currentScroll > 0);

      // Logic to hide/show navbar on scroll up/down
      const isVisible = currentScroll < lastScrollTop || currentScroll < 50; // Always visible at the very top
      setNavbarVisible(isVisible);
      if (onVisibilityChange) onVisibilityChange(isVisible);

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onVisibilityChange]);

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [isSidebarOpen]);

  // GSAP: Page-load stagger for desktop elements
  useLayoutEffect(() => {
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.set([".nav-brand", ".nav-link-item", ".nav-icon-item", ".auth-button"], {
        willChange: "transform, opacity",
        force3D: true,
      });

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".nav-brand", { y: -8, autoAlpha: 0, duration: 0.26 })
        .from(
          ".nav-link-item",
          { y: -8, autoAlpha: 0, duration: 0.22, stagger: 0.05 },
          "-=0.06"
        )
        .from(
          ".nav-icon-item",
          { y: -8, autoAlpha: 0, duration: 0.2, stagger: 0.05 },
          "-=0.1"
        )
        .from(
            ".auth-button",
            { y: -8, autoAlpha: 0, duration: 0.2, stagger: 0.05 },
            "-=0.1"
        )
        .add(() => {
          gsap.set([".nav-brand", ".nav-link-item", ".nav-icon-item", ".auth-button"], {
            willChange: "auto",
          });
        });
    }, navRef);

    return () => ctx.revert();
  }, []);

  const handleNavLinkClick = (path, scrollId) => {
    if (path) {
      navigate(path);
    } else if (scrollId) {
      document.getElementById(scrollId)?.scrollIntoView({ behavior: "smooth" });
    }
    // Close sidebar if it's open, or profile dropdown
    setIsSidebarOpen(false);
    setIsProfileDropdownOpen(false);
  };

  return (
    <header ref={navRef}>
      <nav
        className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 py-2 transition-all duration-300 ease-in-out md:px-8
          ${navbarVisible ? "translate-y-0" : "-translate-y-full"}
          ${navbarScrolled ? "bg-background/90 shadow-md backdrop-blur-md" : "bg-transparent"}
          `}
      >
        {/* LEFT: Brand */}
        <div className="flex items-center nav-brand">
          <Button variant="ghost" className="text-xl font-bold tracking-tight text-foreground hover:bg-transparent" onClick={() => handleNavLinkClick("/")}>
            DEVIDAURA
          </Button>
        </div>

        {/* CENTER: Links (Desktop Only) */}
        <div className="hidden md:flex flex-grow justify-center gap-6">
          <Button variant="ghost" className="nav-link-item text-sm font-medium transition-colors hover:text-primary" onClick={() => handleNavLinkClick("/")}>
            Home
          </Button>
          <Button variant="ghost" className="nav-link-item text-sm font-medium transition-colors hover:text-primary" onClick={() => handleNavLinkClick(null, "products-section")}>
            Collection
          </Button>
          <Button variant="ghost" className="nav-link-item text-sm font-medium transition-colors hover:text-primary" onClick={() => handleNavLinkClick(null, "shop-section")}>
            Shop
          </Button>
        </div>

        {/* RIGHT: Icons & Profile/Auth */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Wishlist (Desktop Only) */}
          <Button variant="ghost" size="icon" className="relative hidden md:flex nav-icon-item" onClick={() => handleNavLinkClick("/wishlist")}>
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {wishlistCount}
              </span>
            )}
          </Button>

          {/* Cart (Visible on Mobile & Desktop) */}
          <Button variant="ghost" size="icon" className="relative nav-icon-item" onClick={() => handleNavLinkClick("/cart")}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>

          {/* Profile Dropdown / Sign In Button (Desktop Only) */}
          {isSignedIn ? (
            <DropdownMenu onOpenChange={setIsProfileDropdownOpen}>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <Button variant="ghost" size="icon" className="relative nav-icon-item rounded-full">
                  <UserRound className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56"> {/* Default width of 224px for desktop */}
                <DropdownMenuLabel className="flex flex-col">
                  <span>{userdetails?.name || "Guest User"}</span>
                  <span className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || "N/A"}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavLinkClick("/myorder")}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>My Orders</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavLinkClick("/contact")}>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Contact Us</span>
                </DropdownMenuItem>
                {userdetails?.role === "admin" && (
                  <DropdownMenuItem onClick={() => handleNavLinkClick("/admin")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.preventDefault();
                    await signOut({ redirectUrl: "/" });
                    setIsProfileDropdownOpen(false);
                  }}
                  className="text-destructive hover:!bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SignInButton mode="modal" signUpUrl="/sign-up">
              <Button className="auth-button hidden md:flex" variant="outline" size="sm">Sign In</Button>
            </SignInButton>
          )}

          {/* Mobile Hamburger Menu */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <AnimatedHamburger isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            </SheetTrigger>
            {/* Using your provided SheetContent */}
            <SheetContent side="right" className="flex flex-col w-full sm:w-3/4 sm:max-w-xs">
              <div className="flex items-center justify-between pb-4 border-b">
                <h4 className="text-lg font-semibold">Menu</h4>
                {/* Close button with X icon */}
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close menu</span>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto pt-4">
                {isSignedIn ? (
                  <div className="mb-6 flex flex-col items-start gap-2 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <UserRound className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-semibold text-base">{userdetails?.name || "Guest"}</p>
                            <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || "N/A"}</p>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 border-b pb-4">
                      <SignInButton mode="modal" signUpUrl="/sign-up">
                          <Button variant="default" className="w-full">Sign In / Sign Up</Button>
                      </SignInButton>
                  </div>
                )}
                <nav className="grid gap-2">
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/")}>
                    <Menu className="mr-2 h-5 w-5" /> Home
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick(null, "products-section")}>
                    <Package className="mr-2 h-5 w-5" /> Collection
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick(null, "shop-section")}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Shop
                  </Button>
                  {/* Profile Dropdown inside sidebar */}
                  {isSignedIn ? (
                    <DropdownMenu onOpenChange={setIsProfileDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="justify-start text-base w-full">
                          <UserRound className="mr-2 h-5 w-5" /> Profile
                        </Button>
                      </DropdownMenuTrigger>
                      {/* Using w-56 for consistency with desktop dropdown */}
                      <DropdownMenuContent side="left" className="w-56">
                        <DropdownMenuLabel className="flex flex-col">
                          <span>{userdetails?.name || "Guest User"}</span>
                          <span className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || "N/A"}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleNavLinkClick("/myorder")}>
                          <Package className="mr-2 h-4 w-4" />
                          <span>My Orders</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavLinkClick("/wishlist")}>
                          <Heart className="mr-2 h-4 w-4" />
                          <span>Wishlist ({wishlistCount})</span>
                        </DropdownMenuItem>
                        {userdetails?.role === "admin" && (
                          <DropdownMenuItem onClick={() => handleNavLinkClick("/admin")}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // Show Wishlist directly if not signed in (and thus no profile dropdown)
                    <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/wishlist")}>
                        <Heart className="mr-2 h-5 w-5" /> Wishlist ({wishlistCount})
                    </Button>
                  )}
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/contact")}>
                    <Mail className="mr-2 h-5 w-5" /> Contact Us
                  </Button>
                  {/* Admin Panel directly in sidebar if signed in and admin */}
                  {isSignedIn && userdetails?.role === "admin" && (
                    <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/admin")}>
                      <Settings className="mr-2 h-5 w-5" /> Admin Panel
                    </Button>
                  )}
                </nav>
              </div>

              {isSignedIn && (
                <div className="mt-auto border-t pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base text-destructive hover:!bg-destructive/10"
                    onClick={async (e) => {
                      e.preventDefault();
                      await signOut({ redirectUrl: "/" });
                      setIsSidebarOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" /> Log Out
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

