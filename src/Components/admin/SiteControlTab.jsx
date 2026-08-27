import React, { useState } from 'react';
import { useSiteStatus } from '../../features/site/useSiteStatus';
import { useAdminSiteStatus, useCreateAnnouncement } from '../../features/site/useSiteControl';
import { useAnnouncements } from '../../features/site/useAnnouncements';
import { useWaitlist, exportWaitlistCSV } from '../../features/site/useWaitlist';
import { useAuth } from '@clerk/clerk-react';
import { 
  ShieldAlert, Zap, Clock, Calendar, CheckCircle, Info, Megaphone, 
  X, AlertTriangle, Download, Users, Search, ChevronLeft, ChevronRight, 
  Sparkles, UserCheck, UserX, Server, Globe 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const SiteControlTab = () => {
  const { data: status, isLoading } = useSiteStatus();
  const { updateStatus } = useAdminSiteStatus();
  const createAnnouncement = useCreateAnnouncement();
  const { data: activeAnnouncements, isLoading: announcementsLoading } = useAnnouncements();
  const { getToken } = useAuth();

  const [schedule, setSchedule] = useState({ start: '', end: '', message: '' });
  const [isExtending, setIsExtending] = useState(false);
  const [extendEnd, setExtendEnd] = useState('');
  const [extendMessage, setExtendMessage] = useState('');
  const [announcement, setAnnouncement] = useState({
    title: '', message: '', type: 'INFO', severity: 'Low'
  });

  // Waitlist State
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [waitlistSort, setWaitlistSort] = useState('desc');
  const [waitlistPage, setWaitlistPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const { data: waitlistData, isLoading: waitlistLoading } = useWaitlist({
    search: waitlistSearch,
    sort: waitlistSort,
    page: waitlistPage,
    limit: 10,
  });

  const handleExportWaitlist = async () => {
    try {
      setIsExporting(true);
      await exportWaitlistCSV(getToken);
      window.toast.success('Waitlist CSV downloaded successfully');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      window.toast.error('Failed to export waitlist CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', payload: null });
  const [promptInput, setPromptInput] = useState('');

  const openModal = (type, payload = null) => {
    setModalConfig({ isOpen: true, type, payload });
    setPromptInput('');
  };

  const closeModal = () => setModalConfig({ isOpen: false, type: '', payload: null });

  const confirmModalAction = () => {
    if (modalConfig.type === 'EMERGENCY') {
      updateStatus.mutate({ 
        mode: 'EMERGENCY', 
        bypassEnabled: false, 
        reason: 'Emergency shutdown triggered by admin' 
      }, {
        onSuccess: () => {
          window.toast.success("Emergency Shutdown Activated");
          closeModal();
        }
      });
    } else if (modalConfig.type === 'OVERRIDE') {
      updateStatus.mutate({ 
        mode: modalConfig.payload, 
        scheduledStart: null, 
        scheduledEnd: null, 
        reason: `Admin manual override to ${modalConfig.payload}` 
      }, {
        onSuccess: () => {
          window.toast.success(`Mode changed to ${modalConfig.payload}`);
          closeModal();
        }
      });
    } else if (modalConfig.type === 'CANCEL_SCHEDULE') {
      updateStatus.mutate({
        scheduledStart: null,
        scheduledEnd: null,
        showCountdown: false,
        reason: 'Scheduled maintenance cancelled by admin'
      }, {
        onSuccess: () => {
          window.toast.success("Scheduled Maintenance Cancelled");
          closeModal();
        }
      });
    }
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    createAnnouncement.mutate(announcement, {
      onSuccess: () => {
        window.toast.success("Announcement published!");
        setAnnouncement({ title: '', message: '', type: 'INFO', severity: 'Low' });
      }
    });
  };

  if (isLoading) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-[var(--muted)] font-body space-y-3">
      <Server className="w-6 h-6 animate-pulse text-[var(--brand)]" />
      <span className="text-[10px] uppercase tracking-widest font-bold">Connecting to mainframe...</span>
    </div>
  );

  const handleOverride = (mode) => {
    if (mode === 'EMERGENCY') {
      openModal('EMERGENCY');
    } else {
      openModal('OVERRIDE', mode);
    }
  };

  const getMinDateTime = (offsetMinutes = 30) => {
    const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
    d.setSeconds(0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getMinExtendDateTime = (currentEndIso) => {
    if (!currentEndIso) return getMinDateTime(30);
    const d = new Date(new Date(currentEndIso).getTime() + 60 * 1000);
    d.setSeconds(0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleSchedule = (e) => {
    e.preventDefault();
    if (!schedule.start || !schedule.end) return window.toast.error("Start and End times are required");
    
    const startDate = new Date(schedule.start);
    const endDate = new Date(schedule.end);
    const minStart = new Date(Date.now() + 29.5 * 60 * 1000);

    if (startDate < minStart) {
      return window.toast.error("Start time must be at least 30 minutes in the future.");
    }
    if (endDate <= startDate) {
      return window.toast.error("End time must be after the start time.");
    }

    updateStatus.mutate({
      scheduledStart: startDate.toISOString(),
      scheduledEnd: endDate.toISOString(),
      title: 'Under Scheduled Maintenance',
      message: schedule.message || 'We are currently performing scheduled maintenance to upgrade our systems. We will be back shortly.',
      showCountdown: true,
      reason: 'Scheduled Maintenance'
    }, {
      onSuccess: () => {
        window.toast.success("Maintenance Scheduled & All Users Notified");
        setSchedule({ start: '', end: '', message: '' });
      }
    });
  };

  const handleExtendMaintenance = (e) => {
    e.preventDefault();
    if (!extendEnd) return window.toast.error("New end time is required");
    
    const currentEnd = new Date(status.scheduledEnd);
    const newEndDate = new Date(extendEnd);

    if (newEndDate <= currentEnd) {
      return window.toast.error("New end time must be later than the current scheduled end time.");
    }

    updateStatus.mutate({
      scheduledEnd: newEndDate.toISOString(),
      isExtension: true,
      message: extendMessage || 'Scheduled maintenance has been extended to complete necessary system enhancements.',
      reason: 'Maintenance Window Extended'
    }, {
      onSuccess: () => {
        window.toast.success("Maintenance Extended & All Users Notified");
        setIsExtending(false);
        setExtendEnd('');
        setExtendMessage('');
      }
    });
  };

  const cancelSchedule = () => {
    openModal('CANCEL_SCHEDULE');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 bg-[var(--bg)] min-h-screen text-[var(--text)] font-body transition-colors duration-500 pb-24 w-full">
      
      {/* ── 1. Header & Live Status ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.25rem] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[0.85rem] bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/40 text-[var(--brand)] flex items-center justify-center shrink-0">
            <Globe size={18} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text)]">Site Control Center</h2>
            <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest mt-0.5">Global Architecture Status</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm ${
          status?.mode === 'LIVE' ? 'bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)]' :
          status?.mode === 'MAINTENANCE' ? 'bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)]' :
          status?.mode === 'EMERGENCY' ? 'bg-[var(--error)]/10 border-[var(--error)]/20 text-[var(--error)]' :
          'bg-[var(--info)]/10 border-[var(--info)]/20 text-[var(--info)]'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            status?.mode === 'LIVE' ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success)]' :
            status?.mode === 'MAINTENANCE' ? 'bg-[var(--warning)] shadow-[0_0_8px_var(--warning)]' :
            status?.mode === 'EMERGENCY' ? 'bg-[var(--error)] shadow-[0_0_8px_var(--error)]' : 'bg-[var(--info)] shadow-[0_0_8px_var(--info)]'
          }`} />
          System: {status?.mode}
        </div>
      </div>

      {/* ── 2. Top Row: Overrides & Scheduler ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Instant Controls */}
        <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.25rem] shadow-sm p-5 lg:col-span-1 flex flex-col">
          <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={14} strokeWidth={2} /> Instant Overrides
          </h3>
          
          <div className="space-y-2.5 flex-1 flex flex-col justify-center">
            <button 
              onClick={() => handleOverride('LIVE')}
              disabled={status?.mode === 'LIVE'}
              className="w-full flex items-center justify-between p-3 rounded-xl ring-1 ring-[var(--border)]/40 bg-[var(--surface-muted)]/50 hover:bg-[var(--surface)] hover:ring-[var(--success)]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle size={16} strokeWidth={2} className="text-[var(--success)]" />
                <span className="text-xs font-bold text-[var(--text)] tracking-wide">Reactivate Website</span>
              </div>
            </button>

            <button 
              onClick={() => handleOverride('COMING_SOON')}
              disabled={status?.mode === 'COMING_SOON'}
              className="w-full flex items-center justify-between p-3 rounded-xl ring-1 ring-[var(--border)]/40 bg-[var(--surface-muted)]/50 hover:bg-[var(--surface)] hover:ring-[var(--info)]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Clock size={16} strokeWidth={2} className="text-[var(--info)]" />
                <span className="text-xs font-bold text-[var(--text)] tracking-wide">Coming Soon Mode</span>
              </div>
            </button>

            <button 
              onClick={() => handleOverride('EMERGENCY')}
              disabled={status?.mode === 'EMERGENCY'}
              className="w-full flex items-center justify-between p-3 rounded-xl ring-1 ring-[var(--error)]/30 bg-[var(--error)]/5 hover:bg-[var(--error)]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={16} strokeWidth={2} className="text-[var(--error)]" />
                <span className="text-xs font-bold text-[var(--error)] tracking-wide">Emergency Shutdown</span>
              </div>
            </button>
          </div>
        </div>

        {/* Scheduler */}
        <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.25rem] shadow-sm p-5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} strokeWidth={2} /> Maintenance Scheduler
            </h3>
            {status?.scheduledStart && (
              <button onClick={cancelSchedule} className="text-[10px] font-bold uppercase tracking-widest text-[var(--error)] hover:bg-[var(--error)]/10 px-2 py-1 rounded transition-colors">
                Cancel Schedule
              </button>
            )}
          </div>

          {status?.scheduledStart ? (
            <div className="flex-1 p-4 bg-[var(--warning)]/10 ring-1 ring-[var(--warning)]/20 rounded-xl flex flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                <Info size={18} strokeWidth={2} className="text-[var(--warning)] shrink-0 mt-0.5" />
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                    <h4 className="text-[var(--warning)] text-xs font-bold uppercase tracking-widest">Scheduled Maintenance Active</h4>
                    <button
                      type="button"
                      onClick={() => setIsExtending(!isExtending)}
                      className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer bg-[var(--surface)] px-2.5 py-1 rounded-md ring-1 ring-[var(--border)]/40 shadow-sm"
                    >
                      <Clock size={12} strokeWidth={2} />
                      {isExtending ? 'Close Extension' : 'Extend Maintenance'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text)]/70 font-medium mb-3">Notifications dispatched. System will transition automatically.</p>
                  <div className="grid grid-cols-2 gap-4 bg-[var(--surface)]/50 p-3 rounded-lg ring-1 ring-[var(--warning)]/10">
                    <div>
                      <span className="block text-[var(--muted)] text-[9px] font-bold uppercase tracking-widest mb-0.5">Starts</span>
                      <span className="text-[11px] font-bold text-[var(--text)] tabular-nums">{new Date(status.scheduledStart).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[var(--muted)] text-[9px] font-bold uppercase tracking-widest mb-0.5">Current Scheduled End</span>
                      <span className="text-[11px] font-bold text-[var(--text)] tabular-nums">{new Date(status.scheduledEnd).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Extend Maintenance Form ── */}
              {isExtending && (
                <form onSubmit={handleExtendMaintenance} className="mt-1 pt-3 border-t border-[var(--warning)]/20 space-y-3 bg-[var(--surface)] p-3.5 rounded-lg ring-1 ring-[var(--warning)]/20 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text)]">Extend Maintenance End Time</span>
                    <span className="text-[9px] text-[var(--muted)] font-medium">Must be after current end ({new Date(status.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">New End Time</label>
                      <input
                        type="datetime-local"
                        value={extendEnd}
                        min={getMinExtendDateTime(status.scheduledEnd)}
                        onChange={(e) => setExtendEnd(e.target.value)}
                        className="w-full bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/50 rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 shadow-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Extension Note (Optional)</label>
                      <input
                        type="text"
                        value={extendMessage}
                        onChange={(e) => setExtendMessage(e.target.value)}
                        placeholder="e.g. Finalizing database optimizations..."
                        className="w-full bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/50 rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 placeholder-[var(--muted)] shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsExtending(false)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateStatus.isPending || !extendEnd}
                      className="px-4 py-1.5 bg-[var(--brand)] text-[var(--bg)] font-bold text-[10px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                    >
                      {updateStatus.isPending ? 'Updating...' : 'Confirm Extension'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSchedule} className="space-y-3.5 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">
                    Start Time <span className="opacity-70 normal-case">(Min +30m)</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    value={schedule.start}
                    min={getMinDateTime(30)}
                    onChange={(e) => setSchedule({...schedule, start: e.target.value})}
                    className="w-full bg-[var(--surface)] ring-1 ring-[var(--border)]/50 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">
                    End Time
                  </label>
                  <input 
                    type="datetime-local" 
                    value={schedule.end}
                    min={schedule.start || getMinDateTime(35)}
                    onChange={(e) => setSchedule({...schedule, end: e.target.value})}
                    className="w-full bg-[var(--surface)] ring-1 ring-[var(--border)]/50 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3.5 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">Notification Message (Optional)</label>
                  <input 
                    type="text" 
                    value={schedule.message}
                    onChange={(e) => setSchedule({...schedule, message: e.target.value})}
                    placeholder="e.g. Essential upgrades in progress..."
                    className="w-full bg-[var(--surface)] ring-1 ring-[var(--border)]/50 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)] shadow-sm"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={updateStatus.isPending}
                  className="w-full sm:w-auto bg-[var(--text)] text-[var(--surface)] font-bold text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[var(--brand)] transition-colors disabled:opacity-50 shadow-sm shrink-0"
                >
                  {updateStatus.isPending ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── 3. Global Announcements ────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.25rem] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border)]/40">
          <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
            <Megaphone size={14} strokeWidth={2} /> Global Announcements
          </h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)]/40">
          {/* Create Form */}
          <div className="p-4 sm:p-5">
            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">Title</label>
                <input 
                  type="text" 
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                  placeholder="e.g. Scheduled Maintenance"
                  required
                  className="w-full bg-[var(--surface-muted)]/50 ring-1 ring-[var(--border)]/40 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">Message</label>
                <input 
                  type="text" 
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                  placeholder="e.g. We will be down from 11 PM to 6 AM."
                  required
                  className="w-full bg-[var(--surface-muted)]/50 ring-1 ring-[var(--border)]/40 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">Type</label>
                  <select 
                    value={announcement.type}
                    onChange={(e) => setAnnouncement({...announcement, type: e.target.value})}
                    className="w-full bg-[var(--surface-muted)]/50 ring-1 ring-[var(--border)]/40 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 outline-none"
                  >
                    <option value="INFO">INFO</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="PROMOTION">PROMOTION</option>
                    <option value="WARNING">WARNING</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">Severity</label>
                  <select 
                    value={announcement.severity}
                    onChange={(e) => setAnnouncement({...announcement, severity: e.target.value})}
                    className="w-full bg-[var(--surface-muted)]/50 ring-1 ring-[var(--border)]/40 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                disabled={createAnnouncement.isPending}
                className="w-full bg-[var(--text)] text-[var(--surface)] font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg hover:bg-[var(--brand)] transition-colors disabled:opacity-50 mt-2 shadow-sm"
              >
                {createAnnouncement.isPending ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </form>
          </div>

          {/* Active List */}
          <div className="p-4 sm:p-5 bg-[var(--surface-muted)]/10">
            <h4 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-4">Active Deployments</h4>
            {announcementsLoading ? (
              <div className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest animate-pulse">Loading...</div>
            ) : activeAnnouncements?.length === 0 ? (
              <div className="text-[var(--muted)] text-[11px] italic">No active announcements.</div>
            ) : (
              <div className="space-y-3 h-48 overflow-y-auto custom-scrollbar pr-2">
                {activeAnnouncements?.map((a) => (
                  <div key={a.id} className="p-3 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/50 rounded text-[var(--sub)] uppercase tracking-widest">{a.type}</span>
                      <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest tabular-nums">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h5 className="text-[var(--text)] text-xs font-bold tracking-tight">{a.title}</h5>
                    <p className="text-[11px] text-[var(--sub)] leading-snug mt-0.5">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Launch Waitlist Management ──────────────────────────────────── */}
      <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.25rem] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col font-body transition-colors duration-500 w-full">
        
        {/* Header & Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)]/40 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-[0.75rem] bg-[var(--brand)]/5 ring-1 ring-[var(--brand)]/20 text-[var(--brand)] flex items-center justify-center shrink-0">
              <Users size={16} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">Launch Waitlist</h3>
                <span className="px-1.5 py-0.5 rounded font-body text-[8px] uppercase tracking-widest font-bold bg-[var(--surface-muted)] text-[var(--sub)] ring-1 ring-[var(--border)]/40">
                  {waitlistData?.total ? waitlistData.total.toLocaleString() : 0} Subscribers
                </span>
              </div>
              <p className="text-[10px] text-[var(--muted)] font-medium">Subscribers collected during the Coming Soon period.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* High-Density Search Bar */}
            <div className="relative group flex-1 xl:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--brand)] transition-colors" strokeWidth={2} />
              <input
                type="text"
                value={waitlistSearch}
                onChange={(e) => {
                  setWaitlistSearch(e.target.value);
                  setWaitlistPage(1);
                }}
                placeholder="Search email..."
                className="w-full xl:w-56 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)] shadow-sm"
              />
            </div>

            {/* Minimalist Sort Selector */}
            <div className="relative shrink-0">
              <select
                value={waitlistSort}
                onChange={(e) => setWaitlistSort(e.target.value)}
                className="appearance-none bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-lg pl-3 pr-7 py-1.5 text-[11px] font-bold text-[var(--text)] focus:outline-none focus:ring-[var(--brand)]/50 shadow-sm cursor-pointer transition-all outline-none"
              >
                <option value="desc">Newest</option>
                <option value="asc">Oldest</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)] text-[8px] font-bold">▼</div>
            </div>

            {/* Sleek Export Button */}
            <button
              type="button"
              onClick={handleExportWaitlist}
              disabled={isExporting || !waitlistData?.total}
              className="flex items-center justify-center gap-1.5 bg-[var(--surface-muted)] hover:bg-[var(--text)] hover:text-[var(--surface)] text-[var(--text)] ring-1 ring-[var(--border)]/40 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm shrink-0"
            >
              <Download size={12} strokeWidth={2.5} />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        {/* High-Density Subscribers Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[var(--surface-muted)]/30 border-b border-[var(--border)]/40">
              <tr>
                <th className="py-2.5 px-4 sm:px-5 text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Email Address</th>
                <th className="py-2.5 px-4 sm:px-5 text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Subscribed Date</th>
                <th className="py-2.5 px-4 sm:px-5 text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Account Type</th>
                <th className="py-2.5 px-4 sm:px-5 text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/40">
              {waitlistLoading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] animate-pulse">Loading subscribers...</span>
                  </td>
                </tr>
              ) : waitlistData?.subscribers?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <span className="text-[11px] font-medium text-[var(--sub)] italic">
                      {waitlistSearch ? 'No subscribers match your search query.' : 'No waitlist subscribers recorded yet.'}
                    </span>
                  </td>
                </tr>
              ) : (
                waitlistData?.subscribers?.map((sub) => {
                  const dateObj = new Date(sub.subscribedAt);
                  return (
                    <tr key={sub.id} className="hover:bg-[var(--surface-muted)]/40 transition-colors duration-200 group">
                      <td className="py-3 px-4 sm:px-5 text-xs font-bold text-[var(--text)] tracking-tight group-hover:text-[var(--brand)] transition-colors">
                        {sub.email}
                      </td>
                      <td className="py-3 px-4 sm:px-5 text-[11px] font-medium text-[var(--sub)] tabular-nums flex items-center gap-1.5">
                        <span>{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-[var(--border)] font-bold">•</span>
                        <span className="text-[var(--muted)]">{dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="py-3 px-4 sm:px-5">
                        {sub.isRegisteredUser ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest bg-[var(--brand)]/10 text-[var(--brand)] ring-1 ring-[var(--brand)]/20">
                            <UserCheck size={10} strokeWidth={2.5} />
                            Registered {sub.userName ? `(${sub.userName.split(' ')[0]})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest bg-[var(--surface-muted)] text-[var(--sub)] ring-1 ring-[var(--border)]/50">
                            <UserX size={10} strokeWidth={2.5} />
                            Guest
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 sm:px-5">
                        {sub.status === 'notified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest bg-[var(--success)]/10 text-[var(--success)] ring-1 ring-[var(--success)]/20">
                            <CheckCircle size={10} strokeWidth={2.5} />
                            Notified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest bg-[var(--warning)]/10 text-[var(--warning)] ring-1 ring-[var(--warning)]/20">
                            <Clock size={10} strokeWidth={2.5} />
                            Subscribed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Minimalist Pagination Bar */}
        {waitlistData?.totalPages > 1 && (
          <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-t border-[var(--border)]/40 bg-[var(--surface-muted)]/10">
            <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">
              Page {waitlistData.page} of {waitlistData.totalPages} <span className="lowercase normal-case mx-1 font-medium text-[var(--sub)] tracking-normal">({waitlistData.total} total)</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWaitlistPage((p) => Math.max(1, p - 1))}
                disabled={waitlistPage <= 1}
                className="p-1.5 rounded-md ring-1 ring-[var(--border)]/50 bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setWaitlistPage((p) => Math.min(waitlistData.totalPages, p + 1))}
                disabled={waitlistPage >= waitlistData.totalPages}
                className="p-1.5 rounded-md ring-1 ring-[var(--border)]/50 bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Custom Confirmation Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[var(--bg)]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 15 }} 
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.5rem] p-6 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative"
            >
              <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors bg-[var(--surface-muted)] p-1.5 rounded-lg">
                <X size={16} strokeWidth={2} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${modalConfig.type === 'EMERGENCY' ? 'bg-[var(--error)]/10 text-[var(--error)] ring-[var(--error)]/20' : 'bg-[var(--warning)]/10 text-[var(--warning)] ring-[var(--warning)]/20'}`}>
                  {modalConfig.type === 'EMERGENCY' ? <ShieldAlert size={18} strokeWidth={2} /> : <AlertTriangle size={18} strokeWidth={2} />}
                </div>
                <h3 className="text-base font-bold text-[var(--text)] tracking-tight">
                  {modalConfig.type === 'EMERGENCY' ? 'Emergency Shutdown' : 
                   modalConfig.type === 'CANCEL_SCHEDULE' ? 'Cancel Schedule' : 
                   `Transition to ${modalConfig.payload}`}
                </h3>
              </div>

              <div className="mb-6 space-y-4">
                <p className="text-[11px] font-medium text-[var(--sub)] leading-relaxed">
                  {modalConfig.type === 'EMERGENCY' 
                    ? "WARNING: This will immediately take the storefront offline for everyone. Type SHUTDOWN to confirm." 
                    : modalConfig.type === 'CANCEL_SCHEDULE'
                    ? "Are you sure you want to cancel the scheduled maintenance?"
                    : `Are you sure you want to change the site status to ${modalConfig.payload}?`}
                </p>

                {modalConfig.type === 'EMERGENCY' && (
                  <input 
                    type="text" 
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Type SHUTDOWN"
                    className="w-full bg-[var(--surface-muted)]/50 ring-1 ring-[var(--error)]/40 rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:ring-[var(--error)] font-mono uppercase shadow-inner"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2.5">
                <button onClick={closeModal} className="px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={confirmAction}
                  disabled={updateStatus.isPending || (modalConfig.type === 'EMERGENCY' && promptInput !== 'SHUTDOWN')}
                  className={`px-5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 ${
                    modalConfig.type === 'EMERGENCY' ? 'bg-[var(--error)] text-white hover:brightness-110' : 'bg-[var(--text)] text-[var(--surface)] hover:bg-[var(--brand)]'
                  }`}
                >
                  {updateStatus.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SiteControlTab;