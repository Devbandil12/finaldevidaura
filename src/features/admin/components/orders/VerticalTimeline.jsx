import React from 'react';
import { PackageCheck, Calendar, Clock, Link as LinkIcon } from 'lucide-react';

const VerticalTimeline = ({ timeline, currentStatus, courierDetails }) => {
  const events = timeline && timeline.length > 0 
    ? timeline 
    : [{ title: "Order Placed", description: "Order received", timestamp: new Date(), status: "Order Placed" }];

  return (
    <div className="mt-4 mb-6 space-y-0 relative font-body pl-2">
      <h4 className="font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-6">Order Event Log</h4>
      
      {/* Connector Line - Subtly styled for light/dark mode */}
      <div className="absolute left-[21px] sm:left-[27px] top-10 bottom-6 w-px bg-[var(--border)]/30 dark:bg-[var(--border)]/60" />

      {events.map((event, index) => {
        const isLatest = index === 0;
        const dateObj = new Date(event.timestamp);
        
        return (
          <div key={index} className="relative flex gap-4 sm:gap-6 pb-8 last:pb-0 group">
            {/* Timeline Dot/Icon */}
            <div className={`relative z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 ease-out shrink-0
              ${isLatest 
                ? 'bg-[var(--brand)]/5 text-[var(--brand)] ring-1 ring-[var(--brand)]/30 shadow-[0_4px_16px_rgba(0,0,0,0.04)]' 
                : 'bg-[var(--surface-muted)]/30 text-[var(--muted)] ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 group-hover:ring-[var(--brand)]/30 group-hover:bg-[var(--brand)]/5 group-hover:text-[var(--brand)]'
              }`}
            >
              {isLatest 
                ? <PackageCheck size={18} strokeWidth={2} /> 
                : <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${isLatest ? 'bg-[var(--surface)]' : 'bg-[var(--border)]/60 dark:bg-[var(--border)]/80 group-hover:bg-[var(--brand)]/50'}`} />
              }
            </div>
            
            {/* Event Content */}
            <div className={`flex-1 pt-0.5 sm:pt-1 transition-opacity duration-500 ${isLatest ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                <div className="flex-1">
                  <h4 className="font-body text-sm font-bold text-[var(--text)] tracking-tight group-hover:text-[var(--brand)] transition-colors">{event.title}</h4>
                  <p className="font-body text-[11px] font-medium text-[var(--sub)] mt-1 max-w-md leading-relaxed">{event.description}</p>
                  
                  {/* Courier Tracking Block */}
                  {(event.status === 'Shipped' || event.status === 'Out for Delivery' || event.status.includes('Return') || event.status.includes('RTO')) && courierDetails?.trackingId && (
                    <div className="mt-4 p-4 sm:p-5 bg-[var(--surface)] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 rounded-[1.25rem] inline-block shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-500">
                        <p className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] mb-2.5">
                          Logistics Partner: <span className="text-[var(--text)] ml-1">{courierDetails.courierName || 'Shiprocket'}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                          <p className="font-body text-xs sm:text-sm font-medium text-[var(--text)] tracking-tight">
                            AWB: <span className="text-[var(--brand)] font-bold ml-1">{courierDetails.trackingId}</span>
                          </p>
                          <a 
                            href={`https://shiprocket.co/tracking/${courierDetails.trackingId}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--brand)] hover:text-[var(--text)] bg-[var(--brand)]/5 hover:bg-[var(--surface-muted)] px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ring-1 ring-[var(--brand)]/20 hover:ring-[var(--border)]/50 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Live Tracking <LinkIcon size={12} strokeWidth={2.5} />
                          </a>
                        </div>
                    </div>
                  )}
                </div>
                
                {/* Date & Time */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 mt-2 sm:mt-0">
                  <div className="flex items-center gap-1.5 font-body text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">
                    <Calendar size={12} strokeWidth={2} />
                    <span>{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="hidden sm:block w-4 h-px bg-[var(--border)]/30 dark:bg-[var(--border)]/60"></div>
                  <div className="flex items-center gap-1.5 font-body text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">
                    <Clock size={12} strokeWidth={2} />
                    <span>{dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
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