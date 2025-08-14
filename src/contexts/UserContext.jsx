import React, { createContext, useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const [orders, setOrders] = useState([]);
  const { user } = useUser();

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")};

  // Fetch or create user in DB
  const getUserDetail = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

      if (!email) {
        console.warn("❌ Email not found from Clerk");
        return;
      }

      // 1. Try to get existing user
      let res = await fetch(`${BACKEND_URL}/api/users?email=${email}`);
      let data = await res.json();

      if (data) {
        setUserdetails(data);
      } else {
        // 2. Create new user
        res = await fetch(`${BACKEND_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        data = await res.json();
        setUserdetails(data);
      }
    } catch (err) {
      console.error("❌ Error in getUserDetail:", err);
    }
  };

  // Fetch user's orders
  const getMyOrders = async () => {
    if (!userdetails?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("❌ Failed to get orders:", error);
    }
  };

  // Fetch user's addresses
  const getUserAddress = async () => {
    if (!userdetails?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}/addresses`);
      const data = await res.json();
      setAddress(data);
    } catch (error) {
      console.error("❌ Failed to get user addresses:", error);
    }
  };

  // On Clerk user change → fetch or create DB user
  useEffect(() => {
    if (user) getUserDetail();
  }, [user]);

  // When userdetails available → fetch orders & addresses
  useEffect(() => {
    if (userdetails) {
      getMyOrders();
      getUserAddress();
    }
  }, [userdetails]);

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
