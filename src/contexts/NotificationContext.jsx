// src/contexts/NotificationContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from './UserContext';

// --------------------------------------------------
// localStorage helper functions (These are correct)
// --------------------------------------------------
const DISMISSED_PROMOS_KEY = 'dismissedPromoIDs';

const getDismissedPromoIDs = () => {
  try {
    const item = localStorage.getItem(DISMISSED_PROMOS_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Error reading dismissed promos from localStorage", error);
    return [];
  }
};

const addDismissedPromoIDs = (newIDs) => {
  if (!newIDs || newIDs.length === 0) return;
  try {
    const currentIDs = getDismissedPromoIDs();
    const combinedIDs = [...new Set([...currentIDs, ...newIDs])];
    localStorage.setItem(DISMISSED_PROMOS_KEY, JSON.stringify(combinedIDs));
  } catch (error) {
    console.error("Error saving dismissed promos to localStorage", error);
  }
};
// --------------------------------------------------
// END: localStorage helper functions
// --------------------------------------------------

export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  fetchNotifications: () => { },
  markAllAsRead: () => { },
  clearAllNotifications: () => { },
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { userdetails, isUserLoading } = useContext(UserContext);

  const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

  // This function is correct. It fetches personal alerts
  // and filters out any dismissed promos from localStorage.
  const fetchNotifications = useCallback(async () => {
    if (!userdetails?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/user/${userdetails.id}`);
      const data = await res.json(); 
      
      const promoRes = await fetch(`${BASE_URL}/api/promos/latest-public`);
      const promos = await promoRes.json();

      const dismissedIDs = getDismissedPromoIDs();

      const promoNotifications = promos
        .map(promo => {
          const fallbackMessage = `Get ${promo.discountValue}% off your order!`;
          const message = `Use code ${promo.code} - ${promo.description || fallbackMessage}`;
          const promoID = `promo-${promo.id}`;

          return {
            id: promoID,
            message: message,
            link: '/cart',
            type: 'coupon',
            createdAt: promo.validFrom || new Date().toISOString(), 
            isRead: false
          };
        })
        .filter(promo => !dismissedIDs.includes(promo.id)); // 👈 Filters dismissed promos

      const allNotifications = [...data.notifications, ...promoNotifications];
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(allNotifications);
      setUnreadCount(data.unreadCount); 

    } catch (err) {
      console.error("[NotificationContext] Error fetching:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userdetails?.id, BASE_URL]);


  // --------------------------------------------------
  // 🟢 START: MODIFIED "Mark all as read"
  // --------------------------------------------------
  // This function now ONLY affects personal alerts.
  // It does NOT touch promos or localStorage.
  const markAllAsRead = useCallback(async () => {
    if (!userdetails?.id || unreadCount === 0) return;

    // 1. Optimistic update: Mark personal alerts as read, leave promos alone
    setUnreadCount(0);
    setNotifications(prev =>
      prev.map(n => 
        !String(n.id).startsWith('promo-') ? { ...n, isRead: true } : n
      )
    );
    
    // 2. Call API for personal alerts
    try {
      await fetch(`${BASE_URL}/api/notifications/mark-read/user/${userdetails.id}`, {
        method: 'PUT'
      });
      // We don't need to re-fetch, the optimistic update is fine.
      // Promos will remain visible.
    } catch (err) {
      console.error("[NotificationContext] Error marking as read:", err);
      fetchNotifications(); // Re-fetch on error to re-sync
    }
  }, [userdetails?.id, unreadCount, BASE_URL, fetchNotifications]);
  // --------------------------------------------------
  // 🟢 END: MODIFIED "Mark all as read"
  // --------------------------------------------------


  // --------------------------------------------------
  // 🟢 START: MODIFIED "Clear All"
  // --------------------------------------------------
  // This function now clears BOTH personal alerts (from DB)
  // AND promos (from localStorage).
  const clearAllNotifications = useCallback(async () => {
    if (!userdetails?.id) return;
    if (!window.confirm("Are you sure you want to clear all your notifications?")) return;

    //   Get IDs of promos that are *currently* showing
    const promoIdsToDismiss = notifications
      .filter(n => String(n.id).startsWith('promo-'))
      .map(n => n.id);

    //  Add them to localStorage to dismiss them
    if (promoIdsToDismiss.length > 0) {
      addDismissedPromoIDs(promoIdsToDismiss);
    }
    
    //  Optimistic update: clear everything from view
    setNotifications([]);
    setUnreadCount(0);
    
    try {
      // Call the DELETE API (for personal alerts ONLY)
      await fetch(`${BASE_URL}/api/notifications/user/${userdetails.id}`, {
        method: 'DELETE'
      });
      // No need to re-fetch, we've already cleared everything locally
      // Promos are handled via localStorage
      fetchNotifications(); 
    } catch (err) {
      console.error("[NotificationContext] Error clearing notifications:", err);
      fetchNotifications(); 
    }
  }, [userdetails?.id, BASE_URL, fetchNotifications, notifications]);

  useEffect(() => {
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }
    if (userdetails?.id) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
    }
  }, [isUserLoading, userdetails, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};