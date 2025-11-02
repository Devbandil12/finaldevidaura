import React, { createContext, useState, useEffect, useCallback, useMemo } from "react"; // 1. Import useMemo
import { useUser } from "@clerk/clerk-react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const { user, isLoaded, isSignedIn } = useUser();
  const [isUserLoading, setIsUserLoading] = useState(true);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // This useEffect is correct and fetches the user.
  useEffect(() => {
    const fetchUser = async () => {
      setIsUserLoading(true);

      if (!isLoaded) {
        return;
      }

      if (!isSignedIn) {
        setUserdetails(null);
        setIsUserLoading(false);
        return;
      }

      try {
        const email = user?.primaryEmailAddress?.emailAddress;
        const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
        const clerkId = user?.id;

        if (!email || !clerkId) {
          throw new Error("Clerk user is signed in but has no email or ID.");
        }

        const res = await fetch(`${BACKEND_URL}/api/users/find-by-clerk-id?clerkId=${clerkId}`);

        if (res.ok) {
          const data = await res.json();
          setUserdetails({ ...data, isNew: false });
        } else if (res.status === 404) {
          const postRes = await fetch(`${BACKEND_URL}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, clerkId }),
          });
          const postData = await postRes.json();
          const isNew = postRes.status === 201;
          setUserdetails({ ...postData, isNew });
        } else {
          throw new Error("Failed to fetch user");
        }
      } catch (err) {
        console.error("❌ Error in fetchUser:", err);
        setUserdetails(null);
      } finally {
        setIsUserLoading(false);
      }
    };
    
    fetchUser();
    
  }, [isLoaded, isSignedIn, user, BACKEND_URL]);
  
  
  // This useCallback is fine
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

  // This useEffect for addresses is also fine
  useEffect(() => {
    if (userdetails) {
      getUserAddress();
    } else {
      // Clear address when user logs out
      setAddress([]);
    }
  }, [userdetails, getUserAddress]);

  // All other useCallback functions (updateUser, addAddress, etc.) are fine
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


  // --- 2. WRAP THE `value` PROP IN `useMemo` ---
  // This ensures the value object's identity is stable, preventing
  // unnecessary re-renders and fixing stale state issues in consumers.
  const contextValue = useMemo(() => ({
    userdetails,
    isUserLoading,
    isSignedIn,
    address,
    setAddress,
    getUserAddress,
    updateUser,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress,
  }), [
    userdetails, 
    isUserLoading, 
    isSignedIn, 
    address, 
    getUserAddress, 
    updateUser, 
    addAddress, 
    editAddress, 
    deleteAddress, 
    setDefaultAddress
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};