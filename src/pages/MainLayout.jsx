import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileBackBar from "../Components/BackBar";
import Footer from "./Footer";

const MainLayout = () => {
  return (
    <>
      {/* Note: In standard React, title/meta tags should be managed by 'react-helmet-async' 
          to properly move them to the <head>. Rendering them here puts them in the <body>. */}
      <title>Devid Aura | Exquisite Perfumes & Fragrances</title>
      <meta name="description" content="More than perfume, Devid Aura is an invisible aura of confidence and artistry. Discover masterfully crafted fragrances that leave a memorable impression. Your signature scent awaits." />

      <Navbar isVisible={true} />
      <MobileBackBar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;