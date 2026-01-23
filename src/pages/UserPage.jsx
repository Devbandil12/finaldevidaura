// src/pages/UserPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import { useClerk, useAuth } from "@clerk/clerk-react"; // 🟢 Import useAuth
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

// Components
import Sidebar from "../Components/UserPage/Sidebar";
import OverviewTab from "../Components/UserPage/OverviewTab";
import WalletTab from "../Components/UserPage/WalletTab";
import OrdersTab from "../Components/UserPage/OrdersTab";
import CouponsTab from "../Components/UserPage/CouponsTab";
import AddressesTab from "../Components/UserPage/AddressesTab";
import ReviewsTab from "../Components/UserPage/ReviewsTab";
import SupportTab from "../Components/UserPage/SupportTab";
import SettingsTab from "../Components/UserPage/SettingsTab";
import EarnCashTab from "../Components/UserPage/EarnCashTab";
import AlertsTab from "../Components/UserPage/AlertsTab";       
import ActivityLogTab from "../Components/UserPage/ActivityLogTab"; 

// Shared transition config
const smoothTransition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

export default function UserPage() {
  const { userdetails, updateUser, address, deleteAddress, setDefaultAddress, addAddress, editAddress } = useContext(UserContext);
  const { orders, loadingOrders } = useContext(OrderContext);
  const { cart, wishlist } = useContext(CartContext);
  const { tickets, getUserTickets, replyToTicket } = useContext(ContactContext);
  const { userReviews, loadingReviews } = useContext(ReviewContext);
  const { products } = useContext(ProductContext);
  
  const { signOut } = useClerk();
  const { getToken } = useAuth(); // 🟢 Get Token Helper

  const [activeTab, setActiveTab] = useState("overview");
  const [personalLogs, setPersonalLogs] = useState([]);

  // Fetch specialized logs or tickets on load
  useEffect(() => {
    if (userdetails?.email) {
      getUserTickets(userdetails.email);
      
      if (userdetails.id) {
        // 🟢 SECURE: Fetch Logs with Token
        const fetchLogs = async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${BASE}/api/users/${userdetails.id}/logs`, {
                    headers: { 'Authorization': `Bearer ${token}` } // 🔒 Auth Header
                });
                if (res.ok) {
                    const data = await res.json();
                    setPersonalLogs(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch logs", err);
            }
        };
        fetchLogs();
      }
    }
  }, [userdetails, getUserTickets, getToken]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Handle deep-linking from Activity Feed to specific tabs
  const handleNavigateActivity = (item) => {
    if (item.type.includes('order')) {
      setActiveTab('orders');
    } else if (item.type === 'ticket') {
      setActiveTab('support');
    } else if (item.type === 'review') {
      setActiveTab('reviews');
    }
  };

  if (!userdetails) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFDFD]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-24 pb-20 px-4 sm:px-8 text-zinc-900 selection:bg-zinc-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR (Sticky) */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 z-40">
          <Sidebar 
            user={userdetails} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onSignOut={() => signOut({ redirectUrl: "/" })} 
          />
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="lg:col-span-9 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              transition={smoothTransition}
            >
              {activeTab === 'overview' && (
                <OverviewTab 
                  user={userdetails} 
                  orders={orders} 
                  cart={cart} 
                  wishlist={wishlist} 
                  address={address} 
                  tickets={tickets}             // Added
                  userReviews={userReviews}     // Added
                  setActiveTab={setActiveTab} 
                />
              )}
              
              {activeTab === 'wallet' && <WalletTab userId={userdetails.id} />}
              {activeTab === 'orders' && <OrdersTab orders={orders} loadingOrders={loadingOrders} products={products} />}
              {activeTab === 'offers' && <CouponsTab userId={userdetails.id} />}
              
              {/* Note: 'activity_log' matches the key sent by OverviewTab's View All button */}
              {activeTab === 'activity_log' && (
                <ActivityLogTab 
                  orders={orders} 
                  tickets={tickets} 
                  reviews={userReviews} 
                  securityLogs={personalLogs} 
                  onNavigate={handleNavigateActivity}
                />
              )}
              
              {activeTab === 'addresses' && (
                <AddressesTab 
                  address={address} 
                  addAddress={addAddress} 
                  editAddress={editAddress} 
                  deleteAddress={deleteAddress} 
                  setDefaultAddress={setDefaultAddress} 
                />
              )}
              
              {activeTab === 'reviews' && <ReviewsTab userReviews={userReviews} loadingReviews={loadingReviews} products={products} />}
              
              {activeTab === 'support' && (
                <SupportTab 
                  tickets={tickets} 
                  getUserTickets={getUserTickets} 
                  replyToTicket={replyToTicket} 
                  userEmail={userdetails.email} 
                />
              )}
              
              {activeTab === 'settings' && <SettingsTab user={userdetails} onUpdate={updateUser} />}
              {activeTab === 'notifications' && <AlertsTab user={userdetails} onUpdate={updateUser} />}
              {activeTab === 'earncash' && <EarnCashTab userId={userdetails.id} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}