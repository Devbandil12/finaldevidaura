// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from "react";
import { useAuth } from "@clerk/clerk-react"; // 🟢 Import useAuth
import HeroSection from "./HeroSection";
import Products from "./Products";
import CustomComboBuilder from "./CustomComboBuilder";
import ProductShowcaseCarousel from "./ProductShowcaseCarousel";
import DualMarquee from "./DualMarquee";
import TestimonialsSection from "./TestimonialsSection";
import AboutUs from "./AboutUs";
import MidSectionBanner from "./MidSectionBanner";
import { UserContext } from "../contexts/UserContext";
import AuraFinder from "../Components/AuraFinder";

const Home = () => {
  const { userdetails } = useContext(UserContext);
  const { getToken } = useAuth(); // 🟢 Get Token Helper
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminStats, setAdminStats] = useState({ todayCount: 0, pendingCount: 0 });

  // Admin Check Effect
  useEffect(() => {
    const fetchAdminStats = async () => {
      // Only fetch if user is confirmed as admin
      if (userdetails?.role === 'admin') {
        try {
          const token = await getToken(); // 🟢 Get Token
          const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
          
          // 🟢 Add Auth Header
          const res = await fetch(`${BACKEND_URL}/api/orders`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (res.ok) {
            const orders = await res.json();
            const today = new Date().toDateString();
            const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
            const pendingOrders = orders.filter(o => o.status === 'Order Placed' || o.status === 'Processing');

            if (todayOrders.length > 0 || pendingOrders.length > 0) {
              setAdminStats({
                todayCount: todayOrders.length,
                pendingCount: pendingOrders.length
              });
              setShowAdminModal(true);
            }
          } else {
            console.error("Failed to fetch admin stats:", res.status);
          }
        } catch (err) {
          console.error("Failed to fetch admin stats for modal", err);
        }
      }
    };

    if (userdetails) {
      fetchAdminStats();
    }
  }, [userdetails, getToken]); // Added getToken dependency
  
  return (
    <>
    <AuraFinder />
      {/* Admin Modal - Luxury Style */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="w-[90%] max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-gray-900/5 transition-all">
            <h2 className="font-cormorant text-3xl font-medium text-gray-900 mb-6">Admin Dashboard</h2>

            <div className="flex justify-around gap-4 mb-8">
              <div className="flex-1 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                <div className="text-3xl font-bold text-gold-dark mb-1">{adminStats.todayCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">New Today</div>
              </div>
              <div className="flex-1 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                <div className="text-3xl font-bold text-gray-900 mb-1">{adminStats.pendingCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pending</div>
              </div>
            </div>

            <button
              onClick={() => setShowAdminModal(false)}
              className="w-full rounded-full bg-gray-900 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-transform hover:scale-[1.02] hover:bg-black active:scale-[0.98]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <HeroSection />
      <DualMarquee />
      <MidSectionBanner index={0} />

      <div id="scents-section"><ProductShowcaseCarousel /></div>
      
      <div id="collection-section">
        <Products isStandalone={false} />
      </div>

      <MidSectionBanner index={1} />

      <div id="custom-combo-section">
        <CustomComboBuilder isStandalone={false} />
      </div>

      <div id="about-section"><AboutUs /></div>
      <TestimonialsSection />
    </>
  );
};

export default Home;