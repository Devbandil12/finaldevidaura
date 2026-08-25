import React from 'react';
import { PackageCheck, Calendar, Clock, Link as LinkIcon } from 'lucide-react';

const VerticalTimeline = ({ timeline, currentStatus, courierDetails }) => {
  const events = timeline && timeline.length > 0 
    ? timeline 
    : [{ title: "Order Placed", description: "Order received", timestamp: new Date(), status: "Order Placed" }];

  return (
    <div className="mt-4 mb-8 space-y-0 relative pl-2 font-body">
      <h4 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-6">Order History</h4>
      
      {/* Connector Line */}
      <div className="absolute left-[27px] top-10 bottom-4 w-0.5 bg-[var(--border)]" />

      {events.map((event, index) => {
        const isLatest = index === 0;
        const dateObj = new Date(event.timestamp);
        
        return (
          <div key={index} className="relative flex gap-6 pb-10 last:pb-0 group">
            {/* Timeline Dot/Icon */}
            <div className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center border-4 border-[var(--surface)] transition-colors duration-300 ${
              isLatest ? 'bg-[var(--brand)] text-[var(--bg)] shadow-[var(--shadow)]' : 'bg-[var(--surface)] border-[var(--surface)] text-[var(--muted)] group-hover:border-[var(--border)]'
            }`}>
              {isLatest ? <PackageCheck size={20} strokeWidth={1.5} /> : <div className={`h-2.5 w-2.5 rounded-full ${isLatest ? 'bg-[var(--surface)]' : 'bg-[var(--border)] group-hover:bg-[var(--muted)] transition-colors'}`} />}
            </div>
            
            {/* Event Content */}
            <div className={`flex-1 pt-1.5 transition-opacity duration-300 ${isLatest ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <h4 className="font-body text-sm font-bold text-[var(--text)] tracking-wide">{event.title}</h4>
                  <p className="font-body text-[11px] font-bold text-[var(--sub)] mt-1.5 max-w-md leading-relaxed">{event.description}</p>
                  
                  {/* Courier Tracking Block */}
                  {(event.status === 'Shipped' || event.status === 'Out for Delivery' || event.status.includes('Return') || event.status.includes('RTO')) && courierDetails?.trackingId && (
                    <div className="mt-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl inline-block shadow-sm hover:border-[var(--border)] transition-colors duration-300">
                        <p className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">
                          Courier: <span className="text-[var(--text)]">{courierDetails.courierName || 'Shiprocket'}</span>
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="font-body text-sm font-bold text-[var(--brand)] tracking-wide">AWB: {courierDetails.trackingId}</p>
                          <a 
                            href={`https://shiprocket.co/tracking/${courierDetails.trackingId}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--brand)] hover:text-[var(--bg)] bg-[var(--surface-muted)] hover:bg-[var(--brand)] px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Track Live <LinkIcon size={12} strokeWidth={2.5} />
                          </a>
                        </div>
                    </div>
                  )}
                </div>
                
                {/* Date & Time */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2.5 sm:gap-1.5 font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">
                  <span className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-md border border-[var(--border)] sm:border-transparent sm:bg-transparent sm:p-0">
                    <Calendar size={14} strokeWidth={2} className="text-[var(--sub)]" />
                    {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-md border border-[var(--border)] sm:border-transparent sm:bg-transparent sm:p-0">
                    <Clock size={14} strokeWidth={2} className="text-[var(--sub)]" />
                    {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VerticalTimeline;