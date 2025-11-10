// src/contexts/NotificationContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from './UserContext';

// --------------------------------------------------
// 🟢 1. NEW: localStorage helper functions
// --------------------------------------------------
const DISMISSED_PROMOS_KEY = 'dismissedPromoIDs';

/**
 * Reads the list of dismissed promo IDs from localStorage.
 * @returns {Array<string>} An array of promo IDs (e.g., ["promo-1", "promo-3"])
 */
const getDismissedPromoIDs = () => {
  try {
    const item = localStorage.getItem(DISMISSED_PROMOS_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Error reading dismissed promos from localStorage", error);
    return [];
  }
};

/**
 * Adds a new list of promo IDs to localStorage.
 * @param {Array<string>} newIDs - The promo IDs to add (e.g., ["promo-5", "promo-6"])
 */
const addDismissedPromoIDs = (newIDs) => {
  if (!newIDs || newIDs.length === 0) return;
  try {
    const currentIDs = getDismissedPromoIDs();
    // Use a Set to prevent duplicates
    const combinedIDs = [...new Set([...currentIDs, ...newIDs])];
    localStorage.setItem(DISMISSED_PROMOS_KEY, JSON.stringify(combinedIDs));
  } catch (error) {
    console.error("Error saving dismissed promos to localStorage", error);
  }
};
// --------------------------------------------------
// 🟢 END: localStorage helper functions
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

  const fetchNotifications = useCallback(async () => {
    if (!userdetails?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch personal user alerts (unchanged)
      const res = await fetch(`${BASE_URL}/api/notifications/user/${userdetails.id}`);
      const data = await res.json(); 

      // 2. Fetch global promos (unchanged)
      const promoRes = await fetch(`${BASE_URL}/api/promos/latest-public`);
      const promos = await promoRes.json();

      // --------------------------------------------------
      // 🟢 3. MODIFIED: Filter out dismissed promos
      // --------------------------------------------------
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
            // Use the promo's start date, or default to "now" if it's null
            createdAt: promo.validFrom || new Date().toISOString(), 
            isRead: false // Virtual promos are always "unread" until dismissed
          };
        })
        .filter(promo => !dismissedIDs.includes(promo.id)); // 👈 THE IMPORTANT FILTER
      // --------------------------------------------------
      // 🟢 END: MODIFIED
      // --------------------------------------------------

      // 4. Merge and sort lists (unchanged)
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
  // 🟢 4. MODIFIED: markAllAsRead
  // --------------------------------------------------
  const markAllAsRead = useCallback(async () => {
    if (!userdetails?.id) return;
    
    // 1. Get IDs of promos that are *currently* showing
    const promoIdsToDismiss = notifications
      .filter(n => String(n.id).startsWith('promo-'))
      .map(n => n.id);

    // 2. Add them to localStorage
    if (promoIdsToDismiss.length > 0) {
      addDismissedPromoIDs(promoIdsToDismiss);
    }

    // 3. Only run API call if there are personal alerts to mark as read
    if (unreadCount > 0) {
      setUnreadCount(0); // Optimistic update
      try {
        await fetch(`${BASE_URL}/api/notifications/mark-read/user/${userdetails.id}`, {
          method: 'PUT'
        });
      } catch (err) {
        console.error("[NotificationContext] Error marking as read:", err);
      }
    }
    
    // 4. Re-fetch everything. This will:
    //    - Show personal alerts as "read"
    //    - Hide the promos we just dismissed
    fetchNotifications();

  }, [userdetails?.id, unreadCount, BASE_URL, fetchNotifications, notifications]); // 👈 Added 'notifications'


  // --------------------------------------------------
  // 🟢 5. MODIFIED: clearAllNotifications
  // --------------------------------------------------
  const clearAllNotifications = useCallback(async () => {
    if (!userdetails?.id) return;
    if (!window.confirm("Are you sure you want to clear all your notifications?")) return;

    // 1. Get IDs of promos that are *currently* showing
    const promoIdsToDismiss = notifications
      .filter(n => String(n.id).startsWith('promo-'))
      .map(n => n.id);

    // 2. Add them to localStorage
    if (promoIdsToDismiss.length > 0) {
      addDismissedPromoIDs(promoIdsToDismiss);
    }
    
    // 3. Optimistic update: Show only promos (which fetchNotifications will then filter)
    setNotifications(prev => prev.filter(n => String(n.id).startsWith('promo-')));
    setUnreadCount(0);
    
    try {
      // 4. Call the DELETE API for personal alerts
      await fetch(`${BASE_URL}/api/notifications/user/${userdetails.id}`, {
        method: 'DELETE'
      });
      // 5. Re-fetch. This will clear the personal alerts AND the promos.
      fetchNotifications();
    } catch (err) {
      console.error("[NotificationContext] Error clearing notifications:", err);
      fetchNotifications(); // Re-fetch on error
    }
  }, [userdetails?.id, BASE_URL, fetchNotifications, notifications]); // 👈 Added 'notifications'


  // ... (useEffect is unchanged) ...
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