import React, { createContext, useState, useCallback } from "react";

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Fetch all tickets (Admin)
  const getAllTickets = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error("❌ Failed to fetch tickets:", error);
    }
  }, [BACKEND_URL]);

  // Fetch specific user tickets
  const getUserTickets = useCallback(async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact/user/${email}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error("❌ Failed to fetch user tickets:", error);
    }
  }, [BACKEND_URL]);

  // Create Ticket
  const createTicket = useCallback(async (ticketData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create ticket");
      }
      
      return await res.json();
    } catch (error) {
      console.error("❌ Failed to create ticket:", error);
      throw error; // Re-throw so UI can handle it
    }
  }, [BACKEND_URL]);

  // 🟢 UPDATED: Reply to Ticket (Handles Closed Ticket Error)
  const replyToTicket = useCallback(async (ticketId, message, senderRole) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, senderRole }),
      });

      // 🟢 Capture specific backend error (e.g., "Ticket is permanently closed")
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reply");
      }
      
      return await res.json();
    } catch (error) {
      console.error("❌ Failed to reply:", error);
      throw error; // Re-throw so the UI (QueriesTab/UserPage) can show a toast error
    }
  }, [BACKEND_URL]);

  // Update Status
  const updateTicketStatus = useCallback(async (ticketId, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    } catch (error) {
        console.error("❌ Status update failed", error);
    }
  }, [BACKEND_URL]);

  return (
    <ContactContext.Provider
      value={{ 
        tickets, 
        setTickets, 
        getAllTickets, 
        getUserTickets, 
        createTicket, 
        replyToTicket, 
        updateTicketStatus 
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};