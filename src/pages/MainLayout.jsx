// src/Layouts/MainLayout.jsx
import React, { useState, useCallback, Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileBackBar from "../Components/MobileBackBar";
import Footer from "./Footer";
import Loader from "../Components/Loader"; // Import your Loader component

const MainLayout = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  const handleNavVisibility = useCallback((isVisible) => {
    setIsNavbarVisible(isVisible);
  }, []);

  return (
      <div className="flex flex-col min-h-screen bg-[var(--color-off-white)]">
        
        <Navbar onVisibilityChange={handleNavVisibility} />
        
        <MobileBackBar isNavbarVisible={isNavbarVisible} />
        
        {/* Content flows underneath */}
        {/* Added 'flex flex-col' to ensure the loader centers correctly if needed */}
        <main className="flex-grow relative z-10 w-full flex flex-col">
          {/* Wrap Outlet in Suspense to hold layout while content loads */}
          <Suspense fallback={
            <div className="flex-grow flex items-center justify-center min-h-[50vh]">
              <Loader text="Loading..." />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
        
        <Footer />
        
      </div>
  );
};

export default MainLayout;