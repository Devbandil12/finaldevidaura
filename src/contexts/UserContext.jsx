// File: src/contexts/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const { user, isLoaded, isSignedIn } = useUser();

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // Fetch or create user in DB
  const getUserDetail = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setUserdetails(null);
      return;
    }

    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
      const clerkId = user?.id;

      if (!email || !clerkId) return;

      const res = await fetch(`${BACKEND_URL}/api/users/find-by-clerk-id?clerkId=${clerkId}`);
      if (!res.ok && res.status !== 404) throw new Error("Failed to fetch user");
      const data = await res.json();

      if (data && data.id) {
        setUserdetails(data);
      } else {
        // Create user
        const postRes = await fetch(`${BACKEND_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, clerkId }),
        });
        if (!postRes.ok) throw new Error("Failed to create user");
        const postData = await postRes.json();
        setUserdetails(postData);
      }
    } catch (err) {
      console.error("❌ Error in getUserDetail:", err);
    }
  }, [user, isLoaded, isSignedIn, BACKEND_URL]);

  // Get addresses for logged-in user
  const getUserAddress = useCallback(async () => {
    if (!userdetails?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}/addresses`);
      if (!res.ok) throw new Error("Failed to fetch addresses");
      const data = await res.json();
      setAddress(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Failed to get user addresses:", error);
    }
  }, [userdetails?.id, BACKEND_URL]);

  // Update User Details
  const updateUser = useCallback(async (updatedData) => {
    if (!userdetails?.id) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error("Failed to update user");
      const data = await res.json();
      setUserdetails(data);
      return data;
    } catch (error) {
      console.error("❌ Failed to update user:", error);
      return null;
    }
  }, [userdetails?.id, BACKEND_URL]);

  // Add User Address
  const addAddress = useCallback(async (newAddress) => {
    if (!userdetails?.id) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, userId: userdetails.id }),
      });
      if (!res.ok) throw new Error("Failed to add address");
      const created = await res.json();
      // Optimistically update addresses
      setAddress((prev) => [created, ...prev]);
      return created;
    } catch (error) {
      console.error("❌ Failed to add address:", error);
      return null;
    }
  }, [userdetails?.id, BACKEND_URL]);

  // Edit Address
  const editAddress = useCallback(async (addressId, updatedFields) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error("Failed to edit address");
      const updated = await res.json();
      setAddress((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      return updated;
    } catch (error) {
      console.error("❌ Failed to edit address:", error);
      return null;
    }
  }, [BACKEND_URL]);

  // Delete User Address
  const deleteAddress = useCallback(async (addressId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/addresses/${addressId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete address");
      setAddress((prev) => prev.filter((a) => a.id !== addressId));
      return true;
    } catch (error) {
      console.error("❌ Failed to delete address:", error);
      return false;
    }
  }, [BACKEND_URL]);

  // Set default address (backend should support this; if not, this will attempt PUT)
  const setDefaultAddress = useCallback(async (addressId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error("Failed to set default");
      const updated = await res.json();
      // Update local addresses: mark selected default, others false
      setAddress((prev) => prev.map((a) => ({ ...a, isDefault: a.id === updated.id })));
      return updated;
    } catch (error) {
      console.error("❌ Failed to set default address:", error);
      return null;
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    getUserDetail();
  }, [getUserDetail]);

  useEffect(() => {
    if (userdetails) {
      getUserAddress();
    }
  }, [userdetails, getUserAddress]);

  return (
    <UserContext.Provider
      value={{
        userdetails,
        address,
        setAddress,
        getUserDetail,
        getUserAddress,
        updateUser,
        addAddress,
        editAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};