import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, Inbox, CheckCircle, Send, X, ChevronLeft, Lock, MessageSquare,
  Clock, AlertTriangle, User as UserIcon, Mail, Phone, Tag, Filter,
  ArrowUpCircle, ArrowDownCircle, Circle, Paperclip, StickyNote,
  Shield, RefreshCw, MoreVertical, ChevronDown, Folder, Users, Hash,
  FileText, Image, Download, Eye, Archive, Loader2, Plus, Zap, Trash2
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAdminTickets, useAdminTicketById, useAdminTicketMessages, useTicketEvents,
  useTicketCounts, useAdminReply, useAddInternalNote, useUpdateTicketStatus,
  useUpdateTicketPriority, useAssignTicket, useUpdateTicketTags, useArchiveTicket,
  useAdminAttachment, useTeams, useTags, useAdminAgents, useUpdateTicketCategory,
  useCsatAnalytics, useSupportRealtime, useCannedResponses,
  useAgentPresence, usePerformanceAnalytics, useSendTypingStatus, useCreateCannedResponse,
  useTicketCollision, useCreateTeam, useCreateTag, useDeleteTag,
  useAiSummarizeTicket, useAiGenerateDraft
} from '../../features/support/hooks/useSupport';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new: { label: 'New', color: '#6366F1', bg: '#EEF2FF' },
  open: { label: 'Open', color: '#2563EB', bg: '#DBEAFE' },
  in_progress: { label: 'In Progress', color: '#D97706', bg: '#FEF3C7' },
  waiting_for_customer: { label: 'Waiting', color: '#9333EA', bg: '#F3E8FF' },
  pending: { label: 'Pending', color: '#6B7280', bg: '#F3F4F6' },
  resolved: { label: 'Resolved', color: '#059669', bg: '#D1FAE5' },
  closed: { label: 'Closed', color: '#374151', bg: '#E5E7EB' },
  reopened: { label: 'Reopened', color: '#DC2626', bg: '#FEE2E2' },
  spam: { label: 'Spam', color: '#991B1B', bg: '#FEE2E2' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#6B7280', icon: ArrowDownCircle },
  normal: { label: 'Normal', color: '#2563EB', icon: Circle },
  high: { label: 'High', color: '#D97706', icon: ArrowUpCircle },
  urgent: { label: 'Urgent', color: '#DC2626', icon: AlertTriangle },
  critical: { label: 'Critical', color: '#991B1B', icon: AlertTriangle },
};

const CATEGORIES = [
  { value: 'orders', label: 'Orders' },
  { value: 'payments', label: 'Payments' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'products', label: 'Products' },
  { value: 'account', label: 'Account' },
  { value: 'offers', label: 'Offers' },
  { value: 'other', label: 'Other' },
];

const SUBCATEGORIES = {
  orders: ['Order Status', 'Cancellation', 'Return', 'Refund'],
  payments: ['Payment Failed', 'Double Payment', 'Refund Pending'],
  shipping: ['Delivery Delayed', 'Address Issue', 'Tracking'],
  products: ['Product Question', 'Damaged Product', 'Missing Item'],
  account: ['Login', 'Profile', 'Phone Verification'],
  offers: ['Coupon', 'Rewards', 'Referral'],
};

