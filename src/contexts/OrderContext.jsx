// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { userdetails } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Modified getorders function to fetch all orders if isAdmin is true
  const getorders = async (showLoader = true, isAdmin = false) => {
    if (!isAdmin && !userdetails?.id) {
      // If not admin and no user, do nothing
      return;
    }
    
    if (showLoader) setLoadingOrders(true);

    try {
      const url = isAdmin
        ? `${BACKEND_URL}/api/orders/`
        : `${BACKEND_URL}/api/orders/${userdetails.id}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    } finally {
      if (showLoader) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    // This effect handles fetching orders for the signed-in user
    if (userdetails) {
      getorders();
    }
  }, [userdetails]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        getorders,
        setOrders,
        loadingOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
