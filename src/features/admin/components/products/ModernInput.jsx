import React from 'react';

export const ModernInput = ({ label, name, value, onChange, type = "text", span = "col-span-1" }) => (
  <div className={`${span} font-body group`}>
    <label className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 block ml-1 transition-colors group-focus-within:text-[var(--accent)]">
      {label}
    </label>
    <input 
      name={name} 
      type={type} 
      placeholder={label} 
      value={value} 
      onChange={onChange} 
      className="w-full px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all placeholder-[var(--muted)] shadow-[var(--shadow)]" 
    />
  </div>
);