const renderMessageAttachments = (attachments) => {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5 shrink-0 w-full max-w-[240px]">
      {attachments.map((att) => {
        const isImage = att.mimeType?.startsWith('image/');
        const formattedSize = att.size > 1024 * 1024 
          ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(att.size / 1024)} KB`;

        return (
          <div key={att.id} className="rounded-xl overflow-hidden border border-[var(--border)] shadow-sm bg-[var(--surface)] hover:border-[var(--brand-soft)] transition-all">
            {isImage ? (
              <a href={att.url} target="_blank" rel="noopener noreferrer" className="block group relative">
                <img 
                  src={att.url} 
                  alt={att.originalName} 
                  className="max-h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="p-2 flex items-center justify-between bg-[var(--surface)] border-t border-[var(--border)]">
                  <span className="text-[9px] font-bold text-[var(--text)] truncate max-w-[130px]">{att.originalName}</span>
                  <span className="text-[8px] font-mono text-[var(--muted)]">{formattedSize}</span>
                </div>
              </a>
            ) : (
              <a 
                href={att.url} 
                download={att.originalName} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2.5 flex items-center justify-between gap-2 text-[var(--text)] hover:text-[var(--brand)] transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText size={14} className="text-[var(--muted)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold truncate max-w-[140px]">{att.originalName}</p>
                    <p className="text-[8px] text-[var(--muted)] font-mono">{formattedSize}</p>
                  </div>
                </div>
                <Download size={12} className="text-[var(--muted)] hover:text-[var(--brand)] shrink-0 transition-colors" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const SupportInbox = () => {
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 30 });
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [view, setView] = useState('all_open'); // my_tickets | unassigned | all_open | resolved | closed
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const messagesEndRef = useRef(null);

  const { user: clerkUser } = useUser();

  // Enable Real-time event notifications via SSE
  useSupportRealtime();

  const [activePanel, setActivePanel] = useState('tickets'); // tickets | analytics | settings
  const { data: csatStats } = useCsatAnalytics();
  const { data: cannedResponses = [] } = useCannedResponses();
  const { data: agentPresence = [] } = useAgentPresence();
  const { data: performanceMetrics, refetch: refetchPerformance } = usePerformanceAnalytics();

  const { mutateAsync: createTeam } = useCreateTeam();
  const { mutateAsync: createTag } = useCreateTag();
  const { mutateAsync: deleteTag } = useDeleteTag();

  const [newTeamName, setNewTeamName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const { mutateAsync: sendTyping } = useSendTypingStatus();
  const { mutateAsync: saveCannedTemplate } = useCreateCannedResponse();
  const [customerIsTyping, setCustomerIsTyping] = useState(false);
  const [typingTimeoutRef, setTypingTimeoutRef] = useState(null);

  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateShortcut, setNewTemplateShortcut] = useState('');
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  const activeViewers = useTicketCollision(selectedTicketId);
  const otherViewers = activeViewers.filter(v => v.clerkId !== clerkUser?.id);

  // Clear typing timeout when selected ticket changes
  useEffect(() => {
    setCustomerIsTyping(false);
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
      setTypingTimeoutRef(null);
    }
  }, [selectedTicketId]);

  // Listen to SSE typing indicators
  useEffect(() => {
    const handleTypingEvent = (e) => {
      const { ticketId, isTyping } = e.detail;
      if (ticketId === selectedTicketId) {
        setCustomerIsTyping(isTyping);
      }
    };

    window.addEventListener('support_typing', handleTypingEvent);
    return () => window.removeEventListener('support_typing', handleTypingEvent);
  }, [selectedTicketId]);

  const handleInputChange = (e) => {
    setReplyText(e.target.value);
    
    if (!selectedTicketId) return;

    if (!typingTimeoutRef) {
      sendTyping({ ticketId: selectedTicketId, isTyping: true }).catch(() => {});
    } else {
      clearTimeout(typingTimeoutRef);
    }

    const timeout = setTimeout(() => {
      sendTyping({ ticketId: selectedTicketId, isTyping: false }).catch(() => {});
      setTypingTimeoutRef(null);
    }, 2500);

    setTypingTimeoutRef(timeout);
  };

  const insertTemplate = (content) => {
    const agentName = clerkUser?.fullName || clerkUser?.firstName || 'Agent';
    const parsed = content.replace(/\{\{agentName\}\}/g, agentName);
    setReplyText(parsed);
    setShowTemplates(false);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Compute filters based on view
  const computedFilters = useMemo(() => {
    const f = { ...filters, search: searchDebounced || undefined };
    switch (view) {
      case 'my_tickets': f.assignedAgentId = 'me'; break;
      case 'unassigned': f.assignedAgentId = 'unassigned'; break;
      case 'all_open': f.status = undefined; break;
      case 'waiting': f.status = 'waiting_for_customer'; break;
      case 'resolved': f.status = 'resolved'; break;
      case 'closed': f.status = 'closed'; break;
    }
    return f;
  }, [filters, view, searchDebounced]);

  // Queries
  const { data: ticketsData, isLoading: loadingTickets, refetch: refetchTickets } = useAdminTickets(computedFilters);
  const { data: ticketDetail } = useAdminTicketById(selectedTicketId);
  const { data: messagesData, refetch: refetchMessages } = useAdminTicketMessages(selectedTicketId);
  const { data: events } = useTicketEvents(selectedTicketId);
  const { data: counts } = useTicketCounts();
  const { data: teams = [] } = useTeams();
  const { data: tags = [] } = useTags();
  const { data: agents = [] } = useAdminAgents();
  const { data: aiDraftRes, refetch: generateDraft, isFetching: generatingDraft } = useAiGenerateDraft(selectedTicketId);
  const { data: aiSummaryRes, refetch: generateSummary, isFetching: generatingSummary } = useAiSummarizeTicket(selectedTicketId);

  // Mutations
  const { mutateAsync: sendReply, isPending: sendingReply } = useAdminReply();
  const { mutateAsync: addNote, isPending: sendingNote } = useAddInternalNote();
  const { mutateAsync: updateStatus } = useUpdateTicketStatus();
  const { mutateAsync: updatePriority } = useUpdateTicketPriority();
  const { mutateAsync: assignTicket } = useAssignTicket();
  const { mutateAsync: updateTags } = useUpdateTicketTags();
  const { mutateAsync: archiveTicketMut } = useArchiveTicket();
  const { mutateAsync: updateCategory } = useUpdateTicketCategory();
  const { mutateAsync: uploadAttachment } = useAdminAttachment();

  const tickets = ticketsData?.data || [];
  const messages = messagesData?.messages || [];
  const totalPages = ticketsData?.totalPages || 1;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
      setTypingTimeoutRef(null);
      sendTyping({ ticketId: selectedTicketId, isTyping: false }).catch(() => {});
    }
    await sendReply({ ticketId: selectedTicketId, message: replyText });
    setReplyText('');
  };

  const handleAddNote = async (e) => {
    e?.preventDefault();
    if (!noteText.trim() || !selectedTicketId) return;
    await addNote({ ticketId: selectedTicketId, note: noteText });
    setNoteText('');
    setShowNoteBox(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicketId) return;
    await uploadAttachment({ ticketId: selectedTicketId, file });
    e.target.value = '';
  };

  // ── Sidebar Buckets ─────────────────────────────────────────────────────────
  const viewBuckets = [
    { key: 'all_open', label: 'All Open', count: counts?.allOpen, icon: Inbox },
    { key: 'my_tickets', label: 'My Tickets', count: counts?.myTickets, icon: UserIcon },
    { key: 'unassigned', label: 'Unassigned', count: counts?.unassigned, icon: Users },
    { key: 'waiting', label: 'Waiting for Customer', count: counts?.waitingForCustomer, icon: Clock },
    { key: 'resolved', label: 'Resolved', count: counts?.resolved, icon: CheckCircle },
    { key: 'closed', label: 'Closed', count: null, icon: Archive },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn pb-20">
      <div className="flex h-[calc(100vh-180px)] bg-[var(--surface)] rounded-2xl overflow-hidden shadow-[var(--shadow)] border border-[var(--border)]">

        {/* ── Left Panel: Filter Sidebar + Ticket List ── */}
        <div className={`${selectedTicketId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[420px] border-r border-[var(--border)] bg-[var(--surface)]`}>
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Support</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActivePanel('tickets')}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    activePanel === 'tickets'
                      ? 'bg-[var(--brand)] text-[var(--bg)] shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand)]'
                  }`}
                >
                  Inbox
                </button>
                <button
                  onClick={() => {
                    setActivePanel('analytics');
                    refetchPerformance();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    activePanel === 'analytics'
                      ? 'bg-blue-600 text-[var(--bg)] shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-blue-600'
                  }`}
                >
                  Metrics
                </button>
                <button
                  onClick={() => setActivePanel('settings')}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    activePanel === 'settings'
                      ? 'bg-purple-600 text-[var(--bg)] shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-purple-600'
                  }`}
                >
                  Config
                </button>
                <button onClick={() => refetchTickets()} className="p-1.5 hover:bg-[var(--surface-muted)] rounded-xl text-[var(--muted)] transition-colors shrink-0">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* View Buckets */}
            <div className="flex flex-wrap gap-1.5">
              {viewBuckets.map(b => (
                <button
                  key={b.key}
                  onClick={() => { setView(b.key); setSelectedTicketId(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    view === b.key
                      ? 'bg-[var(--brand)] text-[var(--bg)] shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand)]'
                  }`}
                >
                  <b.icon size={12} />
                  {b.label}
                  {b.count != null && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-black/10 text-[9px]">{b.count}</span>}
                </button>
              ))}
            </div>

            {/* CSAT summary card */}
            {csatStats && csatStats.count > 0 && (
              <div className="flex items-center justify-between py-2 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs">
                <span className="font-bold text-[var(--text)]">CSAT Score:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-medium text-amber-500">{csatStats.average} ★</span>
                  <span className="text-[10px] text-[var(--muted)] font-body font-bold">({csatStats.count} ratings)</span>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tickets, emails, order IDs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] rounded-xl text-sm text-[var(--text)] outline-none transition-all placeholder-[var(--muted)] font-body font-bold"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loadingTickets ? (
              <div className="flex items-center justify-center h-40 text-[var(--muted)]">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-[var(--muted)]">
                <Inbox size={32} strokeWidth={1} className="mb-2 opacity-40" />
                <p className="font-display italic text-sm">No tickets found</p>
              </div>
            ) : (
              tickets.map(ticket => {
                const isSelected = selectedTicketId === ticket.id;
                const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.normal;
                const PriorityIcon = priorityConf.icon;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border group ${
                      isSelected
                        ? 'bg-[var(--accent-soft)] border-[var(--brand)] shadow-sm'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <PriorityIcon size={12} style={{ color: priorityConf.color }} className="shrink-0" />
                        <h4 className={`font-body font-bold text-sm truncate ${isSelected ? 'text-[var(--brand)]' : 'text-[var(--text)]'}`}>
                          {ticket.subject}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                          style={{ color: statusConf.color, backgroundColor: statusConf.bg }}
                        >
                          {statusConf.label}
                        </span>
                        {(ticket.isFirstResponseBreached || ticket.isResolutionBreached) && (
                          <span className="text-[8px] font-bold bg-red-50 text-red-500 border border-red-200 px-1 py-0.5 rounded uppercase tracking-widest flex items-center gap-0.5 animate-pulse">
                            ⚠️ SLA Breached
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="font-body text-xs text-[var(--sub)] truncate mb-2">
                      {ticket.messages?.[0]?.message || 'No messages'}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-body text-[10px] font-bold text-[var(--muted)] truncate max-w-[120px]">
                          {ticket.guestEmail || ticket.user?.email || 'Unknown'}
                        </span>
                        {ticket.assignedAgent && (
                          <span className="font-body text-[9px] font-bold text-[var(--brand)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                            → {ticket.assignedAgent.name?.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <span className="font-body text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest shrink-0">
                        {ticket.ticketNumber?.slice(-8)}
                      </span>
                    </div>

                    {ticket.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ticket.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--muted)]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-3">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                    className={`w-8 h-8 rounded-lg text-xs font-bold ${
                      filters.page === i + 1
                        ? 'bg-[var(--brand)] text-[var(--bg)]'
                        : 'bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Ticket Detail / Analytics Dashboard / Settings Panel ── */}
        <div className={`${!selectedTicketId && activePanel === 'tickets' ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-[var(--bg)]`}>
          {activePanel === 'analytics' ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Performance Analytics</h3>
                  <p className="text-xs text-[var(--muted)] font-body font-bold mt-1">Real-time support operations & SLA metrics</p>
                </div>
                <button
                  onClick={() => refetchPerformance()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-muted)] rounded-xl text-xs font-bold text-[var(--text)] transition-colors shadow-sm"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>

              {!performanceMetrics ? (
                <div className="flex items-center justify-center h-64 text-[var(--muted)]">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Avg First Response */}
                    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-[var(--muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Avg Response Time</span>
                        <Clock size={16} className="text-blue-500" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-display font-medium text-[var(--text)]">
                          {performanceMetrics.avgFirstResponseMin || 0}
                        </span>
                        <span className="text-xs font-bold text-[var(--muted)]">mins</span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] font-body">From ticket creation to first agent response.</p>
                    </div>

                    {/* Card 2: Avg Resolution Time */}
                    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-[var(--muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Avg Resolution Time</span>
                        <CheckCircle size={16} className="text-emerald-500" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-display font-medium text-[var(--text)]">
                          {performanceMetrics.avgResolutionHour || 0}
                        </span>
                        <span className="text-xs font-bold text-[var(--muted)]">hours</span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] font-body">Average time taken to resolve support tickets.</p>
                    </div>

                    {/* Card 3: Total SLA Breached */}
                    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-[var(--muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-widest">SLA Violations</span>
                        <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-display font-medium text-red-600">
                          {performanceMetrics.responseBreached + performanceMetrics.resolutionBreached}
                        </span>
                        <span className="text-xs font-body font-bold text-[var(--muted)]">
                          ({performanceMetrics.totalTickets || 0} total)
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] font-body">
                        {performanceMetrics.responseBreached} response breaches, {performanceMetrics.resolutionBreached} resolution breaches.
                      </p>
                    </div>
                  </div>

                  {/* Compliance Progress Bars */}
                  <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)]">SLA Compliance Tracking</h4>
                    
                    {/* Response Compliance */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[var(--text)]">First Response Compliance</span>
                        <span className="text-blue-600">
                          {performanceMetrics.totalResponded > 0
                            ? Math.round(((performanceMetrics.totalResponded - performanceMetrics.responseBreached) / performanceMetrics.totalResponded) * 100)
                            : 100}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${performanceMetrics.totalResponded > 0
                              ? Math.round(((performanceMetrics.totalResponded - performanceMetrics.responseBreached) / performanceMetrics.totalResponded) * 100)
                              : 100}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-[var(--muted)] uppercase font-bold">
                        <span>{performanceMetrics.totalResponded - performanceMetrics.responseBreached} met</span>
                        <span>{performanceMetrics.responseBreached} breached</span>
                      </div>
                    </div>

                    {/* Resolution Compliance */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[var(--text)]">Ticket Resolution Compliance</span>
                        <span className="text-emerald-600">
                          {performanceMetrics.totalResolved > 0
                            ? Math.round(((performanceMetrics.totalResolved - performanceMetrics.resolutionBreached) / performanceMetrics.totalResolved) * 100)
                            : 100}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${performanceMetrics.totalResolved > 0
                              ? Math.round(((performanceMetrics.totalResolved - performanceMetrics.resolutionBreached) / performanceMetrics.totalResolved) * 100)
                              : 100}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-[var(--muted)] uppercase font-bold">
                        <span>{performanceMetrics.totalResolved - performanceMetrics.resolutionBreached} met</span>
                        <span>{performanceMetrics.resolutionBreached} breached</span>
                      </div>
                    </div>
                  </div>

                  {/* CSAT Details Dashboard */}
                  {csatStats && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Rating Distributions */}
                      <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)]">CSAT Score Distribution</h4>
                        <div className="flex items-center gap-6">
                          <div className="text-center space-y-1">
                            <span className="text-4xl font-display font-medium text-amber-500">{csatStats.average}</span>
                            <div className="text-lg text-amber-400">★★★★★</div>
                            <p className="text-[10px] uppercase font-bold text-[var(--muted)]">Average Rating</p>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const star = 5 - idx;
                              const match = csatStats.distribution?.find(d => d.rating === star);
                              const count = match ? match.count : 0;
                              const pct = csatStats.count > 0 ? Math.round((count / csatStats.count) * 100) : 0;
                              return (
                                <div key={star} className="flex items-center gap-2 text-xs">
                                  <span className="w-3 font-bold">{star}</span>
                                  <span className="text-amber-400 text-xs">★</span>
                                  <div className="flex-1 h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="w-8 text-right font-body text-[10px] font-bold text-[var(--muted)]">{count} ({pct}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Recent Comments */}
                      <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col h-64">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)] mb-3 shrink-0">Recent Feedback Comments</h4>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                          {csatStats.recentComments?.length === 0 ? (
                            <p className="text-xs italic text-[var(--muted)]">No comment reviews submitted yet</p>
                          ) : (
                            csatStats.recentComments?.map((c, i) => (
                              <div key={i} className="p-3 bg-[var(--bg)] rounded-xl border border-[var(--border)] space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-amber-500 text-xs">{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</span>
                                  <span className="text-[8px] text-[var(--muted)] uppercase font-bold">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs italic font-body text-[var(--text)]">"{c.comment}"</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Volume By Category */}
                  <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)]">Category Ticket Volume</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {performanceMetrics.categoryBreakdown?.map(cat => (
                        <div key={cat.category} className="p-3 bg-[var(--bg)] rounded-xl border border-[var(--border)] flex flex-col justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] truncate">
                            {cat.category}
                          </span>
                          <span className="text-xl font-display font-medium text-[var(--text)] mt-1">
                            {cat.count} <span className="text-[10px] font-body text-[var(--muted)]">tickets</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activePanel === 'settings' ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Configuration Settings</h3>
                  <p className="text-xs text-[var(--muted)] font-body font-bold mt-1">Manage routing teams and ticket classification tags</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 👥 Support Teams Column */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)]">Support Teams</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {teams.map(t => (
                      <div key={t.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-[var(--brand)] shrink-0" />
                          <span className="text-xs font-bold text-[var(--text)]">{t.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newTeamName.trim()) return;
                      await createTeam({ name: newTeamName.trim() });
                      setNewTeamName('');
                      refetchTickets();
                    }}
                    className="pt-4 border-t border-[var(--border)] flex gap-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder="New Team Name..."
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      className="flex-1 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl px-4 py-2 text-xs outline-none font-body font-bold text-[var(--text)]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--brand)] text-[var(--bg)] rounded-xl text-xs font-bold hover:brightness-110 shrink-0"
                    >
                      Add Team
                    </button>
                  </form>
                </div>

                {/* 🏷️ Ticket Tags Column */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)]">Classification Tags</h4>
                  <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar align-content-start">
                    {tags.length === 0 ? (
                      <span className="text-xs italic text-[var(--muted)]">No tags registered</span>
                    ) : (
                      tags.map(t => (
                        <div key={t.id} className="px-2.5 py-1.5 bg-[var(--surface-muted)] text-[var(--text)] text-[10px] font-bold rounded-lg border border-[var(--border)] flex items-center gap-1.5 hover:bg-[var(--border)] transition-colors">
                          <Tag size={10} className="text-[var(--sub)]" />
                          <span>{t.name}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Delete tag "${t.name}"?`)) {
                                await deleteTag(t.id);
                              }
                            }}
                            className="text-[var(--muted)] hover:text-red-500 transition-colors shrink-0 ml-0.5"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newTagName.trim()) return;
                      await createTag({ name: newTagName.trim().toLowerCase() });
                      setNewTagName('');
                    }}
                    className="pt-4 border-t border-[var(--border)] flex gap-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder="new-tag-name..."
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      className="flex-1 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl px-4 py-2 text-xs outline-none font-body font-bold text-[var(--text)]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--brand)] text-[var(--bg)] rounded-xl text-xs font-bold hover:brightness-110 shrink-0"
                    >
                      Add Tag
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : !selectedTicketId || !ticketDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)] p-8">
              <div className="w-20 h-20 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Inbox className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight mb-2">Select a ticket</h3>
              <p className="font-display italic text-[var(--sub)] tracking-wide">Choose a conversation from the list</p>
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              {/* Chat Column */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Ticket Header */}
                <div className="h-[72px] px-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)] shadow-sm shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => setSelectedTicketId(null)} className="lg:hidden p-2 -ml-2 text-[var(--muted)]">
                      <ChevronLeft size={20} />
                    </button>
                    <div className="min-w-0">
                      <h3 className="font-body font-bold text-[var(--text)] text-sm truncate">{ticketDetail.subject}</h3>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--sub)] mt-0.5">
                        <span className="flex items-center gap-1"><Mail size={10} /> {ticketDetail.guestEmail || ticketDetail.user?.email}</span>
                        <span className="font-mono text-[var(--muted)]">#{ticketDetail.ticketNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTimeline(!showTimeline)}
                      className={`p-2 rounded-lg transition-colors text-xs font-bold ${showTimeline ? 'bg-[var(--accent-soft)] text-[var(--brand)]' : 'text-[var(--muted)] hover:bg-[var(--surface)]'}`}
                      title="Toggle Timeline"
                    >
                      <Clock size={16} />
                    </button>
                    <button
                      onClick={() => setShowMetadata(!showMetadata)}
                      className={`hidden xl:block p-2 rounded-lg transition-colors ${showMetadata ? 'bg-[var(--accent-soft)] text-[var(--brand)]' : 'text-[var(--muted)] hover:bg-[var(--surface)]'}`}
                      title="Toggle Details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>

                {/* Agent Collision Warning Banner */}
                {otherViewers.length > 0 && (
                  <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between gap-3 text-amber-800 text-xs shrink-0 font-body font-bold animate-pulse shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span>
                        Collision Warning: {otherViewers.map(v => v.name).join(', ')} is also viewing this ticket.
                      </span>
                    </div>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {otherViewers.map(v => (
                        <img 
                          key={v.clerkId}
                          src={v.profileImage} 
                          alt={v.name} 
                          title={v.name}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-amber-50 object-cover" 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {showTimeline && events?.length > 0 && (
                    <div className="mb-6 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                      <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">Timeline</h4>
                      <div className="space-y-2">
                        {events.map((evt, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px]">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              evt.eventType === 'SLA_BREACHED' ? 'bg-red-500 animate-ping' : 'bg-[var(--brand)]'
                            }`} />
                            <div>
                              <span className={`font-bold ${evt.eventType === 'SLA_BREACHED' ? 'text-red-500' : 'text-[var(--text)]'}`}>
                                {formatEventType(evt.eventType)}
                              </span>
                              {evt.fromValue && evt.toValue && (
                                <span className="text-[var(--muted)]"> {evt.fromValue} → {evt.toValue}</span>
                              )}
                              <span className="text-[var(--muted)] ml-2">
                                {evt.actor?.name || 'System'} · {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date separator */}
                  <div className="flex justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] bg-[var(--surface)] px-3 py-1 rounded-md border border-[var(--border)]">
                      {new Date(ticketDetail.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Message Bubbles */}
                  {messages.map((msg, idx) => {
                    if (msg.messageType === 'system_event') {
                      return (
                        <div key={idx} className="flex justify-center">
                          <span className="text-[10px] font-bold text-[var(--muted)] bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] italic">
                            {msg.message}
                          </span>
                        </div>
                      );
                    }

                    if (msg.messageType === 'internal_note') {
                      return (
                        <div key={idx} className="flex justify-end">
                          <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-sm bg-amber-50 border-2 border-dashed border-amber-200 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Lock size={10} className="text-amber-600" />
                              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Internal Note</span>
                            </div>
                            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            {renderMessageAttachments(msg.attachments)}
                            <span className="text-[9px] text-amber-500 mt-1 block">
                              {msg.sender?.name || 'Agent'} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const isAgent = msg.senderRole === 'admin';
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex max-w-[80%] ${isAgent ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                          <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold border shadow-sm ${
                            isAgent
                              ? 'bg-[var(--brand)] text-[var(--bg)] border-[var(--brand)]'
                              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
                          }`}>
                            {isAgent ? 'A' : (ticketDetail.guestEmail?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm border ${
                              isAgent
                                ? 'bg-[var(--brand)] text-[var(--bg)] rounded-2xl rounded-br-sm border-[var(--brand)]'
                                : 'bg-[var(--surface)] text-[var(--text)] rounded-2xl rounded-bl-sm border-[var(--border)]'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                            {renderMessageAttachments(msg.attachments)}
                            <span className="text-[9px] font-bold text-[var(--muted)] mt-1 px-1 tracking-widest uppercase">
                              {msg.sender?.name || (isAgent ? 'Agent' : 'Customer')} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Area */}
                <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] space-y-3">
                  {customerIsTyping && (
                    <div className="px-1 py-1 text-xs text-[var(--muted)] flex items-center gap-1.5 font-body font-bold">
                      <span className="flex gap-0.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      Customer is typing...
                    </div>
                  )}
                  {/* Internal Note Box */}
                  <AnimatePresence>
                    {showNoteBox && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleAddNote}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2 p-2 bg-amber-50 border-2 border-dashed border-amber-200 rounded-xl">
                          <div className="flex items-center gap-1.5 px-2 shrink-0">
                            <Lock size={12} className="text-amber-600" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Note</span>
                          </div>
                          <input
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Type an internal note (only visible to agents)..."
                            className="flex-1 bg-transparent border-none text-sm text-amber-900 outline-none placeholder-amber-400 font-body font-bold"
                          />
                          <button
                            type="submit"
                            disabled={sendingNote || !noteText.trim()}
                            className="p-2 bg-amber-500 text-[var(--bg)] rounded-lg disabled:opacity-40 shrink-0"
                          >
                            {sendingNote ? <Loader2 size={14} className="animate-spin" /> : <StickyNote size={14} />}
                          </button>
                          <button type="button" onClick={() => setShowNoteBox(false)} className="p-2 text-amber-500 hover:text-amber-700">
                            <X size={14} />
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Reply form or Closed state */}
                  {ticketDetail.status !== 'closed' && ticketDetail.status !== 'spam' ? (
                    <form onSubmit={handleSendReply} className="flex items-end gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowNoteBox(!showNoteBox)}
                          className="p-2.5 text-[var(--muted)] hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                          title="Internal Note"
                        >
                          <StickyNote size={16} />
                        </button>
                        
                        {/* Canned Responses Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="p-2.5 text-[var(--muted)] hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Canned Response Templates"
                          >
                            <Zap size={16} />
                          </button>
                          {showTemplates && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg p-2 z-50 max-h-48 overflow-y-auto space-y-1">
                              <div className="flex justify-between items-center px-2 py-1 shrink-0">
                                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Templates</span>
                                <button
                                  type="button"
                                  onClick={() => setShowCreateTemplateModal(true)}
                                  className="text-[9px] font-bold text-[var(--brand)] hover:underline uppercase"
                                >
                                  + Create
                                </button>
                              </div>
                              {cannedResponses.length === 0 ? (
                                <div className="px-3 py-2 text-[10px] italic text-[var(--muted)]">No templates seeded</div>
                              ) : (
                                cannedResponses.map(cr => (
                                  <button
                                    key={cr.id}
                                    type="button"
                                    onClick={() => insertTemplate(cr.content)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--surface)] rounded-lg text-xs font-bold text-[var(--text)] transition-colors truncate"
                                    title={cr.content}
                                  >
                                    <span className="text-[var(--brand)] mr-1.5 font-mono">{cr.shortcut}</span>
                                    {cr.title}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const res = await generateDraft();
                            if (res.data?.draft) setReplyText(res.data.draft);
                          }}
                          disabled={generatingDraft}
                          className="p-2.5 text-[var(--brand)] hover:bg-[var(--surface)] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Generate AI Draft"
                        >
                          {generatingDraft ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        </button>

                        <label className="p-2.5 text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface)] rounded-xl transition-colors cursor-pointer" title="Attach File">
                          <Paperclip size={16} />
                          <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                        </label>
                      </div>
                      <div className="flex-1 flex items-center bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--brand)] rounded-xl transition-all">
                        <input
                          type="text"
                          value={replyText}
                          onChange={handleInputChange}
                          placeholder="Type a reply..."
                          className="flex-1 bg-transparent px-4 py-3 text-sm text-[var(--text)] outline-none font-body font-bold placeholder-[var(--muted)]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="p-3 bg-[var(--brand)] text-[var(--bg)] rounded-xl disabled:opacity-40 shadow-sm transition-all hover:brightness-110 shrink-0"
                      >
                        {sendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </form>
                  ) : (
                    <div className="py-3 px-4 flex items-center justify-center gap-2 text-[var(--sub)] bg-[var(--surface)] rounded-xl border border-dashed border-[var(--border)]">
                      <Shield size={14} className="text-[var(--accent)]" />
                      <span className="text-xs font-bold uppercase tracking-widest">This ticket is {ticketDetail.status}. Change status to reply.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Metadata Panel ── */}
              {showMetadata && (
                <div className="hidden xl:flex w-[300px] flex-col border-l border-[var(--border)] bg-[var(--surface)] overflow-y-auto custom-scrollbar">
                  <div className="p-5 space-y-5">
                    {/* Customer Info */}
                    <MetadataSection title="Customer">
                      <div className="space-y-2">
                        <InfoRow icon={UserIcon} label="Name" value={ticketDetail.guestName || ticketDetail.user?.name || 'Guest'} />
                        <InfoRow icon={Mail} label="Email" value={ticketDetail.guestEmail || ticketDetail.user?.email} />
                        {(ticketDetail.guestPhone || ticketDetail.user?.phone) && (
                          <InfoRow icon={Phone} label="Phone" value={ticketDetail.guestPhone || ticketDetail.user?.phone} />
                        )}
                      </div>
                    </MetadataSection>

                    {/* AI Copilot Panel */}
                    <MetadataSection title="AI Copilot">
                      <div className="space-y-3">
                        <button 
                          onClick={() => generateSummary()} 
                          disabled={generatingSummary}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[var(--brand-soft)] text-[var(--brand)] font-bold text-xs rounded-lg hover:brightness-95 transition-all"
                        >
                          {generatingSummary ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                          {generatingSummary ? 'Analyzing...' : 'Generate Summary'}
                        </button>
                        
                        {aiSummaryRes?.summary && (
                          <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                            {aiSummaryRes.summary}
                          </div>
                        )}
                      </div>
                    </MetadataSection>

                    {/* Status */}
                    <MetadataSection title="Status">
                      <select
                        value={ticketDetail.status}
                        onChange={e => updateStatus({ ticketId: selectedTicketId, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text)] outline-none"
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </MetadataSection>

                    {/* Priority */}
                    <MetadataSection title="Priority">
                      <select
                        value={ticketDetail.priority}
                        onChange={e => updatePriority({ ticketId: selectedTicketId, priority: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text)] outline-none"
                      >
                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </MetadataSection>

                    {/* Assignment */}
                    <MetadataSection title="Assignment">
                      <div className="space-y-2">
                        {ticketDetail.assignedAgent && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] rounded-lg text-xs font-bold text-[var(--text)]">
                            <span className={`w-2 h-2 rounded-full ${
                              agentPresence.find(a => a.id === ticketDetail.assignedAgentId)?.isOnline
                                ? 'bg-emerald-500 animate-pulse'
                                : 'bg-[var(--sub)]'
                            }`} />
                            <span>Agent: {ticketDetail.assignedAgent.name}</span>
                          </div>
                        )}
                        <select
                          value={ticketDetail.assignedAgentId || ''}
                          onChange={e => assignTicket({ ticketId: selectedTicketId, agentId: e.target.value || null })}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text)] outline-none"
                        >
                          <option value="">Unassigned</option>
                          {agentPresence.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} {a.isOnline ? '(Online)' : '(Offline)'}
                            </option>
                          ))}
                        </select>
                        <select
                          value={ticketDetail.assignedTeamId || ''}
                          onChange={e => assignTicket({ ticketId: selectedTicketId, teamId: e.target.value || null })}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text)] outline-none"
                        >
                          <option value="">No Team</option>
                          {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </MetadataSection>

                    {/* Category */}
                    <MetadataSection title="Category">
                      <select
                        value={ticketDetail.category || ''}
                        onChange={e => updateCategory({ ticketId: selectedTicketId, category: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text)] outline-none"
                      >
                        <option value="">Uncategorized</option>
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </MetadataSection>

                    {/* Tags */}
                    <MetadataSection title="Tags">
                      <div className="flex flex-wrap gap-1.5">
                        {(ticketDetail.tags || []).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-bold uppercase px-2 py-1 rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] flex items-center gap-1"
                          >
                            #{tag}
                            <button
                              onClick={() => updateTags({
                                ticketId: selectedTicketId,
                                tags: ticketDetail.tags.filter(t => t !== tag),
                              })}
                              className="text-[var(--muted)] hover:text-[var(--error)]"
                            >
                              <X size={8} />
                            </button>
                          </span>
                        ))}
                        <select
                          value=""
                          onChange={e => {
                            if (e.target.value && !(ticketDetail.tags || []).includes(e.target.value)) {
                              updateTags({
                                ticketId: selectedTicketId,
                                tags: [...(ticketDetail.tags || []), e.target.value],
                              });
                            }
                          }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-[var(--surface)] border border-dashed border-[var(--border)] text-[var(--muted)] outline-none cursor-pointer"
                        >
                          <option value="">+ Add tag</option>
                          {tags.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </MetadataSection>

                    {/* Related Order */}
                    {ticketDetail.relatedOrderId && (
                      <MetadataSection title="Related Order">
                        <span className="text-sm font-mono font-bold text-[var(--brand)]">
                          #{ticketDetail.relatedOrderId}
                        </span>
                      </MetadataSection>
                    )}

                    {/* Attachments */}
                    {ticketDetail.attachments?.length > 0 && (
                      <MetadataSection title="Attachments">
                        <div className="space-y-2">
                          {ticketDetail.attachments.map(att => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--brand)] transition-colors group"
                            >
                              {att.mimeType?.startsWith('image/') ? (
                                <Image size={14} className="text-[var(--muted)] group-hover:text-[var(--brand)]" />
                              ) : (
                                <FileText size={14} className="text-[var(--muted)] group-hover:text-[var(--brand)]" />
                              )}
                              <span className="text-[11px] font-bold text-[var(--text)] truncate">{att.originalName}</span>
                              <Download size={12} className="text-[var(--muted)] ml-auto shrink-0" />
                            </a>
                          ))}
                        </div>
                      </MetadataSection>
                    )}

                    {/* SLA Target countdowns */}
                    {ticketDetail && (ticketDetail.firstResponseDueAt || ticketDetail.resolutionDueAt) && (
                      <MetadataSection title="SLA Deadline">
                        <div className="space-y-1.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                          {renderSLADeadline(ticketDetail.firstResponseDueAt, ticketDetail.firstResponseAt, ticketDetail.isFirstResponseBreached, 'Response SLA', ticketDetail.createdAt)}
                          {renderSLADeadline(ticketDetail.resolutionDueAt, ticketDetail.resolvedAt, ticketDetail.isResolutionBreached, 'Resolution SLA', ticketDetail.createdAt)}
                        </div>
                      </MetadataSection>
                    )}

                    {/* CSAT Rating */}
                    {ticketDetail.supportCsat && (
                      <MetadataSection title="Customer Satisfaction">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Rating</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={`text-xs ${i < ticketDetail.supportCsat.rating ? 'text-amber-500' : 'text-[var(--bg)]'}`}>★</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs font-bold text-emerald-900">{ticketDetail.supportCsat.rating} / 5 Stars</p>
                          {ticketDetail.supportCsat.comment && (
                            <p className="text-[11px] italic font-body text-emerald-700 mt-1">
                              "{ticketDetail.supportCsat.comment}"
                            </p>
                          )}
                          <p className="text-[9px] text-emerald-600 font-body">Submitted: {new Date(ticketDetail.supportCsat.createdAt).toLocaleDateString()}</p>
                        </div>
                      </MetadataSection>
                    )}

                    {/* Timestamps */}
                    <MetadataSection title="Timestamps">
                      <div className="space-y-1 text-[10px] font-bold text-[var(--muted)]">
                        <p>Created: {new Date(ticketDetail.createdAt).toLocaleString()}</p>
                        <p>Updated: {new Date(ticketDetail.updatedAt).toLocaleString()}</p>
                        {ticketDetail.firstResponseAt && <p>First Response: {new Date(ticketDetail.firstResponseAt).toLocaleString()}</p>}
                        {ticketDetail.resolvedAt && <p>Resolved: {new Date(ticketDetail.resolvedAt).toLocaleString()}</p>}
                      </div>
                    </MetadataSection>

                    {/* Actions */}
                    <MetadataSection title="Actions">
                      <button
                        onClick={() => {
                          if (window.confirm('Archive this ticket? It will be closed and hidden.')) {
                            archiveTicketMut(selectedTicketId);
                            setSelectedTicketId(null);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--error)] text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        <Archive size={14} />
                        Archive Ticket
                      </button>
                    </MetadataSection>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Canned Response Creator Modal ── */}
      <AnimatePresence>
        {showCreateTemplateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--surface)] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[var(--border)] space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                <h3 className="font-display text-lg font-bold text-[var(--text)]">Create Response Template</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="p-1 hover:bg-[var(--surface-muted)] rounded-lg text-[var(--muted)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newTemplateShortcut.startsWith('/')) {
                    alert('Shortcut must start with a slash (e.g. /greeting)');
                    return;
                  }
                  await saveCannedTemplate({
                    shortcut: newTemplateShortcut.trim(),
                    title: newTemplateTitle.trim(),
                    content: newTemplateContent.trim(),
                  });
                  setNewTemplateShortcut('');
                  setNewTemplateTitle('');
                  setNewTemplateContent('');
                  setShowCreateTemplateModal(false);
                }}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Shortcut (must start with /)</label>
                  <input
                    type="text"
                    required
                    placeholder="/greet"
                    value={newTemplateShortcut}
                    onChange={e => setNewTemplateShortcut(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl px-4 py-2.5 text-xs outline-none font-body font-bold text-[var(--text)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Template Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Standard Greeting"
                    value={newTemplateTitle}
                    onChange={e => setNewTemplateTitle(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl px-4 py-2.5 text-xs outline-none font-body font-bold text-[var(--text)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Template Content</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Hello! Thank you for contacting support. My name is {{agentName}}..."
                    value={newTemplateContent}
                    onChange={e => setNewTemplateContent(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl px-4 py-2.5 text-xs outline-none font-body font-bold text-[var(--text)] resize-none"
                  />
                  <p className="text-[9px] text-[var(--muted)]">Tip: Use `{{agentName}}` to automatically insert the agent's name.</p>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowCreateTemplateModal(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--bg)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--brand)] text-[var(--bg)] rounded-xl text-xs font-bold hover:brightness-110"
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const MetadataSection = ({ title, children }) => (
  <div>
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">{title}</h4>
    {children}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2">
    <Icon size={12} className="text-[var(--muted)] shrink-0" />
    <span className="text-[11px] font-bold text-[var(--sub)]">{label}:</span>
    <span className="text-[11px] font-bold text-[var(--text)] truncate">{value}</span>
  </div>
);

function formatEventType(type) {
  return type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || type;
}

const renderSLADeadline = (dueAt, metAt, isBreached, label, ticketCreatedAt) => {
  if (!dueAt) return null;
  
  const due = new Date(dueAt);
  const met = metAt ? new Date(metAt) : null;
  const now = new Date();
  
  if (met) {
    const metTime = met.getTime() - new Date(ticketCreatedAt).getTime();
    const durationStr = formatDuration(metTime);
    const breached = isBreached || met > due;
    return (
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-[var(--sub)]">{label}:</span>
        <span className={breached ? 'text-red-500' : 'text-green-600'}>
          {breached ? `Breached (Met in ${durationStr})` : `Met in ${durationStr}`}
        </span>
      </div>
    );
  }
  
  const diff = due.getTime() - now.getTime();
  const breached = diff < 0 || isBreached;
  const durationStr = formatDuration(Math.abs(diff));
  
  return (
    <div className="flex items-center justify-between text-[10px] font-bold">
      <span className="text-[var(--sub)]">{label}:</span>
      <span className={breached ? 'text-red-500 animate-pulse' : 'text-[var(--text)]'}>
        {breached ? `Breached by ${durationStr}` : `Due in ${durationStr}`}
      </span>
    </div>
  );
};

function formatDuration(ms) {
  const mins = Math.floor(ms / (60 * 1000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours < 24) return `${hours}h ${remainingMins}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

export default SupportInbox;
