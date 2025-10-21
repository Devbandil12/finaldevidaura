// src/contexts/ReviewContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "./UserContext";

export const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
    const { userdetails } = useContext(UserContext);
    const [userReviews, setUserReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [error, setError] = useState(null); // ✅ 1. ADDED: State to hold potential errors

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

    // ✅ 2. WRAPPED: Function is memoized with useCallback
    const getReviewsByUser = useCallback(async () => {
        if (!userdetails?.id) return;

        setLoadingReviews(true);
        setError(null); // Reset error on new fetch
        try {
            const res = await fetch(`${BACKEND_URL}/api/reviews/user/${userdetails.id}`);
            if (!res.ok) throw new Error("Failed to fetch user reviews");
            const data = await res.json();
            setUserReviews(data);
        } catch (err) {
            console.error("❌ Failed to fetch user reviews:", err);
            setError(err.message); // Set the error message
        } finally {
            setLoadingReviews(false);
        }
    }, [userdetails?.id, BACKEND_URL]); // Dependencies for useCallback

    useEffect(() => {
        if (userdetails?.id) {
            getReviewsByUser();
        }
    }, [userdetails?.id, getReviewsByUser]); // Added getReviewsByUser to dependency array

    return (
        <ReviewContext.Provider value={{ userReviews, loadingReviews, error, getReviewsByUser }}>
            {children}
        </ReviewContext.Provider>
    );
};