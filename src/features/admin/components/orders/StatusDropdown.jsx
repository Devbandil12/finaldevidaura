import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const STATUS_SEQUENCE = [
  "Order Placed", 
  "Processing", 
  "Packed", 
  "Shipped", 
  "Out for Delivery", 
  "Delivered", 
  "Return Initiated", 
  "Returned", 
  "RTO Initiated"
];

const StatusDropdown = ({ currentStatus, hasAwb, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (status) => {
    onUpdate(status);
    setIsOpen(false);
  };

  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);

  return (
    <div className="relative font-body" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full sm:min-w-[160px] px-3 py-2 sm:px-4 sm:py-2.5 bg-[var(--surface)] border rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-300 
        ${isOpen ? 'border-[var(--border)] shadow-[var(--shadow)] text-[var(--text)]' : 'border-[var(--border)] hover:border-[var(--border)] text-[var(--sub)] shadow-sm hover:shadow-[var(--shadow)]'}`}
      >
        <span className="truncate mr-2">{currentStatus}</span>
        <ChevronDown size={14} strokeWidth={2} className={`text-[var(--muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--surface)] rounded-xl shadow-[var(--shadow-strong)] z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[var(--border)]">
          <div className="p-1.5 max-h-64 overflow-y-auto custom-scrollbar">
            {STATUS_SEQUENCE.map((status, index) => {
               const requiresAwb = ["Shipped", "Out for Delivery", "Delivered"];
               let isDisabled = index < currentIndex && !status.includes('Return') && !status.includes('RTO'); 
               
               if (requiresAwb.includes(status) && !hasAwb) {
                   isDisabled = true;
               }

               return (
                  <button
                    key={status}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelect(status)}
                    title={requiresAwb.includes(status) && !hasAwb ? "Waiting for Shiprocket to generate AWB" : ""}
                    className={`w-full text-left px-3 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest flex items-center justify-between rounded-lg transition-colors duration-200 
                    ${currentStatus === status ? 'bg-[var(--surface)] text-[var(--brand)]' : ''}
                    ${isDisabled ? 'text-[var(--muted)] opacity-50 cursor-not-allowed' : 'text-[var(--sub)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}
                    `}
                  >
                    {status}
                    {currentStatus === status && <Check size={14} strokeWidth={2.5} className="text-[var(--brand)]" />}
                  </button>
               )
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;