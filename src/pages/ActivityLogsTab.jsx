import React, { useState, useContext, useMemo } from 'react';
import { 
  History, Search, Filter, User, ShieldAlert, Edit, Trash2, PlusCircle, 
  Clock, CheckCircle, XCircle 
} from 'lucide-react';
import { AdminContext } from '../contexts/AdminContext';

const ActivityLogsTab = () => {
  const { activityLogs } = useContext(AdminContext);
  const [filter, setFilter] = useState('ALL'); // ALL, CREATE, UPDATE, DELETE, AUTH
  const [searchTerm, setSearchTerm] = useState('');

  // --- ACTION CONFIGURATION ---
  // Maps backend actions to Colors & Icons
  const getActionStyle = (action) => {
    const upperAction = (action || '').toUpperCase();
    if (upperAction.includes('DELETE')) return { color: 'red', icon: Trash2, label: 'Deleted' };
    if (upperAction.includes('UPDATE') || upperAction.includes('EDIT')) return { color: 'amber', icon: Edit, label: 'Updated' };
    if (upperAction.includes('CREATE') || upperAction.includes('ADD')) return { color: 'green', icon: PlusCircle, label: 'Created' };
    if (upperAction.includes('LOGIN') || upperAction.includes('AUTH')) return { color: 'blue', icon: ShieldAlert, label: 'Security' };
    return { color: 'gray', icon: CheckCircle, label: 'Action' };
  };

  // --- FILTERING LOGIC ---
  const filteredLogs = useMemo(() => {
    if (!activityLogs) return [];
    
    return activityLogs.filter(log => {
      // 1. Text Search
      const searchString = (
        (log.description || '') + 
        (log.actor?.name || '') + 
        (log.actor?.email || '') + 
        (log.action || '')
      ).toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());

      // 2. Category Filter
      let matchesFilter = true;
      if (filter !== 'ALL') {
        const action = (log.action || '').toUpperCase();
        if (filter === 'DELETE') matchesFilter = action.includes('DELETE');
        else if (filter === 'UPDATE') matchesFilter = action.includes('UPDATE');
        else if (filter === 'CREATE') matchesFilter = action.includes('CREATE');
      }

      return matchesSearch && matchesFilter;
    });
  }, [activityLogs, filter, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <History className="text-indigo-600" /> Audit Logs
          </h1>
          <p className="text-sm text-gray-500">Track administrative actions and system changes.</p>
        </div>
        
        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-indigo-200 rounded-xl outline-none transition-all w-64 text-sm font-medium"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Creations</option>
            <option value="UPDATE">Updates</option>
            <option value="DELETE">Deletions</option>
          </select>
        </div>
      </div>

      {/* LOGS LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <History size={48} strokeWidth={1.5} className="mb-4 opacity-50" />
            <p>No activity logs found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredLogs.map((log) => {
              const style = getActionStyle(log.action);
              const Icon = style.icon;
              const date = new Date(log.createdAt);

              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors group flex gap-4 items-start">
                  
                  {/* ICON AVATAR */}
                  <div className={`mt-1 min-w-[40px] h-10 rounded-full flex items-center justify-center bg-${style.color}-50 text-${style.color}-600 border border-${style.color}-100`}>
                    <Icon size={18} />
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-gray-900">
                        {log.action?.replace(/_/g, ' ')}
                      </p>
                      <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                        <Clock size={10} />
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                      {log.description}
                    </p>

                    {/* METADATA CHIPS */}
                    <div className="flex items-center gap-3 mt-3">
                      {/* Actor */}
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
                        {log.actor?.profileImage ? (
                          <img src={log.actor.profileImage} className="w-4 h-4 rounded-full" alt="" />
                        ) : (
                          <User size={12} className="text-gray-400" />
                        )}
                        <span className="text-xs font-medium text-gray-700">
                          {log.actor?.name || 'Unknown Actor'}
                        </span>
                      </div>

                      <span className="text-gray-300">→</span>

                      {/* Target (if exists) */}
                      {log.target?.name && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
                          <User size={12} />
                          <span className="text-xs font-bold">
                            {log.target.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsTab;