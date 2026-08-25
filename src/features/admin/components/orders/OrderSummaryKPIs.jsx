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
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
  >
    <div>
      <p className="text-[11px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">
        {title}
      </p>
      <h4 className="font-display text-2xl font-semibold text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">
        {value}
      </h4>
    </div>
    <div className={`p-3 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}1A`, color }}>
      <Icon size={20} strokeWidth={2} />
    </div>
  </motion.div>
);

const OrderSummaryKPIs = () => {
  const { data: summary, isLoading } = useOrderSummary();

  if (isLoading) {
    return (
      <div className="w-full h-24 bg-[var(--surface-muted)] rounded-xl animate-pulse mb-6 border border-[var(--border)] flex items-center justify-center text-[var(--sub)]">
        Loading Command Center Data...
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
      <KPICard 
        title="Today's Orders" 
        value={summary.todayOrders || 0} 
        icon={Package} 
        color="#3b82f6" 
        delay={0.1} 
      />
      <KPICard 
        title="Today's Revenue" 
        value={`₹${(Number(summary.todayRevenue) || 0).toLocaleString()}`} 
        icon={IndianRupee} 
        color="#10b981" 
        delay={0.2} 
      />
      <KPICard 
        title="Pending Payment" 
        value={summary.pendingPayment || 0} 
        icon={Clock} 
        color="#f59e0b" 
        delay={0.3} 
      />
      <KPICard 
        title="Processing" 
        value={summary.processing || 0} 
        icon={Loader} 
        color="#8b5cf6" 
        delay={0.4} 
      />
      <KPICard 
        title="Ready to Ship" 
        value={summary.readyToShip || 0} 
        icon={Box} 
        color="#ec4899" 
        delay={0.5} 
      />
      <KPICard 
        title="RTO Risk" 
        value={summary.rto || 0} 
        icon={AlertTriangle} 
        color="#ef4444" 
        delay={0.6} 
      />
      <KPICard 
        title="Returns Pending" 
        value={summary.returnsPending || 0} 
        icon={RotateCcw} 
        color="#f97316" 
        delay={0.7} 
      />
      <KPICard 
        title="Refunds Pending" 
        value={summary.refundsPending || 0} 
        icon={CreditCard} 
        color="#ef4444" 
        delay={0.8} 
      />
    </div>
  );
};

export default OrderSummaryKPIs;
