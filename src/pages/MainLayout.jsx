// src/Layouts/MainLayout.jsx
import React, { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar"; //
import MobileBackBar from "../Components/MobileBackBar"; //
import Footer from "./Footer"; //

const MainLayout = () => {
  // 1. Lift state up so Navbar can control BackBar
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // 2. Callback passed to Navbar to report scroll direction
  const handleNavVisibility = useCallback((isVisible) => {
    setIsNavbarVisible(isVisible);
  }, []);

  return (
      <div className="flex flex-col min-h-screen bg-[var(--color-off-white)]">
        
        {/* Navbar reports visibility changes */}
        <Navbar onVisibilityChange={handleNavVisibility} />
        
        {/* BackBar listens to visibility state */}
        <MobileBackBar isNavbarVisible={isNavbarVisible} />
        
        {/* Content flows underneath */}
        <main className="flex-grow relative z-10 w-full">
          <Outlet />
        </main>
        
        <Footer />
        
      </div>
  );
};

export default MainLayout;