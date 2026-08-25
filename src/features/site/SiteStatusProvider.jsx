import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteStatus } from './useSiteStatus';
import MaintenancePage from './components/MaintenancePage';
import ComingSoonPage from './components/ComingSoonPage';
import AnnouncementBanner from './components/AnnouncementBanner';

export const SiteStatusProvider = ({ children }) => {
  const { data: status, isLoading } = useSiteStatus();
  const location = useLocation();

  const path = location.pathname.toLowerCase();
  
  // If we are in the admin panel or authentication routes, we NEVER block the render tree
  const isAdminRoute = path.startsWith('/admin');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/sso-callback');
  const isExemptRoute = isAdminRoute || isAuthRoute;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a]">
        <h1 className="text-2xl font-light text-white tracking-[0.2em] uppercase">
          Devid Aura
        </h1>
      </div>
    );
  }

  if (!isExemptRoute && status) {
    if (status.mode === 'MAINTENANCE' || status.mode === 'EMERGENCY') {
      return <MaintenancePage status={status} />;
    }
    
    if (status.mode === 'COMING_SOON') {
      return <ComingSoonPage status={status} />;
    }
  }

  return (
    <>
      {!isExemptRoute && status?.mode === 'LIVE' && <AnnouncementBanner />}
      {children}
    </>
  );
};
