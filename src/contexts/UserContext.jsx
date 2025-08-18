Import React, { createContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]); // New state for all users
  const { user, isLoaded, isSignedIn } = useUser();
const [loading, setLoading] = useState(true); // Add a loading state

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const getUserDetail = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setUserdetails(null);
      return;
    }

    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
      const clerkId = user?.id; // Correct variable name from schema

      if (!email || !clerkId) {
        console.warn("❌ Email or Clerk ID not found from Clerk. Skipping DB operation.");
        return;
      }

      // 1. Try to get existing user using clerkId for a more reliable lookup
      let res = await fetch(`${BACKEND_URL}/api/users/find-by-clerk-id?clerkId=${clerkId}`);
      const data = await res.json();

      if (data) {
        setUserdetails(data);
      } else {
        // 2. Create new user
        const postRes = await fetch(`${BACKEND_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, clerkId }), // Use 'clerkId' to match schema
        });
        const postData = await postRes.json();
        setUserdetails(postData);
      }
    } catch (err) {
      console.error("❌ Error in getUserDetail:", err);
    }
  }, [user, isLoaded, isSignedIn, BACKEND_URL]);

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

  // New function to get all users for the admin panel
  const getallusers = useCallback(async () => {
    try {
     setLoading(true); // Set loading to true before the fetch
      const res = await fetch(`${BACKEND_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch all users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("❌ Failed to get all users:", error);
    } finally {
    setLoading(false); // Set loading to false after the fetch completes (success or failure)
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
        getallusers, // Add new function
        users, // Add new state
        getUserDetail,
        setAddress,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};