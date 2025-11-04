// src/contexts/ContactContext.js
import React, { createContext, useState, useEffect, useCallback } from "react"; // 👈 IMPORT useCallback

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [queries, setQueries] = useState([]);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const getquery = useCallback(async () => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`);
      if (!res.ok) throw new Error("Failed to fetch queries");
      const data = await res.json();
      setQueries(data);
    } catch (error) {
      console.error("❌ Failed to fetch queries:", error);
    }
  }, [BACKEND_URL]); // 👈 ADD DEPENDENCIES

  const deleteQuery = useCallback(async (id) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete query");
      await getquery();
    } catch (error) {
      console.error("❌ Failed to delete query:", error);
    }
  }, [BACKEND_URL, getquery]); // 👈 ADD DEPENDENCIES

  const addQuery = useCallback(async (newQuery) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuery),
      });
      if (!res.ok) throw new Error("Failed to add query");
      await getquery();
    } catch (error) {
      console.error("❌ Failed to add query:", error);
    }
  }, [BACKEND_URL, getquery]); // 👈 ADD DEPENDENCIES


    const getQueriesByUser = useCallback(async (email) => { // 👈 WRAP
        if (!email) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/contact/user/${email}`);
            if (!res.ok) throw new Error("Failed to fetch user queries");
            const data = await res.json();
            setQueries(data); // Assuming this is for a single user's queries
        } catch (error) {
            console.error("❌ Failed to fetch user queries:", error);
        }
    }, [BACKEND_URL]); // 👈 ADD DEPENDENCIES



  return (
    <ContactContext.Provider
      value={{ queries, setQueries, addQuery, getquery, deleteQuery }}
    >
      {children}
    </ContactContext.Provider>
  );
};