import React, { useState } from 'react';
import { useAnnouncements } from '../useAnnouncements';
import { AlertTriangle, Info, Bell, X, Wrench, ShieldAlert, Sparkles } from 'lucide-react';

const ICONS = {
  INFO: Info,
  SUCCESS: Bell,
  PROMOTION: Sparkles,
  WARNING: AlertTriangle,
  MAINTENANCE: Wrench,
  EMERGENCY: ShieldAlert,
};

const COLORS = {
  INFO: 'bg-blue-600 text-white',
  SUCCESS: 'bg-emerald-600 text-white',
  PROMOTION: 'bg-purple-600 text-white',
  WARNING: 'bg-amber-500 text-black',
  MAINTENANCE: 'bg-zinc-800 text-white border-b border-zinc-700',
  EMERGENCY: 'bg-red-600 text-white',
};

const AnnouncementBanner = () => {
  const { data: announcements, isLoading } = useAnnouncements();
  const [dismissed, setDismissed] = useState(new Set());

  if (isLoading || !announcements || announcements.length === 0) return null;

  // Find the highest severity active announcement targeting Website Banner
  const activeBanners = announcements.filter(
    (a) => a.channels.includes('Website Banner') && !dismissed.has(a.id)
  );

  if (activeBanners.length === 0) return null;

  // Just show the first one (they are ordered by latest)
  const announcement = activeBanners[0];
  const Icon = ICONS[announcement.type] || Info;
  const colorClass = COLORS[announcement.type] || COLORS.INFO;

  return (
    <div className={`relative px-4 py-3 flex items-center justify-between shadow-sm z-50 ${colorClass}`}>
      <div className="flex-1 flex items-center justify-center gap-3">
        <Icon className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">
          <span className="font-bold mr-2">{announcement.title}:</span>
          {announcement.message}
        </p>
      </div>
      <button 
        onClick={() => setDismissed(new Set([...dismissed, announcement.id]))}
        className="p-1 hover:bg-black/10 rounded-full transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
