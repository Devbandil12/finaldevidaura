import React from 'react';

const OrderStatusBadge = ({ status }) => {
  const normalizedStatus = (status || "").toLowerCase();
  
  const styles = {
    "delivered": "bg-[var(--surface)] text-[var(--success)] border-[var(--border)]",
    "shipped": "bg-[var(--accent-soft)] text-[var(--brand)] border-transparent",
    "out for delivery": "bg-[var(--surface-muted)] text-[var(--brand)] border-[var(--border)]",
    "packed": "bg-[var(--surface-muted)] text-[var(--text)] border-transparent",
    "processing": "bg-[var(--surface)] text-[var(--sub)] border-[var(--border)]",
    "order cancelled": "bg-[var(--surface)] text-[var(--error)] border-[var(--border)]",
    "order placed": "bg-[var(--surface-muted)] text-[var(--muted)] border-transparent",
    "pending_payment": "bg-[var(--surface)] text-[var(--accent)] border-[var(--border)]",
    "payment_pending": "bg-[var(--surface)] text-[var(--accent)] border-[var(--border)]",
    "return initiated": "bg-[var(--surface)] text-[var(--error)] border-[var(--border)]",
    "returned": "bg-[var(--surface)] text-[var(--success)] border-[var(--border)]",
    "rto initiated": "bg-[var(--surface)] text-[var(--error)] border-[var(--border)]",
  };
  
  let styleClass = styles["order placed"];
  if (styles[normalizedStatus]) styleClass = styles[normalizedStatus];
  else if (normalizedStatus.includes('pending')) styleClass = styles["pending_payment"];
  else if (normalizedStatus.includes('return') || normalizedStatus.includes('rto')) styleClass = styles["return initiated"];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-widest whitespace-nowrap rounded-md border transition-colors duration-300 ${styleClass}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

export default OrderStatusBadge;