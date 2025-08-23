import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap"; // Keeping GSAP for initial load animation

// Clerk
import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";

// Contexts
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

// Shadcn UI Components
import { Button } from "./ui/buttons"; // Assuming path to shadcn/ui button component
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"; // Assuming path to shadcn/ui dropdown menu
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"; // Assuming path to shadcn/ui sheet (for sidebar)

// Lucide React Icons (replacing image assets for a cleaner look)
import {
  Menu,
  User,
  Heart,
  ShoppingCart,
  Package, // For My Orders
  Mail,
  LogOut,
  Settings, // For Admin Panel, or a more suitable icon if available
  X, // For close button in sheet
} from "lucide-react";

const Navbar = ({ onVisibilityChange }) => {
  const { wishlist, cart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false); // Managed by shadcn DropdownMenu
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Managed by shadcn Sheet
  const [navbarVisible, setNavbarVisible] = useState(true);

  // Refs for GSAP animations
  const navRef = useRef(null);

  const cartCount = cart.length;
  const wishlistCount = wishlist.length;

  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;
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
    setIsProfileOpen(false);
  };

  return (
    <header ref={navRef}>
      <nav
        className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 py-2 transition-all duration-300 ease-in-out md:px-8
          ${navbarVisible ? "translate-y-0" : "-translate-y-full"}
          bg-background/80 backdrop-blur-md border-b border-border/40`}
      >
        {/* LEFT: Brand */}
        <div className="flex items-center nav-brand">
          <Button variant="ghost" className="text-xl font-bold tracking-tight text-primary-foreground hover:bg-transparent" onClick={() => handleNavLinkClick("/")}>
            DEVIDAURA
          </Button>
        </div>

        {/* CENTER: Links (Desktop) */}
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
        <div className="flex items-center gap-4">
          {/* Wishlist */}
          <Button variant="ghost" size="icon" className="relative nav-icon-item" onClick={() => handleNavLinkClick("/wishlist")}>
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {wishlistCount}
              </span>
            )}
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative nav-icon-item" onClick={() => handleNavLinkClick("/cart")}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>

          {/* Profile Dropdown / Sign In Button */}
          {isSignedIn ? (
            <DropdownMenu onOpenChange={setIsProfileOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative nav-icon-item rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
                    handleNavLinkClick(); // Close dropdown
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
              <Button className="auth-button" variant="outline">Sign In</Button>
            </SignInButton>
          )}

          {/* Mobile Hamburger Menu */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col w-3/4 sm:max-w-xs">
              <div className="flex items-center justify-between pb-4 border-b">
                <h4 className="text-lg font-semibold">Menu</h4>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close menu</span>
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto pt-4">
                {isSignedIn ? (
                  <div className="mb-6 flex flex-col items-start gap-2 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <User className="h-8 w-8 text-primary" />
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
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/myorder")}>
                    <Package className="mr-2 h-5 w-5" /> My Orders
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/wishlist")}>
                    <Heart className="mr-2 h-5 w-5" /> Wishlist
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/cart")}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Cart
                  </Button>
                  {userdetails?.role === "admin" && (
                    <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/admin")}>
                      <Settings className="mr-2 h-5 w-5" /> Admin Panel
                    </Button>
                  )}
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleNavLinkClick("/contact")}>
                    <Mail className="mr-2 h-5 w-5" /> Contact Us
                  </Button>
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
                      handleNavLinkClick(); // Close sidebar
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

