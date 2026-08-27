import React from 'react';

const OrderStatusBadge = ({ status }) => {
  const normalizedStatus = (status || "").toLowerCase();
  
  // Luxury Palette using refined rings and soft tinted backgrounds
  const styles = {
    "delivered": "bg-[var(--success)]/10 text-[var(--success)] ring-[var(--success)]/20",
    "shipped": "bg-[var(--brand)]/5 text-[var(--brand)] ring-[var(--brand)]/20",
    "out for delivery": "bg-[var(--brand)]/10 text-[var(--brand)] ring-[var(--brand)]/30",
    "packed": "bg-[var(--surface-muted)] text-[var(--text)] ring-[var(--border)]/50",
    "processing": "bg-[var(--warning)]/10 text-[var(--warning)] ring-[var(--warning)]/20",
    "order cancelled": "bg-[var(--error)]/10 text-[var(--error)] ring-[var(--error)]/20",
    "order placed": "bg-[var(--surface)] text-[var(--muted)] ring-[var(--border)]/40",
    "pending_payment": "bg-[var(--accent)]/10 text-[var(--accent)] ring-[var(--accent)]/20",
    "payment_pending": "bg-[var(--accent)]/10 text-[var(--accent)] ring-[var(--accent)]/20",
    "return initiated": "bg-[var(--error)]/5 text-[var(--error)] ring-[var(--error)]/20",
    "returned": "bg-[var(--surface-muted)] text-[var(--sub)] ring-[var(--border)]/50",
    "rto initiated": "bg-[var(--error)]/10 text-[var(--error)] ring-[var(--error)]/20",
  };
  
  let styleClass = styles["order placed"];
  if (styles[normalizedStatus]) styleClass = styles[normalizedStatus];
  else if (normalizedStatus.includes('pending')) styleClass = styles["pending_payment"];
  else if (normalizedStatus.includes('return') || normalizedStatus.includes('rto')) styleClass = styles["return initiated"];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 font-body text-[8px] font-bold uppercase tracking-widest whitespace-nowrap rounded ring-1 transition-colors duration-300 ${styleClass}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

export default OrderStatusBadge;