// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { userdetails } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const getorders = async (showLoader = true) => {
    if (!userdetails?.id) return;
    if (showLoader) setLoadingOrders(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${userdetails.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    } finally {
      if (showLoader) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    getorders();
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
