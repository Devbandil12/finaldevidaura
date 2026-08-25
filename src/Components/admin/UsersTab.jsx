import React, { useState, useMemo } from 'react';
import { User, Download } from 'lucide-react';
import { UserList } from '../../features/admin/components/users/UserList';
import { UserDetails } from '../../features/admin/components/users/UserDetails';
import { useAdminUsers } from '../../features/admin/hooks/useAdmin';

// --- MAIN COMPONENT ---
  const UsersTab = ({
    userSearchQuery, setUserSearchQuery,
    editingUser, setEditingUser, handleEditUser, handleDeleteUser,
    downloadCSV
  }) => {

  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: usersResponse, isLoading } = useAdminUsers(page, limit, userSearchQuery);
  const users = usersResponse?.data || [];
  const meta = usersResponse?.meta || { totalPages: 1, currentPage: 1 };

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    const sorted = [...users];
    const getDeliveredCount = (user) => user.orders?.filter(o => o.status === 'Delivered').length || 0;

    if (sortBy === 'most-delivered') {
      return sorted.sort((a, b) => getDeliveredCount(b) - getDeliveredCount(a));
    } else {
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [users, sortBy]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20 space-y-8">
      
      {/* --- HEADER (List View Only) --- */}
      {!editingUser && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
          <div>
            <h2 className="font-display text-3xl font-medium text-[var(--text)] tracking-tight flex items-center">
              <User className="w-7 h-7 mr-3 text-[var(--accent)]" strokeWidth={1.5} /> 
              User Management
            </h2>
            <p className="font-display italic text-[var(--sub)] text-lg mt-2 tracking-wide">
              Manage customer accounts and details.
            </p>
          </div>
          <button 
            onClick={() => downloadCSV(users, 'users.csv')} 
            className="flex items-center px-6 py-3 bg-[var(--surface)] text-[var(--text)] rounded-lg border border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand)] transition-all font-body font-bold text-sm shadow-sm whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4 mr-2 text-[var(--muted)]" strokeWidth={2} /> Export CSV
          </button>
        </div>
      )}

      {/* --- CONTENT --- */}
      {editingUser ? (
        <UserDetails 
          editingUser={editingUser} 
          setEditingUser={setEditingUser} 
        />
      ) : (
        <UserList 
          sortedUsers={sortedUsers} 
          userSearchQuery={userSearchQuery} 
          setUserSearchQuery={setUserSearchQuery} 
          sortBy={sortBy} 
          setSortBy={setSortBy} 
          handleEditUser={handleEditUser} 
          handleDeleteUser={handleDeleteUser} 
        />
      )}

      {/* Pagination Controls */}
      {!editingUser && meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-5 mt-10 font-body">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-5 py-2.5 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg disabled:opacity-40 hover:bg-[var(--surface)] hover:border-[var(--border)] hover:text-[var(--brand)] transition-all font-bold text-sm shadow-sm"
          >
            Previous
          </button>
          <span className="font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)]">
            Page {meta.currentPage} of {meta.totalPages}
          </span>
          <button 
            disabled={page >= meta.totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-5 py-2.5 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg disabled:opacity-40 hover:bg-[var(--surface)] hover:border-[var(--border)] hover:text-[var(--brand)] transition-all font-bold text-sm shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersTab;