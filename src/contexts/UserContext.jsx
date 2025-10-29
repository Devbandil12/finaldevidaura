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

      // ✅ Case 1: Existing user is found
      if (res.ok) {
        const data = await res.json();
        // Mark as not new (no guest cart merge)
        setUserdetails({ ...data, isNew: false });

        // ✅ Case 2: User does not exist (404) → create new user
      } else if (res.status === 404) {
        const postRes = await fetch(`${BACKEND_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, clerkId }),
        });

        const postData = await postRes.json();

        // ✅ Only mark as new if backend actually created the user (201)
        const isNew = postRes.status === 201;

        setUserdetails({ ...postData, isNew });

        // ✅ Case 3: Handle other potential errors
      } else {
        throw new Error("Failed to fetch user");
      }

    } catch (err) {
      console.error("❌ Error in getUserDetail:", err);
    }
  }, [user, isLoaded, isSignedIn, BACKEND_URL]);



  // --- No changes are needed for the functions below this line ---

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
      setUserdetails(prev => ({ ...prev, ...updatedData }));
      return data;
    } catch (error) {
      console.error("❌ Failed to update user:", error);
      return null;
    }
  }, [userdetails?.id, BACKEND_URL]);

  // Fetch addresses
  const getUserAddress = useCallback(async () => {
    if (!userdetails?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/address/user/${userdetails.id}`);
      if (!res.ok) throw new Error("Failed to fetch addresses");
      const data = await res.json();
      setAddress(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("❌ Failed to get user addresses:", error);
    }
  }, [userdetails?.id, BACKEND_URL]);

  // Add Address
  const addAddress = useCallback(async (newAddress) => {
    if (!userdetails?.id) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/address/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, userId: userdetails.id }),
      });
      const data = await res.json();
      if (data.success) {
        await getUserAddress();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("❌ Failed to add address:", error);
      return null;
    }
  }, [userdetails?.id, BACKEND_URL, getUserAddress]);

  // Edit Address
  const editAddress = useCallback(async (addressId, updatedFields) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/address/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (data.success) {
        await getUserAddress();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("❌ Failed to edit address:", error);
      return null;
    }
  }, [BACKEND_URL, getUserAddress]);

  // Delete Address
  const deleteAddress = useCallback(async (addressId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/address/${addressId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await getUserAddress();
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Failed to delete address:", error);
      return false;
    }
  }, [BACKEND_URL, getUserAddress]);

  // Set Default Address
  const setDefaultAddress = useCallback(async (addressId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/address/${addressId}/default`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.success) {
        await getUserAddress();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("❌ Failed to set default address:", error);
      return null;
    }
  }, [BACKEND_URL, getUserAddress]);

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
        isSignedIn,
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