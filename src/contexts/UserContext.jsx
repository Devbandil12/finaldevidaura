import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useUser } from "@clerk/clerk-react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const { user, isLoaded, isSignedIn } = useUser();
  const [isUserLoading, setIsUserLoading] = useState(true);

  // keep backend url stable
  const BACKEND_URL = useMemo(
    () => (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, ""),
    []
  );

  // keep a mounted ref so we don't set state on unmounted component
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- fetch logged-in user from backend (with AbortController + strong guards) ---
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchUser = async () => {
      // we want to be "loading" until we know the userdetails or that user is signed-out
      setIsUserLoading(true);

      // Wait until Clerk finished loading and indicates sign-in status.
      // Also ensure user object has the fields we depend on.
      if (!isLoaded) {
        // keep isUserLoading true until isLoaded becomes true and effect re-runs
        return;
      }

      if (!isSignedIn) {
        if (!mountedRef.current) return;
        setUserdetails(null);
        setAddress([]);
        setIsUserLoading(false);
        return;
      }

      // strongly guard that user has an id and email before calling backend
      const clerkId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress;
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

      if (!clerkId || !email) {
        console.warn("Clerk user object missing id or email yet; delaying fetch.");
        // keep loading and wait for next update
        return;
      }

      try {
        // 1) Try find by clerk id
        const res = await fetch(
          `${BACKEND_URL}/api/users/find-by-clerk-id?clerkId=${encodeURIComponent(clerkId)}`,
          { signal }
        );

        if (signal.aborted) return;

        if (res.ok) {
          const data = await res.json();
          if (!mountedRef.current) return;
          // Use server canonical object
          setUserdetails({ ...data, isNew: false });
        } else if (res.status === 404) {
          // 2) Create user if not found
          const postRes = await fetch(`${BACKEND_URL}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, clerkId }),
            signal,
          });

          if (signal.aborted) return;

          const postData = await postRes.json();
          // Use server response as canonical
          const isNew = postRes.status === 201;
          if (!mountedRef.current) return;
          setUserdetails({ ...postData, isNew });
        } else {
          // other error
          const text = await res.text().catch(() => "");
          throw new Error(
            `Failed to fetch user: ${res.status} ${res.statusText} ${text}`
          );
        }
      } catch (err) {
        if (err.name === "AbortError") {
          // request was cancelled — ignore
          return;
        }
        console.error("❌ Error in fetchUser:", err);
        if (!mountedRef.current) return;
        setUserdetails(null);
      } finally {
        if (!mountedRef.current) return;
        setIsUserLoading(false);
      }
    };

    fetchUser();

    // cleanup cancels in-flight fetches
    return () => {
      controller.abort();
    };
  }, [isLoaded, isSignedIn, user?.id, user?.primaryEmailAddress, BACKEND_URL, user?.firstName, user?.lastName]);

  // --- address fetch with AbortController and safe-guarded user id ---
  const getUserAddress = useCallback(async () => {
    if (!userdetails?.id) {
      setAddress([]);
      return;
    }
    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const res = await fetch(`${BACKEND_URL}/api/address/user/${userdetails.id}`, { signal });
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

    // cleanup helper: returns abort function so caller may cancel if desired
    return () => controller.abort();
  }, [userdetails?.id, BACKEND_URL]);

  useEffect(() => {
    // When userdetails becomes available, fetch addresses.
    // Guard so we don't call with incomplete userdetails
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

  // --- CRUD functions for user & addresses (merge returned server objects) ---
  const updateUser = useCallback(
    async (updatedData) => {
      if (!userdetails?.id) return null;
      try {
        const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
        if (!res.ok) throw new Error("Failed to update user");
        const data = await res.json();
        if (mountedRef.current) {
          // prefer server-returned canonical object if present
          setUserdetails((prev) => ({ ...prev, ...(data || updatedData) }));
        }
        return data;
      } catch (error) {
        console.error("❌ Failed to update user:", error);
        return null;
      }
    },
    [userdetails?.id, BACKEND_URL]
  );

  const addAddress = useCallback(
    async (newAddress) => {
      if (!userdetails?.id) return null;
      try {
        const res = await fetch(`${BACKEND_URL}/api/address/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    [userdetails?.id, BACKEND_URL, getUserAddress]
  );

  const editAddress = useCallback(
    async (addressId, updatedFields) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/address/${addressId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
    [BACKEND_URL, getUserAddress]
  );

  const deleteAddress = useCallback(
    async (addressId) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/address/${addressId}`, {
          method: "DELETE",
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
    [BACKEND_URL, getUserAddress]
  );

  const setDefaultAddress = useCallback(
    async (addressId) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/address/${addressId}/default`, {
          method: "PUT",
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
    [BACKEND_URL, getUserAddress]
  );

  // stable context value
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
