import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  IndianRupee,
  Clock,
  Loader,
  Box,
  AlertTriangle,
  RotateCcw,
  CreditCard
} from 'lucide-react';
import { useOrderSummary } from '../../hooks/useAdmin';

const KPICard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="bg-[var(--surface)] p-5 rounded-[1.5rem] border border-[var(--border)]/30 dark:border-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group flex items-center justify-between"
  >
    <div>
      <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1.5">
        {title}
      </p>
      {/* Exclusively font-body font-medium for numbers */}
      <h4 className="font-body text-xl sm:text-2xl font-medium tracking-tight text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">
        {value}
      </h4>
    </div>
    <div className="p-3 rounded-[1rem] shadow-sm transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: `${color}1A`, color }}>
      <Icon size={20} strokeWidth={2} />
    </div>
  </motion.div>
);

const OrderSummaryKPIs = () => {
  const { data: summary, isLoading } = useOrderSummary();

  if (isLoading) {
    return (
      <div className="w-full h-24 bg-[var(--surface-muted)]/30 rounded-[1.5rem] animate-pulse mb-6 border border-[var(--border)]/30 dark:border-[var(--border)]/60 flex items-center justify-center font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">
        Aggregating Metrics...
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-8">
      <KPICard title="Today's Orders" value={summary.todayOrders || 0} icon={Package} color="#3b82f6" delay={0.05} />
      <KPICard title="Today's Revenue" value={`₹${(Number(summary.todayRevenue) || 0).toLocaleString()}`} icon={IndianRupee} color="#10b981" delay={0.1} />
      <KPICard title="Pending Payment" value={summary.pendingPayment || 0} icon={Clock} color="#f59e0b" delay={0.15} />
      <KPICard title="Processing" value={summary.processing || 0} icon={Loader} color="#8b5cf6" delay={0.2} />
      <KPICard title="Ready to Ship" value={summary.readyToShip || 0} icon={Box} color="#ec4899" delay={0.25} />
      <KPICard title="RTO Risk" value={summary.rto || 0} icon={AlertTriangle} color="#ef4444" delay={0.3} />
      <KPICard title="Returns Pending" value={summary.returnsPending || 0} icon={RotateCcw} color="#f97316" delay={0.35} />
      <KPICard title="Refunds Pending" value={summary.refundsPending || 0} icon={CreditCard} color="#ef4444" delay={0.4} />
    </div>
  );
};

export default OrderSummaryKPIs;