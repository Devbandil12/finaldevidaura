import React from 'react';
import { Search, Mail, Phone, Calendar, MessageSquare, Inbox } from 'lucide-react';

const QueriesTab = ({ queries, querySearch, setQuerySearch }) => {
  
  // Filter logic (Unchanged)
  const filteredQueries = queries?.filter(q => 
    q.email.toLowerCase().includes(querySearch.toLowerCase()) || 
    q.phone.includes(querySearch) || 
    (q.date && q.date.includes(querySearch))
  );

  return (
    <div className="space-y-8 p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-3 text-indigo-600" /> Customer Queries
          </h2>
          <p className="text-sm text-gray-500 mt-1">View and manage incoming support messages.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search email, phone..." 
            value={querySearch} 
            onChange={(e) => setQuerySearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm text-sm transition-all" 
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* --- QUERIES GRID --- */}
      {filteredQueries?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredQueries.map((query, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
              
              {/* Card Header */}
              <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {/* Initials Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {query.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm truncate max-w-[150px] sm:max-w-[200px]" title={query.email}>
                        {query.email}
                      </h3>
                      {query.date && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                          <Calendar size={10} />
                          {query.date}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-600">
                    <Mail size={12} className="text-indigo-500" /> {query.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-600">
                    <Phone size={12} className="text-green-500" /> {query.phone}
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div className="p-5 flex-1 bg-white">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Message</p>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {query.message}
                </div>
              </div>

              {/* Action Footer (Visual Only since no handlers passed) */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-gray-400 font-medium">Received Query</span>
                <button className="text-xs font-bold text-indigo-600 hover:underline">View Details</button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* --- EMPTY STATE --- */
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <Inbox className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No queries found</h3>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default QueriesTab;