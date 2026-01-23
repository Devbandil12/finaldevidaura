import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "./UserContext";
import { useAuth } from "@clerk/clerk-react";

export const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
    const { userdetails, isUserLoading } = useContext(UserContext);
    const { getToken } = useAuth();
    const [userReviews, setUserReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [error, setError] = useState(null); 

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

    const getReviewsByUser = useCallback(async () => {
        if (!userdetails?.id) return;

        setLoadingReviews(true);
        setError(null); 
        try {
            const token = await getToken();
            const res = await fetch(`${BACKEND_URL}/api/reviews/user/${userdetails.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch user reviews");
            const data = await res.json();
            setUserReviews(data);
        } catch (err) {
            console.error("❌ Failed to fetch user reviews:", err);
            setError(err.message); 
        } finally {
            setLoadingReviews(false);
        }
    }, [userdetails?.id, BACKEND_URL, getToken]); 

    useEffect(() => {
        if (isUserLoading) {
            setLoadingReviews(true);
            return;
        }

        if (userdetails?.id) {
            getReviewsByUser();
        } else {
            setUserReviews([]);
            setLoadingReviews(false);
        }
    }, [isUserLoading, userdetails?.id, getReviewsByUser]); 

    return (
        <ReviewContext.Provider value={{ userReviews, loadingReviews, error, getReviewsByUser }}>
            {children}
        </ReviewContext.Provider>
    );
};