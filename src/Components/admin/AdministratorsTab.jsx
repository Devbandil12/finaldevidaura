import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../features/admin/hooks/usePermissions';
import { httpClient as api } from '../../api/client/httpClient.js';
import { UserPlus, Shield, Mail, Trash2, X, ShieldAlert } from 'lucide-react';

export default function AdministratorsTab() {
  const { hasPermission, role: currentAdminRole, isLoading: permissionsLoading } = usePermissions();
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignData, setAssignData] = useState({ targetClerkId: '', roleId: '' });
  const [users, setUsers] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminsRes, rolesRes, usersRes] = await Promise.all([
        api.get('/api/rbac/administrators'),
        api.get('/api/rbac/roles'),
        api.get('/api/users') // To populate assignment dropdown
      ]);
      setAdmins(adminsRes.data || []);
      setRoles(rolesRes.data || []);
      const usersPayload = usersRes.data;
      setUsers(Array.isArray(usersPayload) ? usersPayload : (Array.isArray(usersPayload?.users) ? usersPayload.users : (Array.isArray(usersPayload?.data) ? usersPayload.data : [])));
    } catch (error) {
      window.toast?.error('Failed to fetch administrators data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && hasPermission('administrators.view')) {
      fetchData();
    }
  }, [permissionsLoading]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/rbac/assign', assignData);
      window.toast?.success('Role assigned successfully');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (error) {
      window.toast?.error(error.response?.data?.error || 'Failed to assign role');
    }
  };

  const handleDeleteAssignment = async (clerkId) => {
    window.toast?.info('To remove an administrator completely, use the Customers tab to update their account role, or assign them a different custom role here.');
  };

  // --- LOADING STATE ---
  if (permissionsLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn">
        <Shield className="w-12 h-12 text-[var(--accent)] mb-4 animate-pulse" strokeWidth={1} />
        <p className="font-display italic text-[var(--muted)] text-xl tracking-wide">Loading administrators...</p>
      </div>
    );
  }
  
  // --- ACCESS DENIED STATE ---
  if (!hasPermission('administrators.view')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-[var(--error)]" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-3xl font-medium text-[var(--text)]">Access Denied</h2>
        <p className="font-display italic text-lg text-[var(--sub)] mt-3 max-w-md tracking-wide">
          You do not have the required permissions to view or manage administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-body animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
          <h2 className="font-display text-3xl font-medium text-[var(--text)] flex items-center gap-3">
            <Shield className="text-[var(--accent)]" strokeWidth={1.5} size={28} /> 
            Administrators
          </h2>
          <p className="text-[var(--sub)] text-base mt-2 font-display italic tracking-wide">
            Manage system administrators and assign roles to users.
          </p>
        </div>
        
        {(currentAdminRole === 'SUPER_ADMIN' || currentAdminRole === 'SUPER ADMIN' || hasPermission('roles.assign')) && (
          <button 
            onClick={() => setIsAssignModalOpen(true)} 
            className="flex items-center gap-2 bg-[var(--brand)] text-[var(--surface)] px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] button-hero"
          >
            <UserPlus size={18} strokeWidth={2} /> Assign Role
            <div className="pulse border-[var(--surface)]"></div>
          </button>
        )}
      </div>

      {/* DATA TABLE */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden">
        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="p-4 pl-6 font-body font-bold text-[var(--muted)] text-[11px] uppercase tracking-widest w-1/2">Administrator</th>
                <th className="p-4 font-body font-bold text-[var(--muted)] text-[11px] uppercase tracking-widest">Assigned Role</th>
                <th className="p-4 pr-6 font-body font-bold text-[var(--muted)] text-[11px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-[var(--surface)] transition-colors duration-300 group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-lg bg-[var(--surface)] text-[var(--brand)] border border-[var(--border)] flex items-center justify-center font-body font-bold text-lg shadow-sm transition-transform duration-500 ease-out group-hover:scale-105 group-hover:border-[var(--brand)]">
                        {admin.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-body font-bold text-[var(--text)] text-sm tracking-wide truncate group-hover:text-[var(--brand)] transition-colors">
                          {admin.name}
                        </div>
                        <div className="text-xs font-bold text-[var(--sub)] flex items-center gap-1.5 mt-1 truncate">
                          <Mail size={12} strokeWidth={2} className="text-[var(--muted)]" /> {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-md font-body text-[10px] uppercase tracking-widest font-bold border transition-colors ${
                      admin.isSystem 
                        ? 'bg-[var(--accent-soft)] text-[var(--brand)] border-transparent' 
                        : 'bg-[var(--surface-muted)] text-[var(--text)] border-[var(--border)]'
                    }`}>
                      {admin.roleName?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {(currentAdminRole === 'SUPER_ADMIN' || currentAdminRole === 'SUPER ADMIN' || hasPermission('roles.assign')) && (
                      <button 
                        onClick={() => handleDeleteAssignment(admin.clerkId)} 
                        className="p-2.5 text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--surface-muted)] rounded-lg transition-colors inline-flex"
                        title="Remove Assignment"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-16 text-center text-[var(--sub)] font-display italic text-xl tracking-wide border-t border-[var(--border)]">
                    No administrators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN ROLE MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-[var(--overlay-light)] backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-lg shadow-[var(--shadow-strong)] border border-[var(--border)] overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--surface)] flex justify-between items-center">
              <h3 className="font-display text-2xl font-medium text-[var(--text)]">Assign Role</h3>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)] transition-all p-1.5 rounded-lg"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleAssignSubmit} className="p-6">
              <div className="space-y-6">
                
                {/* User Select */}
                <div>
                  <label className="block font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)] mb-2.5">
                    Select User
                  </label>
                  <div className="relative">
                    <select 
                      required 
                      value={assignData.targetClerkId} 
                      onChange={e => setAssignData({...assignData, targetClerkId: e.target.value})} 
                      className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text)] appearance-none outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all cursor-pointer"
                    >
                      <option value="">-- Choose a user --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.clerkId}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                
                {/* Role Select */}
                <div>
                  <label className="block font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)] mb-2.5">
                    Select Role
                  </label>
                  <div className="relative">
                    <select 
                      required 
                      value={assignData.roleId} 
                      onChange={e => setAssignData({...assignData, roleId: e.target.value})} 
                      className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text)] appearance-none outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all cursor-pointer"
                    >
                      <option value="">-- Choose a role --</option>
                      {roles.map(r => (
                        <option 
                          key={r.id} 
                          value={r.id} 
                          disabled={(r.name === 'SUPER_ADMIN' || r.name === 'SUPER ADMIN') && (currentAdminRole !== 'SUPER_ADMIN' && currentAdminRole !== 'SUPER ADMIN')}
                        >
                          {r.name?.replace(/_/g, ' ')} {(r.name === 'SUPER_ADMIN' || r.name === 'SUPER ADMIN') && (currentAdminRole !== 'SUPER_ADMIN' && currentAdminRole !== 'SUPER ADMIN') ? '(Requires SUPER ADMIN)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAssignModalOpen(false)} 
                  className="px-6 py-2.5 text-sm font-bold text-[var(--sub)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-2.5 text-sm font-bold text-[var(--surface)] bg-[var(--brand)] hover:brightness-110 shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] rounded-lg transition-all button-hero"
                >
                  Confirm Assignment
                  <div className="pulse border-[var(--surface)]"></div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}