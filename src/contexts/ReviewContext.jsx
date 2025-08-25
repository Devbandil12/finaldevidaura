// src/contexts/ReviewContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";

export const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
    const { userdetails } = useContext(UserContext);
    const [userReviews, setUserReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

    const getReviewsByUser = async () => {
        if (!userdetails?.id) return;
        setLoadingReviews(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/reviews/user/${userdetails.id}`);
            if (!res.ok) throw new Error("Failed to fetch user reviews");
            const data = await res.json();
            setUserReviews(data);
        } catch (error) {
            console.error("❌ Failed to fetch user reviews:", error);
        } finally {
            setLoadingReviews(false);
        }
    };

    useEffect(() => {
        if (userdetails?.id) {
            getReviewsByUser();
        }
    }, [userdetails?.id]);

    return (
        <ReviewContext.Provider value={{ userReviews, loadingReviews, getReviewsByUser }}>
            {children}
        </ReviewContext.Provider>
    );
};
