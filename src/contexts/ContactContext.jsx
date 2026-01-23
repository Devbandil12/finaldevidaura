import React, { createContext, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const { getToken } = useAuth();
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // Fetch all tickets (For Admin Panel)
  const getAllTickets = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error("❌ Failed to fetch tickets:", error);
    }
  }, [BACKEND_URL, getToken]);

  // Fetch specific user tickets (For User Dashboard)
  const getUserTickets = useCallback(async (email) => {
    if (!email) return;
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/contact/user/${email}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch user tickets");
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error("❌ Failed to fetch user tickets:", error);
    }
  }, [BACKEND_URL, getToken]);

  // Create Ticket (Usually public, but good practice to secure if logged in)
  const createTicket = useCallback(async (ticketData) => {
    try {
      // Optional: Add token if user is logged in, backend can decide whether to use it
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
      throw error; 
    }
  }, [BACKEND_URL]);

  // Reply to Ticket (Handles Closed Ticket Error)
  const replyToTicket = useCallback(async (ticketId, message, senderRole) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/contact/${ticketId}/reply`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ message, senderRole }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reply");
      }
      
      return await res.json();
    } catch (error) {
      console.error("❌ Failed to reply:", error);
      throw error; 
    }
  }, [BACKEND_URL, getToken]);

  // Update Status (For Admin to Close/Reopen)
  const updateTicketStatus = useCallback(async (ticketId, status) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/contact/${ticketId}/status`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    } catch (error) {
       console.error("❌ Status update failed", error);
       throw error;
    }
  }, [BACKEND_URL, getToken]);

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