import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useUser, useAuth } from "@clerk/clerk-react"; 
import { subscribeToPush } from '../utils/pushNotification';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth(); 
  const [isUserLoading, setIsUserLoading] = useState(true);

  const BACKEND_URL = useMemo(
    () => (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, ""),
    []
  );

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- fetch logged-in user from backend ---
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchUser = async () => {
      setIsUserLoading(true);

      if (!isLoaded) return;

      if (!isSignedIn) {
        if (!mountedRef.current) return;
        setUserdetails(null);
        setAddress([]);
        setIsUserLoading(false);
        return;
      }

      try {
        const token = await getToken();
        // 🟢 Use secure /me endpoint
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
          signal,
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        });

        if (signal.aborted) return;

        if (res.ok) {
          const data = await res.json();
          if (!mountedRef.current) return;
          setUserdetails({ ...data, isNew: false });
        } else if (res.status === 404) {
          // User doesn't exist, create them
          const clerkId = user?.id;
          const email = user?.primaryEmailAddress?.emailAddress;
          const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

          const postRes = await fetch(`${BACKEND_URL}/api/users`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ name, email, clerkId }),
            signal,
          });

          if (signal.aborted) return;

          const postData = await postRes.json();
          const isNew = postRes.status === 201;
          if (!mountedRef.current) return;
          setUserdetails({ ...postData, isNew });
        } else {
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("❌ Error in fetchUser:", err);
        if (!mountedRef.current) return;
        setUserdetails(null);
      } finally {
        if (!mountedRef.current) return;
        setIsUserLoading(false);
      }
    };

    fetchUser();

    return () => {
      controller.abort();
    };
  }, [isLoaded, isSignedIn, user?.id, BACKEND_URL, getToken]);

 // --- 🟢 FIX: Pass Token to Push Subscription ---
  useEffect(() => {
    const initPush = async () => {
      if (userdetails && userdetails.id && isSignedIn) {
        try {
          const token = await getToken(); // Get secure token
          if (token) {
            await subscribeToPush(userdetails.id, token); // Pass token to utility
          }
        } catch (err) {
          console.error("Failed to init push:", err);
        }
      }
    };
    initPush();
  }, [userdetails, isSignedIn, getToken]);
  
  const getUserAddress = useCallback(async () => {
    if (!userdetails?.id) {
      setAddress([]);
      return;
    }
    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/address/user/${userdetails.id}`, { 
          signal,
          headers: { Authorization: `Bearer ${token}` }
      });
      if (signal.aborted) return;
      if (!res.ok) throw new Error("Failed to fetch addresses");
      const data = await res.json();
      if (!mountedRef.current) return;
      setAddress(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("❌ Failed to get user addresses:", error);
      if (mountedRef.current) setAddress([]);
    }
    return () => controller.abort();
  }, [userdetails?.id, BACKEND_URL, getToken]);

  useEffect(() => {
    let abortFn;
    if (userdetails?.id) {
      const maybe = getUserAddress();
      if (typeof maybe === "function") abortFn = maybe;
    } else {
      setAddress([]);
    }
    return () => {
      if (abortFn) abortFn();
    };
  }, [userdetails, getUserAddress]);

  const updateUser = useCallback(
    async (updatedData) => {
      if (!userdetails?.id) return null;
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}`, {
          method: "PUT",
          headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ...updatedData }),
        });
        if (!res.ok) throw new Error("Failed to update user");
        const data = await res.json();
        if (mountedRef.current) {
          setUserdetails((prev) => ({ ...prev, ...(data || updatedData) }));
        }
        return data;
      } catch (error) {
        console.error("❌ Failed to update user:", error);
        return null;
      }
    },
    [userdetails?.id, BACKEND_URL, getToken]
  );

  const addAddress = useCallback(
    async (newAddress) => {
      if (!userdetails?.id) return null;
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/address/`, {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ ...newAddress, userId: userdetails.id }),
        });
        const data = await res.json();
        if (data?.success) {
          await getUserAddress();
          return data.data;
        }
        return null;
      } catch (error) {
        console.error("❌ Failed to add address:", error);
        return null;
      }
    },
    [userdetails?.id, BACKEND_URL, getUserAddress, getToken]
  );

  const editAddress = useCallback(
    async (addressId, updatedFields) => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/address/${addressId}`, {
          method: "PUT",
          headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(updatedFields),
        });
        const data = await res.json();
        if (data?.success) {
          await getUserAddress();
          return data.data;
        }
        return null;
      } catch (error) {
        console.error("❌ Failed to edit address:", error);
        return null;
      }
    },
    [BACKEND_URL, getUserAddress, getToken]
  );

  const deleteAddress = useCallback(
    async (addressId) => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/address/${addressId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.success) {
          await getUserAddress();
          return true;
        }
        return false;
      } catch (error) {
        console.error("❌ Failed to delete address:", error);
        return false;
      }
    },
    [BACKEND_URL, getUserAddress, getToken]
  );

  const setDefaultAddress = useCallback(
    async (addressId) => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/address/${addressId}/default`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.success) {
          await getUserAddress();
          return data.data;
        }
        return null;
      } catch (error) {
        console.error("❌ Failed to set default address:", error);
        return null;
      }
    },
    [BACKEND_URL, getUserAddress, getToken]
  );

  const contextValue = useMemo(
    () => ({
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
    }),
    [
      userdetails,
      isUserLoading,
      isSignedIn,
      address,
      getUserAddress,
      updateUser,
      addAddress,
      editAddress,
      deleteAddress,
      setDefaultAddress,
    ]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};