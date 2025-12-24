import React, { useEffect, useState, useContext } from "react";
import HeroSection from "./HeroSection";
import Products from "./Products";
import ProductShowcaseCarousel from "./ProductShowcaseCarousel";
import DualMarquee from "./DualMarquee";
import TestimonialsSection from "./TestimonialsSection";
import CustomComboBuillder from "./CustomComboBuilder";
import AboutUs from "./AboutUs";
import MidSectionBanner from "./MidSectionBanner";
// 🟢 Import UserContext
import { UserContext } from "../contexts/UserContext";

const Home = () => {
  const { userdetails } = useContext(UserContext); // 🟢 Get user details
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminStats, setAdminStats] = useState({ todayCount: 0, pendingCount: 0 });

  useEffect(() => {
    // Handle scroll restoration
    const target = sessionStorage.getItem("scrollToSection");
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
      sessionStorage.removeItem("scrollToSection");
    }
  }, []);

  // 🟢 Admin Check Effect (The Modal Logic)
  useEffect(() => {
    const fetchAdminStats = async () => {
      // Only run if user is loaded and is 'admin'
      if (userdetails?.role === 'admin') {
        try {
          // Ensure URL doesn't have double slashes
          const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
          const res = await fetch(`${BACKEND_URL}/api/orders`);

          if (res.ok) {
            const orders = await res.json();

            // Logic: Count Today's Orders & Pending Orders
            const today = new Date().toDateString();
            const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
            const pendingOrders = orders.filter(o => o.status === 'Order Placed' || o.status === 'Processing');

            // Only show if there is activity to report
            if (todayOrders.length > 0 || pendingOrders.length > 0) {
              setAdminStats({
                todayCount: todayOrders.length,
                pendingCount: pendingOrders.length
              });
              setShowAdminModal(true);
            }
          }
        } catch (err) {
          console.error("Failed to fetch admin stats for modal", err);
        }
      }
    };

    if (userdetails) {
      fetchAdminStats();
    }
  }, [userdetails]);

  return (
    <>
      {/* 🟢 Admin Dashboard Modal */}
      {showAdminModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '16px',
            maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', marginBottom: '10px' }}>Admin Dashboard</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Here is your store summary for today.</p>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '25px' }}>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px', minWidth: '100px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#D4AF37' }}>{adminStats.todayCount}</div>
                <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>New Today</div>
              </div>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px', minWidth: '100px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111' }}>{adminStats.pendingCount}</div>
                <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Pending</div>
              </div>
            </div>

            <button
              onClick={() => setShowAdminModal(false)}
              style={{
                backgroundColor: '#111', color: '#fff', border: 'none',
                padding: '12px 30px', borderRadius: '50px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600'
              }}
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
      <div id="collection-section"><Products /></div>
      <MidSectionBanner index={1} />
      <div id="custom-combo-section"><CustomComboBuillder /></div>
      <div id="about-section"><AboutUs /></div>
      <TestimonialsSection />
    </>
  );
};

export default Home;