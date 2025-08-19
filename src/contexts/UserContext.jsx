// src/contexts/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { useUser } from "@clerk/clerk-react";
import { OrderContext } from "./OrderContext"; // 1. ADD THIS LINE

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);

  // 2. ADD THIS LINE TO GET THE FUNCTION FROM THE OTHER CONTEXT
  const { getorders } = useContext(OrderContext);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const getUserDetail = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setUserdetails(null);
      return;
    }

    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
      const clerkId = user?.id;

      if (!email || !clerkId) {
        console.warn("❌ Email or Clerk ID not found from Clerk. Skipping DB operation.");
        return;
      }

      let res = await fetch(`${BACKEND_URL}/api/users/find-by-clerk-id?clerkId=${clerkId}`);
      const data = await res.json();

      if (data) {
        setUserdetails(data);
      } else {
        const phone = user?.phoneNumbers?.[0]?.phoneNumber || null;
        res = await fetch(`${BACKEND_URL}/api/users/add-new-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, clerkId, phone }),
        });
        const newUser = await res.json();
        setUserdetails(newUser);
      }
    } catch (error) {
      console.error("❌ Error fetching or adding user:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user, BACKEND_URL]);

  const getMyOrders = useCallback(async () => {
    if (!userdetails?.id) return;
    try {
      await getorders(false, false, userdetails.id);
    } catch (error) {
      console.error("❌ Failed to get user orders:", error);
    }
  }, [userdetails, getorders]);

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

  const getallusers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch all users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("❌ Failed to get all users:", error);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    getUserDetail();
  }, [getUserDetail]);

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
        address,
        orders,
        getallusers,
        users,
        getUserDetail,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};