import React, { useState, useEffect, memo } from 'react';
import MidSectionRenderer from './MidSectionRenderer'; // Import the new brain

const MidSectionBanner = memo(({ index = 0 }) => {
    const [banner, setBanner] = useState(null);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

    // 1. DATA FETCHING LOGIC (Same as your original code)
    useEffect(() => {
        const controller = new AbortController();
        
        fetch(`${BACKEND_URL}/api/cms/banners`, { signal: controller.signal })
            .then(res => res.json())
            .then(data => {
                const midBanners = data
                    .filter(b => b.type === 'mid_section' && b.isActive)
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                if (midBanners[index]) {
                    setBanner(midBanners[index]);
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') console.error(err);
            });

        return () => controller.abort();
    }, [index, BACKEND_URL]);

    if (!banner) return null;

    // 2. PASS DATA TO THE RENDERER
    // We let the Renderer decide which component to paint on the screen
    return <MidSectionRenderer banner={banner} index={index} />;
});

export default MidSectionBanner;