import React, { createContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const [orders, setOrders] = useState([]);
  const { user, isLoaded, isSignedIn } = useUser();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Fetch or create user in DB
  const getUserDetail = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setUserdetails(null);
      return;
    }

    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

      if (!email) {
        console.warn("❌ Email not found from Clerk");
        return;
      }

      // 1. Try to get existing user
      let res = await fetch(`${BACKEND_URL}/api/users?email=${email}`);
      const data = await res.json();

      if (data) {
        setUserdetails(data);
      } else {
        // 2. Create new user
        const postRes = await fetch(`${BACKEND_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        const postData = await postRes.json();
        setUserdetails(postData);
      }
    } catch (err) {
      console.error("❌ Error in getUserDetail:", err);
    }
  }, [user, isLoaded, isSignedIn, BACKEND_URL]);

  // Fetch user's orders
  const getMyOrders = useCallback(async () => {
    if (!userdetails?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("❌ Failed to get orders:", error);
    }
  }, [userdetails?.id, BACKEND_URL]);

  // Fetch user's addresses
  const getUserAddress = useCallback(async () => {
    if (!userdetails?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}/addresses`);
      const data = await res.json();
      setAddress(data);
    } catch (error) {
      console.error("❌ Failed to get user addresses:", error);
    }
  }, [userdetails?.id, BACKEND_URL]);

  // On Clerk user change → fetch or create DB user
  useEffect(() => {
    getUserDetail();
  }, [getUserDetail]);

  // When userdetails available → fetch orders & addresses
  useEffect(() => {
    if (userdetails) {
      getMyOrders();
      getUserAddress();
    }
  }, [userdetails, getMyOrders, getUserAddress]);

  return (
    <UserContext.Provider
      value={{
        userdetails,
        setUserdetails,
        orders,
        address,
        setAddress,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
