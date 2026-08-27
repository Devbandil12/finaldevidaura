import React from 'react';

export const ModernInput = ({ label, name, value, onChange, type = "text", span = "col-span-1" }) => (
  <div className={`${span} font-body group`}>
    <label className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 block px-1 transition-colors group-focus-within:text-[var(--brand)]">
      {label}
    </label>
    <input 
      name={name} 
      type={type} 
      placeholder={label} 
      value={value} 
      onChange={onChange} 
      className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)]/40 hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:bg-[var(--surface)] focus:border-[var(--brand)]/50 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.03)] transition-all placeholder-[var(--muted)] shadow-[0_2px_8px_rgba(0,0,0,0.02)]" 
    />
  </div>
);