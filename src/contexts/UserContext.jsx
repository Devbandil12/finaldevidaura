// src/contexts/UserContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const { user, isLoaded, isSignedIn } = useUser();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // 🔹 Fetch or create user in DB
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

      let res = await fetch(`${BACKEND_URL}/api/users/find-by-clerk-id?clerkId=${clerkId}`);
      const data = await res.json();

      if (data) {
        setUserdetails(data);
      } else {
        const postRes = await fetch(`${BACKEND_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, clerkId }),
        });
        const postData = await postRes.json();
        setUserdetails(postData);
      }
    } catch (err) {
      console.error("❌ Error in getUserDetail:", err);
    }
  }, [user, isLoaded, isSignedIn, BACKEND_URL]);

  // 🔹 Get addresses for logged-in user
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

  useEffect(() => {
    getUserDetail();
  }, [getUserDetail]);

  useEffect(() => {
    if (userdetails) {
      getUserAddress();
    }
  }, [userdetails, getUserAddress]);

 // ✅ Update User Details (uses PUT /:id route)
    const updateUser = useCallback(async (updatedData) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (!res.ok) throw new Error("Failed to update user");
            const data = await res.json();
            setUserdetails(data);
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("❌ Failed to update user:", error);
            toast.error("Failed to update profile.");
        }
    }, [userdetails?.id, BACKEND_URL]);


// ✅ Add User Address (uses POST / route from addressRoutes.js)
    const addAddress = useCallback(async (newAddress) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/addresses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newAddress, userId: userdetails.id }),
            });
            if (!res.ok) throw new Error("Failed to add address");
            await res.json();
            getUserAddress();
            toast.success("Address added successfully!");
        } catch (error) {
            console.error("❌ Failed to add address:", error);
            toast.error("Failed to add address.");
        }
    }, [userdetails?.id, BACKEND_URL, getUserAddress]);

    // ✅ Delete User Address (uses DELETE /:id route from addressRoutes.js)
    const deleteAddress = useCallback(async (addressId) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/addresses/${addressId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete address");
            await res.json();
            getUserAddress();
            toast.info("Address deleted successfully!");
        } catch (error) {
            console.error("❌ Failed to delete address:", error);
            toast.error("Failed to delete address.");
        }
    }, [userdetails?.id, BACKEND_URL, getUserAddress]);


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
        deleteAddress,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
