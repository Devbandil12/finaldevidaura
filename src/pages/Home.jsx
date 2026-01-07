// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from "react";
import HeroSection from "./HeroSection";
// 🟢 Restored Imports
import Products from "./Products";
import CustomComboBuilder from "./CustomComboBuilder";

import ProductShowcaseCarousel from "./ProductShowcaseCarousel";
import DualMarquee from "./DualMarquee";
import TestimonialsSection from "./TestimonialsSection";
import AboutUs from "./AboutUs";
import MidSectionBanner from "./MidSectionBanner";
import { UserContext } from "../contexts/UserContext";

const Home = () => {
  const { userdetails } = useContext(UserContext);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminStats, setAdminStats] = useState({ todayCount: 0, pendingCount: 0 });

 
  // Admin Check Effect
  useEffect(() => {
    const fetchAdminStats = async () => {
      if (userdetails?.role === 'admin') {
        try {
          const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
          const res = await fetch(`${BACKEND_URL}/api/orders`);

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
      {/* Admin Modal */}
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
      
      {/* 🟢 Render actual Products component with flag to hide big banner */}
      <div id="collection-section">
        <Products isStandalone={false} />
      </div>

      <MidSectionBanner index={1} />
      
      {/* 🟢 Render actual Combo Builder with flag */}
      <div id="custom-combo-section">
        <CustomComboBuilder isStandalone={false} />
      </div>

      <div id="about-section"><AboutUs /></div>
      <TestimonialsSection />
    </>
  );
};

export default Home;