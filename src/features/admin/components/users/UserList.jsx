import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, CheckCircle, ExternalLink, Trash2, ArrowUpDown, ChevronDown, Check, User as UserIcon } from 'lucide-react';
import { UserAvatar } from './UserDetails';

const SortDropdown = ({ currentSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { label: "Sort: Newest Joined", value: "newest" },
    { label: "Sort: Most Delivered", value: "most-delivered" }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    onSortChange(value);
    setIsOpen(false);
  };

  const currentLabel = options.find(o => o.value === currentSort)?.label;

  return (
    <div className="relative w-full sm:w-auto font-body" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full sm:w-60 flex items-center justify-between px-4 py-3.5 bg-[var(--surface)] border rounded-xl shadow-[var(--shadow)] font-body font-bold text-sm transition-all duration-300 
        ${isOpen ? 'border-[var(--brand)] ring-1 ring-[var(--brand)] text-[var(--text)]' : 'border-[var(--border)] hover:border-[var(--border)] text-[var(--sub)] hover:shadow-[var(--shadow-strong)]'}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <ArrowUpDown size={16} strokeWidth={2} className="text-[var(--muted)] shrink-0" />
          <span className="truncate">{currentLabel}</span>
        </div>
        <ChevronDown size={16} strokeWidth={2} className={`ml-2 text-[var(--muted)] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-full sm:w-60 bg-[var(--surface)] rounded-xl shadow-[var(--shadow-strong)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[var(--border)]">
          <div className="p-1.5 space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3.5 py-2.5 font-body text-xs font-bold uppercase tracking-wider flex items-center justify-between rounded-lg transition-colors duration-200 ${currentSort === option.value ? 'bg-[var(--surface)] text-[var(--brand)]' : 'text-[var(--sub)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}`}
              >
                {option.label}
                {currentSort === option.value && <Check size={16} strokeWidth={2.5} className="text-[var(--brand)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const UserList = ({ sortedUsers, userSearchQuery, setUserSearchQuery, sortBy, setSortBy, handleEditUser, handleDeleteUser }) => {
  return (
    <div className="space-y-6 animate-fadeIn duration-500 font-body">
      
      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow group">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-[var(--surface)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--brand)] border border-[var(--border)] hover:border-[var(--border)] focus:border-[var(--brand)] shadow-[var(--shadow)] font-body font-bold text-sm text-[var(--text)] placeholder-[var(--muted)] transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)] group-focus-within:text-[var(--brand)] transition-colors" strokeWidth={1.5} />
        </div>
        <SortDropdown currentSort={sortBy} onSortChange={setSortBy} />
      </div>

      {/* Grid of Users */}
      {sortedUsers?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedUsers.map((user) => {
            const deliveredCount = user.orders?.filter(o => o.status === 'Delivered').length || 0;

            return (
              <div key={user.id} className="bg-[var(--surface)] rounded-3xl p-6 shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] border border-[var(--border)] hover:border-[var(--border)] transition-all duration-300 group flex flex-col cursor-default">
                
                {/* Avatar Top */}
                <div className="flex justify-between items-start mb-5">
                  <div className="relative">
                    <UserAvatar user={user} size="md" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-body text-base font-bold text-[var(--text)] group-hover:text-[var(--brand)] transition-colors truncate tracking-wide">{user.name}</h3>
                  <p className="font-body text-xs font-bold text-[var(--sub)] truncate mt-1">{user.email}</p>
                  
                  <div className="mt-3.5 flex items-center gap-2 font-body text-[11px] font-bold text-[var(--muted)]">
                    <Calendar size={13} strokeWidth={2} className="text-[var(--sub)]" /> 
                    <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  {deliveredCount > 0 && (
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface)] text-[var(--success)] border border-[var(--border)] rounded-md font-body text-[9px] uppercase tracking-widest font-bold shadow-sm">
                      <CheckCircle size={12} strokeWidth={2.5} /> {deliveredCount} Delivered
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex gap-3">
                  <button 
                    onClick={() => handleEditUser(user)} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-body text-xs font-bold uppercase tracking-widest text-[var(--brand)] bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--accent-soft)] hover:border-[var(--brand)] transition-all shadow-sm"
                  >
                    <ExternalLink size={14} strokeWidth={2} /> Profile
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)} 
                    className="flex-none flex items-center justify-center w-11 h-11 text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--error)] hover:text-[var(--bg)] hover:border-[var(--error)] transition-all shadow-sm" 
                    title="Delete User"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--border)] shadow-[var(--shadow)]">
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-full mb-3 text-[var(--muted)] shadow-inner">
            <Search className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">No users found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export { UserList, SortDropdown };