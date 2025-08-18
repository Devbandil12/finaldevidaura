import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // ─── Load user from localStorage on app start ───────────
  useEffect(() => {
    const storedUser = localStorage.getItem("userdetails");
    if (storedUser) {
      setUserdetails(JSON.parse(storedUser));
    }
    setLoadingUser(false);
  }, []);

  // ─── Save user to localStorage ─────────────────────────
  const saveUser = (user) => {
    setUserdetails(user);
    localStorage.setItem("userdetails", JSON.stringify(user));
  };

  // ─── Clear user (logout) ───────────────────────────────
  const logoutUser = () => {
    setUserdetails(null);
    localStorage.removeItem("userdetails");
  };

  // ─── Login ─────────────────────────────────────────────
  const loginUser = async (credentials) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      saveUser(data.user);
      return data;
    } catch (err) {
      console.error("❌ loginUser error:", err);
      throw err;
    }
  };

  // ─── Signup ────────────────────────────────────────────
  const signupUser = async (info) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      if (!res.ok) throw new Error("Signup failed");
      const data = await res.json();
      saveUser(data.user);
      return data;
    } catch (err) {
      console.error("❌ signupUser error:", err);
      throw err;
    }
  };

  // ─── Update user profile ───────────────────────────────
  const updateUser = async (updates) => {
    if (!userdetails?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userdetails.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      saveUser(data);
      return data;
    } catch (err) {
      console.error("❌ updateUser error:", err);
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{
        userdetails,
        loadingUser,
        loginUser,
        signupUser,
        logoutUser,
        updateUser,
        saveUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
