import React, { memo } from 'react';
import StandardBanner from './banners/StandardBanner';
import CouponBanner from './banners/CouponBanner';
import CountdownBanner from './banners/CountdownBanner';
import VideoBanner from './banners/VideoBanner';

const MidSectionRenderer = memo(({ banner, index }) => {
    if (!banner) return null;

    // The router that decides which design to load based on your CMS
    switch (banner.templateType) {
        case 'coupon':
            return <CouponBanner banner={banner} index={index} />;
        case 'countdown':
            return <CountdownBanner banner={banner} index={index} />;
        case 'full_video':
            return <VideoBanner banner={banner} index={index} />;
        case 'standard':
        default:
            return <StandardBanner banner={banner} index={index} />;
    }
});

export default MidSectionRenderer;