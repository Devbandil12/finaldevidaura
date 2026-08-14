// src/Components/CancellationWindow.jsx
//
// Shows the free-cancellation deadline for an order. Deliberately NOT a
// ticking countdown for most of the window — that's flash-sale language
// ("offer ends in 04:59") and reads as pressure, wrong tone for what's
// meant to be a safety net. Switches to a relative countdown only in the
// final 10 minutes, where urgency is actually useful.
//
// Keep WINDOW_MINUTES in sync with the backend's ORDER_CANCEL_WINDOW_MINUTES
// (services/cron.service.js / controllers/refundController.js). It's not a
// secret, so it's just mirrored here rather than fetched.

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const WINDOW_MINUTES = 60;
const URGENT_THRESHOLD_MINUTES = 10;
export const CANCELLABLE_STATUSES = ["order placed", "processing", "packed"];

export default function CancellationWindow({ createdAt, status, className = "" }) {
  const [now, setNow] = useState(Date.now());
  const normalizedStatus = (status || "").toLowerCase();
  const isCancellable = CANCELLABLE_STATUSES.includes(normalizedStatus);

  const deadline = new Date(createdAt).getTime() + WINDOW_MINUTES * 60 * 1000;
  const msLeft = deadline - now;
  const isUrgent = isCancellable && msLeft > 0 && msLeft <= URGENT_THRESHOLD_MINUTES * 60 * 1000;

  useEffect(() => {
    if (!isUrgent) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isUrgent]);

  if (!isCancellable) {
    // Only worth stating for someone who might have expected otherwise —
    // i.e. an order still fairly fresh but already past 'Order Placed'.
    return (
      <p className={`text-xs text-zinc-400 ${className}`}>
        This order is already being processed and can no longer be cancelled.
      </p>
    );
  }

  if (msLeft <= 0) {
    // Window technically elapsed but the backend cron (runs every 5 min)
    // hasn't flipped the status yet — a brief, honest in-between state.
    return (
      <p className={`text-xs text-amber-600 flex items-center gap-1 ${className}`}>
        <Clock size={12} /> This order is about to move to processing.
      </p>
    );
  }

  if (isUrgent) {
    const minutes = Math.floor(msLeft / 60000);
    const seconds = Math.floor((msLeft % 60000) / 1000);
    return (
      <p className={`text-xs text-amber-600 font-medium flex items-center gap-1 ${className}`}>
        <Clock size={12} /> Cancellation closes in {minutes}:{String(seconds).padStart(2, "0")}
      </p>
    );
  }

  const deadlineText = new Date(deadline).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return (
    <p className={`text-xs text-zinc-400 ${className}`}>
      You can cancel this order free until {deadlineText} today.
    </p>
  );
}
