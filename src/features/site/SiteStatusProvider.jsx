import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteStatus } from './useSiteStatus';
import MaintenancePage from './components/MaintenancePage';
import ComingSoonPage from './components/ComingSoonPage';
import AnnouncementBanner from './components/AnnouncementBanner';
import ScheduledMaintenanceBanner from './components/ScheduledMaintenanceBanner';

export const SiteStatusProvider = ({ children }) => {
  const { data: status, isLoading: isStatusLoading } = useSiteStatus();
  const location = useLocation();
  const [now, setNow] = useState(Date.now());

  // 1-second live clock so transitions happen automatically without page reload
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const path = location.pathname.toLowerCase();
  
  // Admin panel and authentication routes are never blocked
  const isAdminRoute = path.startsWith('/admin');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/sso-callback');
  const isExemptRoute = isAdminRoute || isAuthRoute;

  if (isStatusLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a]">
        <h1 className="text-2xl font-light text-white tracking-[0.2em] uppercase">
          Devid Aura
        </h1>
      </div>
    );
  }

  // Non-exempt routes (all storefront pages)
  if (!isExemptRoute && status) {
    const isMaintenanceExpired = Boolean(status.scheduledEnd && new Date(status.scheduledEnd).getTime() <= now);
    const isScheduledMaintenanceActive = Boolean(
      status.scheduledStart &&
      status.scheduledEnd &&
      new Date(status.scheduledStart).getTime() <= now &&
      !isMaintenanceExpired
    );

    // Emergency mode always blocks
    if (status.mode === 'EMERGENCY') {
      return <MaintenancePage status={status} />;
    }

    // Active maintenance mode or active scheduled window (switches seamlessly without reload)
    if ((status.mode === 'MAINTENANCE' && !isMaintenanceExpired) || isScheduledMaintenanceActive) {
      return <MaintenancePage status={status} />;
    }

    // Coming Soon mode (strictly blocks all guests and users on storefront)
    if (status.mode === 'COMING_SOON') {
      return <ComingSoonPage status={status} />;
    }
  }

  const isFutureMaintenance = Boolean(
    status?.scheduledStart && new Date(status.scheduledStart).getTime() > now
  );

  return (
    <>
      {!isExemptRoute && isFutureMaintenance && <ScheduledMaintenanceBanner status={status} />}
      {!isExemptRoute && status?.mode === 'LIVE' && <AnnouncementBanner />}
      {children}
    </>
  );
};



