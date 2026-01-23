import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from './UserContext';
import { useAuth } from "@clerk/clerk-react";

// --------------------------------------------------
// localStorage helper functions 
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
  const { getToken } = useAuth();

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
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/notifications/user/${userdetails.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
        .filter(promo => !dismissedIDs.includes(promo.id)); 

      const allNotifications = [...data.notifications, ...promoNotifications];
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(allNotifications);
      setUnreadCount(data.unreadCount); 

    } catch (err) {
      console.error("[NotificationContext] Error fetching:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userdetails?.id, BASE_URL, getToken]);


  const markAllAsRead = useCallback(async () => {
    if (!userdetails?.id || unreadCount === 0) return;

    setUnreadCount(0);
    setNotifications(prev =>
      prev.map(n => 
        !String(n.id).startsWith('promo-') ? { ...n, isRead: true } : n
      )
    );
    
    try {
      const token = await getToken();
      await fetch(`${BASE_URL}/api/notifications/mark-read/user/${userdetails.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("[NotificationContext] Error marking as read:", err);
      fetchNotifications(); 
    }
  }, [userdetails?.id, unreadCount, BASE_URL, fetchNotifications, getToken]);


  const clearAllNotifications = useCallback(async () => {
    if (!userdetails?.id) return;
    if (!window.confirm("Are you sure you want to clear all your notifications?")) return;

    const promoIdsToDismiss = notifications
      .filter(n => String(n.id).startsWith('promo-'))
      .map(n => n.id);

    if (promoIdsToDismiss.length > 0) {
      addDismissedPromoIDs(promoIdsToDismiss);
    }
    
    setNotifications([]);
    setUnreadCount(0);
    
    try {
      const token = await getToken();
      await fetch(`${BASE_URL}/api/notifications/user/${userdetails.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications(); 
    } catch (err) {
      console.error("[NotificationContext] Error clearing notifications:", err);
      fetchNotifications(); 
    }
  }, [userdetails?.id, BASE_URL, fetchNotifications, notifications, getToken]);

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