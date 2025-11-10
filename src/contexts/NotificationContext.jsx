// src/contexts/NotificationContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from './UserContext'; 

export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  fetchNotifications: () => {},
  markAllAsRead: () => {},
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
      // 1. Fetch personal user alerts
      const res = await fetch(`${BASE_URL}/api/notifications/user/${userdetails.id}`);
      const data = await res.json(); // Expects { notifications: [], unreadCount: 0 }
      
      // 2. Fetch global promos
      const promoRes = await fetch(`${BASE_URL}/api/promos/latest-public`);
      const promos = await promoRes.json();

      // 3. Convert promos into notification format
      const promoNotifications = promos.map(promo => ({
        id: `promo-${promo.id}`,
        message: promo.description || `Use code ${promo.code} for ${promo.discountValue}% off!`,
        link: '/cart',
        type: 'coupon',
        createdAt: new Date().toISOString(), // Mark as "new"
        isRead: false // We will handle "read" state for these differently
      }));

      // 4. Merge and sort lists
      const allNotifications = [...data.notifications, ...promoNotifications];
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(allNotifications);
      setUnreadCount(data.unreadCount); // We only count *personal* unread messages

    } catch (err) {
      console.error("[NotificationContext] Error fetching:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userdetails?.id, BASE_URL]);

  const markAllAsRead = useCallback(async () => {
    if (!userdetails?.id || unreadCount === 0) return;

    // Optimistic update for personal alerts
    setUnreadCount(0);
    setNotifications(prev => 
      prev
        .filter(n => !String(n.id).startsWith('promo-')) // Keep promos
        .map(n => ({ ...n, isRead: true }))
    );
    
    try {
      await fetch(`${BASE_URL}/api/notifications/mark-read/user/${userdetails.id}`, {
        method: 'PUT'
      });
      // After marking read, re-fetch to get accurate list
      fetchNotifications();
    } catch (err) {
      console.error("[NotificationContext] Error marking as read:", err);
      // Re-fetch to get correct server state
      fetchNotifications(); 
    }
  }, [userdetails?.id, unreadCount, BASE_URL, fetchNotifications]);


  const clearAllNotifications = useCallback(async () => {
    if (!userdetails?.id) return;
    if (!window.confirm("Are you sure you want to clear all your notifications?")) return;

    // Optimistic update: remove all personal alerts, keep promos
    const promoNotifications = notifications.filter(n => String(n.id).startsWith('promo-'));
    setNotifications(promoNotifications);
    setUnreadCount(0);
    
    try {
      // Call the new DELETE API
      await fetch(`${BASE_URL}/api/notifications/user/${userdetails.id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("[NotificationContext] Error clearing notifications:", err);
      // If it fails, re-fetch to get the correct server state
      fetchNotifications(); 
    }
  }, [userdetails?.id, BASE_URL, fetchNotifications, notifications]); // 🟢 3. ADD 'notifications' dependency

  // Effect to load notifications when user logs in or out
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