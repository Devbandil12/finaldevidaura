// src/contexts/ContactContext.js
import React, { createContext, useState, useEffect } from "react";

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [queries, setQueries] = useState([]);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const getquery = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`);
      if (!res.ok) throw new Error("Failed to fetch queries");
      const data = await res.json();
      setQueries(data);
    } catch (error) {
      console.error("❌ Failed to fetch queries:", error);
    }
  };

  const deleteQuery = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete query");
      await getquery();
    } catch (error) {
      console.error("❌ Failed to delete query:", error);
    }
  };

  const addQuery = async (newQuery) => {
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
  };

  return (
    <ContactContext.Provider
      value={{ queries, setQueries, addQuery, getquery, deleteQuery }}
    >
      {children}
    </ContactContext.Provider>
  );
};
