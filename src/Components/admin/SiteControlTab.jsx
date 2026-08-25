import React, { useState } from 'react';
import { useSiteStatus } from '../../features/site/useSiteStatus';
import { useAdminSiteStatus, useCreateAnnouncement } from '../../features/site/useSiteControl';
import { useAnnouncements } from '../../features/site/useAnnouncements';
import { useWaitlist, exportWaitlistCSV } from '../../features/site/useWaitlist';
import { useAuth } from '@clerk/clerk-react';
import { ShieldAlert, Zap, Clock, Calendar, CheckCircle, Info, Megaphone, X, AlertTriangle, Download, Users, Search, ChevronLeft, ChevronRight, Sparkles, UserCheck, UserX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const SiteControlTab = () => {
  const { data: status, isLoading } = useSiteStatus();
  const { updateStatus } = useAdminSiteStatus();
  const createAnnouncement = useCreateAnnouncement();
  const { data: activeAnnouncements, isLoading: announcementsLoading } = useAnnouncements();
  const { getToken } = useAuth();

  const [schedule, setSchedule] = useState({ start: '', end: '', message: '' });
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

  const confirmAction = () => {
    if (modalConfig.type === 'EMERGENCY') {
      if (promptInput !== 'SHUTDOWN') {
        window.toast.error("Aborted: Incorrect confirmation text");
        return closeModal();
      }
      updateStatus.mutate({ mode: 'EMERGENCY', reason: 'Emergency Shutdown Triggered' }, {
        onSuccess: () => { window.toast.success(`Site transitioned to EMERGENCY`); closeModal(); }
      });
    } else if (modalConfig.type === 'OVERRIDE') {
      updateStatus.mutate({ mode: modalConfig.payload, reason: 'Manual Override' }, {
        onSuccess: () => { window.toast.success(`Site transitioned to ${modalConfig.payload}`); closeModal(); }
      });
    } else if (modalConfig.type === 'CANCEL_SCHEDULE') {
      updateStatus.mutate({
        scheduledStart: null,
        scheduledEnd: null,
        reason: 'Cancelled schedule'
      }, {
        onSuccess: () => { window.toast.success("Schedule Cancelled"); closeModal(); }
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

  if (isLoading) return <div className="p-8 text-[var(--text)]">Loading Site Control...</div>;

  const handleOverride = (mode) => {
    if (mode === 'EMERGENCY') {
      openModal('EMERGENCY');
    } else {
      openModal('OVERRIDE', mode);
    }
  };

  const handleSchedule = (e) => {
    e.preventDefault();
    if (!schedule.start || !schedule.end) return window.toast.error("Start and End times are required");
    
    updateStatus.mutate({
      scheduledStart: new Date(schedule.start).toISOString(),
      scheduledEnd: new Date(schedule.end).toISOString(),
      message: schedule.message,
      showCountdown: true,
      reason: 'Scheduled Maintenance'
    }, {
      onSuccess: () => window.toast.success("Maintenance Scheduled")
    });
  };

  const cancelSchedule = () => {
    openModal('CANCEL_SCHEDULE');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[var(--bg)] min-h-screen text-[var(--sub)]">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-light text-[var(--text)] tracking-tight">Site Control Center</h2>
        <div className={`px-4 py-1.5 rounded-full border text-sm font-medium tracking-wide flex items-center gap-2 ${
          status?.mode === 'LIVE' ? 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] border-[color-mix(in_srgb,var(--success)_20%,transparent)] text-[var(--success)]' :
          status?.mode === 'MAINTENANCE' ? 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] border-[color-mix(in_srgb,var(--warning)_20%,transparent)] text-[var(--warning)]' :
          status?.mode === 'EMERGENCY' ? 'bg-[color-mix(in_srgb,var(--error)_12%,transparent)] border-[color-mix(in_srgb,var(--error)_20%,transparent)] text-[var(--error)]' :
          'bg-[color-mix(in_srgb,var(--info)_12%,transparent)] border-[color-mix(in_srgb,var(--info)_20%,transparent)] text-[var(--info)]'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            status?.mode === 'LIVE' ? 'bg-emerald-500' :
            status?.mode === 'MAINTENANCE' ? 'bg-amber-500' :
            status?.mode === 'EMERGENCY' ? 'bg-red-500' : 'bg-indigo-500'
          }`} />
          {status?.mode}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Instant Controls */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-lg font-medium text-[var(--text)] mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--muted)]" />
            Instant Overrides
          </h3>
          
          <div className="space-y-4">
            <button 
              onClick={() => handleOverride('LIVE')}
              disabled={status?.mode === 'LIVE'}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-[var(--text)] font-medium">Reactivate Website</span>
              </div>
            </button>

            <button 
              onClick={() => handleOverride('COMING_SOON')}
              disabled={status?.mode === 'COMING_SOON'}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span className="text-[var(--text)] font-medium">Coming Soon Mode</span>
              </div>
            </button>

            <button 
              onClick={() => handleOverride('EMERGENCY')}
              disabled={status?.mode === 'EMERGENCY'}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="text-[var(--text)] font-medium">Emergency Shutdown</span>
              </div>
            </button>
          </div>
        </div>

        {/* Scheduler */}
        <div className="md:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-medium text-[var(--text)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--muted)]" />
              Maintenance Scheduler
            </h3>
            {status?.scheduledStart && (
              <button onClick={cancelSchedule} className="text-sm text-red-400 hover:text-red-300">
                Cancel Schedule
              </button>
            )}
          </div>

          {status?.scheduledStart ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <div className="flex gap-4">
                <Info className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-amber-400 font-medium mb-1">Scheduled Maintenance Active</h4>
                  <p className="text-sm text-amber-500/80 mb-2">The system will automatically transition states.</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-[var(--sub)] mt-4">
                    <div>
                      <span className="block text-[var(--muted)] text-xs uppercase mb-1">Start</span>
                      {new Date(status.scheduledStart).toLocaleString()}
                    </div>
                    <div>
                      <span className="block text-[var(--muted)] text-xs uppercase mb-1">End</span>
                      {new Date(status.scheduledEnd).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Start Time</label>
                  <input 
                    type="datetime-local" 
                    value={schedule.start}
                    onChange={(e) => setSchedule({...schedule, start: e.target.value})}
                    className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">End Time</label>
                  <input 
                    type="datetime-local" 
                    value={schedule.end}
                    onChange={(e) => setSchedule({...schedule, end: e.target.value})}
                    className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">Public Message</label>
                <input 
                  type="text" 
                  value={schedule.message}
                  onChange={(e) => setSchedule({...schedule, message: e.target.value})}
                  placeholder="Devid Aura will be unavailable from 11 PM to 6 AM."
                  className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>
              <button 
                type="submit"
                disabled={updateStatus.isPending}
                className="bg-[var(--brand)] text-[var(--bg)] font-medium px-6 py-2.5 rounded-xl hover:bg-[var(--brand-hover)] transition-colors disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Scheduling...' : 'Schedule Maintenance'}
              </button>
            </form>
          )}
        </div>

        {/* Global Announcements */}
        <div className="md:col-span-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mt-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-medium text-[var(--text)] flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[var(--muted)]" />
              Global Announcements
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">Title</label>
                <input 
                  type="text" 
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                  placeholder="e.g. Scheduled Maintenance"
                  required
                  className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">Message</label>
                <input 
                  type="text" 
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                  placeholder="e.g. Devid Aura will be unavailable from 11 PM to 6 AM."
                  required
                  className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Type</label>
                  <select 
                    value={announcement.type}
                    onChange={(e) => setAnnouncement({...announcement, type: e.target.value})}
                    className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-zinc-600 appearance-none"
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
                  <label className="block text-sm text-[var(--muted)] mb-2">Severity</label>
                  <select 
                    value={announcement.severity}
                    onChange={(e) => setAnnouncement({...announcement, severity: e.target.value})}
                    className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-zinc-600 appearance-none"
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
                className="bg-[var(--brand)] text-[var(--bg)] font-medium px-6 py-2.5 rounded-xl hover:bg-[var(--brand-hover)] transition-colors disabled:opacity-50 mt-4"
              >
                {createAnnouncement.isPending ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </form>

            <div>
              <h4 className="text-sm font-medium text-[var(--muted)] mb-4">Active Announcements</h4>
              {announcementsLoading ? (
                <div className="text-[var(--muted)] text-sm">Loading...</div>
              ) : activeAnnouncements?.length === 0 ? (
                <div className="text-[var(--muted)] text-sm italic">No active announcements.</div>
              ) : (
                <div className="space-y-3">
                  {activeAnnouncements?.map((a) => (
                    <div key={a.id} className="p-4 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold px-2 py-1 bg-[var(--surface-muted)] rounded text-[var(--sub)]">{a.type}</span>
                        <span className="text-xs text-[var(--muted)]">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h5 className="text-[var(--text)] font-medium mb-1">{a.title}</h5>
                      <p className="text-sm text-[var(--muted)]">{a.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Launch Waitlist Management ──────────────────────────────────── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[color-mix(in_srgb,var(--brand)_15%,transparent)] text-[var(--brand)] rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-[var(--text)]">Launch Waitlist</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white">
                    {waitlistData?.total ? waitlistData.total.toLocaleString() : 0} Subscribers
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">Subscribers collected during the Coming Soon period</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={waitlistSearch}
                  onChange={(e) => {
                    setWaitlistSearch(e.target.value);
                    setWaitlistPage(1);
                  }}
                  placeholder="Search email..."
                  className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] w-48 sm:w-64"
                />
              </div>

              {/* Sort Selector */}
              <select
                value={waitlistSort}
                onChange={(e) => setWaitlistSort(e.target.value)}
                className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none"
              >
                <option value="desc">Newest ▾</option>
                <option value="asc">Oldest ▾</option>
              </select>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportWaitlist}
                disabled={isExporting || !waitlistData?.total}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-muted)] text-[var(--muted)] border-b border-[var(--border)] font-medium">
                <tr>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Subscribed Date</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {waitlistLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[var(--muted)]">Loading subscribers...</td>
                  </tr>
                ) : waitlistData?.subscribers?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[var(--muted)] italic">
                      {waitlistSearch ? 'No subscribers match your search.' : 'No waitlist subscribers yet.'}
                    </td>
                  </tr>
                ) : (
                  waitlistData?.subscribers?.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[var(--text)]">
                        {sub.email}
                      </td>
                      <td className="py-3 px-4 text-[var(--muted)]">
                        {new Date(sub.subscribedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {sub.isRegisteredUser ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <UserCheck className="w-3 h-3" />
                            Registered User {sub.userName ? `(${sub.userName})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                            <UserX className="w-3 h-3" />
                            Guest Visitor
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {sub.status === 'notified' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <CheckCircle className="w-3 h-3" />
                            Notified {sub.notifiedAt ? `(${new Date(sub.notifiedAt).toLocaleDateString()})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Subscribed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {waitlistData?.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-xs text-[var(--muted)]">
              <div>
                Page {waitlistData.page} of {waitlistData.totalPages} ({waitlistData.total} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWaitlistPage((p) => Math.max(1, p - 1))}
                  disabled={waitlistPage <= 1}
                  className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)] disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setWaitlistPage((p) => Math.min(waitlistData.totalPages, p + 1))}
                  disabled={waitlistPage >= waitlistData.totalPages}
                  className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)] disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${modalConfig.type === 'EMERGENCY' ? 'bg-[color-mix(in_srgb,var(--error)_12%,transparent)] text-[var(--error)]' : 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]'}`}>
                  {modalConfig.type === 'EMERGENCY' ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-medium text-[var(--text)]">
                  {modalConfig.type === 'EMERGENCY' ? 'Emergency Shutdown' : 
                   modalConfig.type === 'CANCEL_SCHEDULE' ? 'Cancel Schedule' : 
                   `Transition to ${modalConfig.payload}`}
                </h3>
              </div>

              <div className="mb-6 space-y-4">
                <p className="text-[var(--muted)]">
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
                    className="w-full bg-[var(--surface-muted)] border border-red-500/50 rounded-xl px-4 py-2.5 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-red-500 font-mono uppercase"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-5 py-2 rounded-xl font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={confirmAction}
                  disabled={updateStatus.isPending || (modalConfig.type === 'EMERGENCY' && promptInput !== 'SHUTDOWN')}
                  className={`px-5 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                    modalConfig.type === 'EMERGENCY' ? 'bg-red-500 text-[var(--text)] hover:bg-red-600' : 'bg-[var(--brand)] text-[var(--bg)] hover:bg-[var(--brand-hover)]'
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
