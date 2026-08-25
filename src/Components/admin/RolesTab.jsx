import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../features/admin/hooks/usePermissions';
import { httpClient as api } from '../../api/client/httpClient.js';
import { Plus, Edit2, Trash2, Shield, AlertTriangle } from 'lucide-react';

export default function RolesTab() {
  const { hasPermission, role: adminRole, isLoading: permissionsLoading } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/api/rbac/roles'),
        api.get('/api/rbac/permissions')
      ]);
      setRoles(rolesRes.data || []);
      setPermissions(permsRes.data || []);
    } catch (error) {
      window.toast?.error('Failed to fetch roles configuration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && hasPermission('roles.view')) {
      fetchRoles();
    }
  }, [permissionsLoading]);

  const handleOpenModal = (role = null, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description || '', permissions: role.permissions || [] });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewOnly(false);
    setEditingRole(null);
  };

  const handleTogglePermission = (permKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter(p => p !== permKey)
        : [...prev.permissions, permKey]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/api/rbac/roles/${editingRole.id}`, formData);
        window.toast?.success('Role updated successfully');
      } else {
        await api.post('/api/rbac/roles', formData);
        window.toast?.success('Role created successfully');
      }
      handleCloseModal();
      fetchRoles();
    } catch (error) {
      window.toast?.error(error.response?.data?.error || 'Failed to save role');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? Users assigned to this role will lose their permissions.')) return;
    try {
      await api.delete(`/api/rbac/roles/${roleId}`);
      window.toast?.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      window.toast?.error(error.response?.data?.error || 'Failed to delete role');
    }
  };

  // Group permissions for UI display
  const groupedPermissions = permissions.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {});

  if (permissionsLoading) return <div className="p-16 text-center text-[var(--muted)] font-display italic text-xl tracking-wide">Loading permissions...</div>;
  
  if (!hasPermission('roles.view')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
          <Shield className="w-10 h-10 text-[var(--muted)]" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-3xl font-medium text-[var(--text)] tracking-tight">Access Denied</h2>
        <p className="font-display italic text-[var(--sub)] text-lg mt-3">You do not have permission to view or manage roles.</p>
      </div>
    );
  }

  if (loading) return <div className="p-16 text-center text-[var(--muted)] font-display italic text-xl tracking-wide">Loading roles...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-[var(--text)] flex items-center gap-3 tracking-tight">
            <Shield className="text-[var(--accent)]" strokeWidth={1.5} size={32} /> Roles & Permissions
          </h2>
          <p className="font-display italic text-lg text-[var(--sub)] mt-2 tracking-wide">Manage custom access roles and their granular capabilities.</p>
        </div>
        {(adminRole === 'SUPER_ADMIN' || hasPermission('roles.manage')) && (
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-[var(--brand)] text-[var(--surface)] hover:brightness-110 px-6 py-3 rounded-lg font-body font-bold text-sm tracking-wide transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] button-hero"
          >
            <Plus size={18} strokeWidth={2.5} /> Create Role
            <div className="pulse border-[var(--surface)]"></div>
          </button>
        )}
      </div>

      {/* ROLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 lg:p-8 shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] hover:border-[var(--border)] transition-all duration-300 relative overflow-hidden flex flex-col group">
            {role.isSystem && (
              <div className="absolute top-0 right-0 bg-[var(--accent-soft)] text-[var(--brand)] border-b border-l border-[var(--accent)]/20 font-body text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-bl-xl shadow-sm">
                SYSTEM
              </div>
            )}
            <h3 
              className="font-body text-xl font-bold text-[var(--text)] mb-2 cursor-pointer group-hover:text-[var(--brand)] transition-colors tracking-tight pr-12"
              onClick={() => handleOpenModal(role, true)}
            >
              {role.name}
            </h3>
            <p className="font-body text-sm font-bold text-[var(--sub)] mb-6 h-10 line-clamp-2 leading-relaxed">
              {role.description || 'No description provided.'}
            </p>
            
            <div className="flex items-center gap-2 mb-8">
              <span 
                className="bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand)] font-body text-[11px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all shadow-sm"
                onClick={() => handleOpenModal(role, true)}
                title="Click to view permissions"
              >
                {role.permissions?.length || 0} Permissions
              </span>
            </div>

            <div className="flex gap-3 mt-auto pt-5 border-t border-[var(--border)]">
              {(!role.isSystem && (adminRole === 'SUPER_ADMIN' || hasPermission('roles.manage'))) && (
                <>
                  <button onClick={() => handleOpenModal(role)} className="flex-1 flex items-center justify-center gap-2 text-[var(--brand)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--accent-soft)] hover:border-[var(--brand)] py-2.5 rounded-xl font-body font-bold transition-colors text-sm shadow-sm">
                    <Edit2 size={16} strokeWidth={2} /> Edit
                  </button>
                  <button onClick={() => handleDelete(role.id)} className="flex items-center justify-center w-11 h-11 text-[var(--error)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--error)] hover:text-[var(--bg)] hover:border-[var(--error)] rounded-xl transition-all shadow-sm shrink-0">
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </>
              )}
              {/* If system role, provide a view button instead of blank space */}
              {(role.isSystem || (!hasPermission('roles.manage') && adminRole !== 'SUPER_ADMIN')) && (
                 <button onClick={() => handleOpenModal(role, true)} className="w-full flex items-center justify-center gap-2 text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-muted)] hover:border-[var(--border)] py-2.5 rounded-xl font-body font-bold transition-colors text-sm shadow-sm">
                    View Details
                 </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[var(--overlay-light)] backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-fadeIn font-body">
          <div className="bg-[var(--surface)] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[var(--shadow-strong)] border border-[var(--border)] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 md:px-8 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
              <h3 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">
                {isViewOnly ? 'View Role' : editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button onClick={handleCloseModal} className="text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)] p-2 rounded-lg transition-colors">
                <Plus className="rotate-45" size={24} strokeWidth={2} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-[var(--bg)]">
              
              {/* Role Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)]">
                <div>
                  <label className="block font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)] mb-2.5 ml-1">Role Name</label>
                  <input 
                    readOnly={isViewOnly} 
                    required 
                    value={formData.name} 
                    onChange={e=>setFormData({...formData, name: e.target.value})} 
                    type="text" 
                    className={`w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none transition-all font-body font-bold text-sm text-[var(--text)] placeholder-[var(--muted)] ${isViewOnly ? 'opacity-70 cursor-not-allowed' : ''}`} 
                    placeholder="e.g. Marketing Manager" 
                  />
                </div>
                <div>
                  <label className="block font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)] mb-2.5 ml-1">Description</label>
                  <input 
                    readOnly={isViewOnly} 
                    value={formData.description} 
                    onChange={e=>setFormData({...formData, description: e.target.value})} 
                    type="text" 
                    className={`w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none transition-all font-body font-bold text-sm text-[var(--text)] placeholder-[var(--muted)] ${isViewOnly ? 'opacity-70 cursor-not-allowed' : ''}`} 
                    placeholder="Brief description of this role" 
                  />
                </div>
              </div>

              {/* Permissions Header */}
              <div className="mb-6 border-b border-[var(--border)] pb-4">
                <h4 className="font-display text-3xl font-medium text-[var(--text)] tracking-tight">Role Permissions</h4>
                <p className="font-body text-sm font-bold text-[var(--sub)] mt-1.5">Select the capabilities this role should have access to.</p>
              </div>

              {/* Permissions Grid */}
              <div className="space-y-10">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group}>
                    <h5 className="font-body text-[11px] uppercase tracking-widest font-bold text-[var(--brand)] mb-5 border-b border-[var(--border)] pb-2">{group}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {perms.map(perm => {
                        const isChecked = formData.permissions.includes(perm.key);
                        return (
                          <label key={perm.key} className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${isChecked ? 'border-[var(--brand)] bg-[var(--accent-soft)] shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)] hover:bg-[var(--surface)]'} ${isViewOnly ? 'cursor-default opacity-90' : 'cursor-pointer'}`}>
                            
                            {/* Custom Checkbox mapping to brand colors */}
                            <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                              <input 
                                type="checkbox" 
                                disabled={isViewOnly}
                                className={`peer appearance-none w-5 h-5 border-2 rounded transition-all outline-none ${isChecked ? 'bg-[var(--brand)] border-[var(--brand)]' : 'bg-[var(--surface)] border-[var(--border)]'} ${isViewOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                checked={isChecked}
                                onChange={() => !isViewOnly && handleTogglePermission(perm.key)}
                              />
                              <svg className={`absolute w-3.5 h-3.5 pointer-events-none text-[var(--bg)] opacity-0 peer-checked:opacity-100 transition-opacity ${isChecked ? 'scale-100' : 'scale-50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-body font-bold text-[var(--text)] text-sm tracking-wide flex items-center gap-2">
                                {perm.name}
                                {perm.isSystem && perm.description?.toLowerCase().includes('sensitive') && <AlertTriangle size={14} strokeWidth={2.5} className="text-[var(--error)]" title="Sensitive Permission" />}
                              </div>
                              <div className="font-body text-[11px] font-bold text-[var(--sub)] mt-1.5 leading-snug">{perm.description}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </form>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)] flex justify-end gap-4">
              {isViewOnly ? (
                <button type="button" onClick={handleCloseModal} className="px-8 py-3 font-body font-bold text-sm text-[var(--surface)] bg-[var(--brand)] hover:brightness-110 shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] rounded-lg transition-all button-hero">
                  Close Preview
                  <div className="pulse border-[var(--surface)]"></div>
                </button>
              ) : (
                <>
                  <button type="button" onClick={handleCloseModal} className="px-6 py-3 font-body font-bold text-sm text-[var(--sub)] hover:text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-muted)] rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} type="submit" className="px-8 py-3 font-body font-bold text-sm text-[var(--bg)] bg-[var(--brand)] hover:brightness-110 shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] rounded-lg transition-all button-hero">
                    Save Role
                    <div className="pulse border-[#F5F1E8]"></div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}