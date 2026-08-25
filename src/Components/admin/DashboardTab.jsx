import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Calendar, TrendingUp, DollarSign, ShoppingBag, PieChart, Users, Repeat, Percent, ArrowDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Hooks & Components
import { useDashboardData } from '../../features/admin/hooks/useDashboardData';
import { StatCard } from '../../features/admin/components/dashboard/StatCard';
import AttentionRequired from './dashboard/AttentionRequired';
import SalesPerformanceChart from './dashboard/SalesPerformanceChart';
import OrderHealth from './dashboard/OrderHealth';
import CustomerSnapshot from './dashboard/CustomerSnapshot';
import InventoryHealth from './dashboard/InventoryHealth';
import CartRecovery from './dashboard/CartRecovery';
import QuickActions from './dashboard/QuickActions';
import TopProducts from './dashboard/TopProducts';
import GeoDistribution from './dashboard/GeoDistribution';
import LiveActivityFeed from './dashboard/LiveActivityFeed';

// Cinematic, premium staggered entrances
const containerVariants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { staggerChildren: 0.05, delayChildren: 0.1 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: '7 Days' },
  { value: 'month', label: '30 Days' },
  { value: '3months', label: '90 Days' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

const DashboardTab = ({ setActiveTab }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  const { dashboardData, attentionData, isLoading, isAttentionLoading, refreshAll, isFetching } = useDashboardData(
    timeRange,
    customStartDate?.toISOString(),
    customEndDate?.toISOString()
  );

  const handleRefresh = () => refreshAll();
  const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
  const fmtNum = (v) => Math.round(v).toLocaleString('en-IN');
  const hasTrend = dashboardData?.hasTrend;

  return (
    <div className="space-y-8 pb-16 max-w-[1600px] mx-auto pt-10 sm:pt-14 lg:pt-16 px-6 sm:px-12 lg:px-16 transition-colors duration-700 ease-in-out">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-5xl font-display font-medium text-[var(--text)] tracking-tighter drop-shadow-sm">Overview</h1>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-[var(--sub)] font-body text-sm tracking-wide">Business performance at a glance</p>
            {dashboardData?.comparisonLabel && (
              <span className="text-[10px] px-3 py-1 rounded-full bg-[var(--surface)] ring-1 ring-[var(--border)]/50 font-bold text-[var(--text)] uppercase tracking-widest shadow-sm">
                {dashboardData.comparisonLabel}
              </span>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} 
          className="flex flex-wrap items-center gap-3 bg-[var(--surface)]/60 backdrop-blur-xl p-2 rounded-[2rem] ring-1 ring-[var(--border)]/30 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
        >
          <AnimatePresence mode="popLayout">
            {timeRange === 'custom' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2 overflow-hidden bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.5rem] p-1 shadow-inner"
              >
                <div className="relative group">
                  <DatePicker
                    selected={customStartDate}
                    onChange={setCustomStartDate}
                    selectsStart
                    startDate={customStartDate}
                    endDate={customEndDate}
                    placeholderText="Start"
                    className="w-28 pl-9 pr-3 py-2 text-xs font-body font-bold bg-transparent border-none focus:ring-0 text-[var(--text)] outline-none"
                  />
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] group-hover:text-[var(--brand)] transition-colors" />
                </div>
                <div className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                <div className="relative group">
                  <DatePicker
                    selected={customEndDate}
                    onChange={setCustomEndDate}
                    selectsEnd
                    startDate={customStartDate}
                    endDate={customEndDate}
                    minDate={customStartDate}
                    placeholderText="End"
                    className="w-28 pl-9 pr-3 py-2 text-xs font-body font-bold bg-transparent border-none focus:ring-0 text-[var(--text)] outline-none"
                  />
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] group-hover:text-[var(--brand)] transition-colors" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.5rem] p-1.5 flex items-center shadow-inner overflow-x-auto hide-scrollbar max-w-[600px]">
            {RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-[1rem] text-[11px] font-bold font-body transition-all duration-500 ease-out whitespace-nowrap ${
                  timeRange === range.value
                    ? 'bg-[var(--text)] text-[var(--surface)] shadow-md scale-100'
                    : 'text-[var(--sub)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] scale-95 hover:scale-100'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-3.5 rounded-[1.5rem] ring-1 ring-[var(--border)]/40 bg-[var(--surface)] text-[var(--sub)] hover:text-[var(--text)] hover:shadow-lg transition-all duration-500 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw size={16} strokeWidth={2.5} className={isFetching ? "animate-spin text-[var(--brand)]" : "group-hover:rotate-180 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"} />
          </motion.button>
        </motion.div>
      </div>

      {/* 2. KPI CARDS */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6"
      >
        <motion.div variants={itemVariants}>
          <StatCard title="Total Revenue" value={dashboardData ? fmt(dashboardData.revenue) : 0} trend={hasTrend ? dashboardData?.revenueTrend : null} icon={DollarSign} color="success" isLoading={isLoading} subtext="Realized gross revenue from all successful transactions." />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Net Profit" value={dashboardData ? fmt(dashboardData.profit) : 0} trend={hasTrend ? dashboardData?.profitTrend : null} icon={TrendingUp} color="brand" isLoading={isLoading} subtext="Estimated gross profit margin after base product costs." />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Total Orders" value={dashboardData ? fmtNum(dashboardData.successOrdersCount) : 0} trend={hasTrend ? dashboardData?.successTrend : null} icon={ShoppingBag} color="info" isLoading={isLoading} subtext="Total successful orders fulfilled or awaiting fulfillment." />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Average Order Value" value={dashboardData ? fmt(dashboardData.aov) : 0} trend={hasTrend ? dashboardData?.aovTrend : null} icon={PieChart} color="accent" isLoading={isLoading} subtext="Average cart value for all completed transactions." />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="New Customers" value={dashboardData ? fmtNum(dashboardData.newCustomers) : 0} trend={hasTrend ? dashboardData?.customerTrend : null} icon={Users} color="brand" isLoading={isLoading} subtext="Unique first-time buyers acquired during this period." />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Returning Customers" value={dashboardData ? fmtNum(dashboardData.returningCustomers) : 0} trend={hasTrend ? dashboardData?.returningCustomersTrend : null} icon={Repeat} color="success" isLoading={isLoading} subtext="Existing customers who made a repeat purchase." />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Conversion Rate" value={dashboardData ? `${dashboardData.conversionRate.toFixed(1)}%` : '0%'} trend={hasTrend ? dashboardData?.conversionTrend : null} icon={Percent} color="warning" isLoading={isLoading} subtext="Percentage of checkouts that resulted in a paid order." />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Refunds Processed" value={dashboardData ? fmt(dashboardData.totalRefundsProcessed) : 0} trend={hasTrend ? dashboardData?.refundsTrend : null} icon={ArrowDown} color="error" isLoading={isLoading} reverseTrendColors subtext="Total value returned to customers for cancelled or returned orders." />
        </motion.div>
      </motion.div>

      {/* 3. ATTENTION REQUIRED */}
      <AttentionRequired attentionData={attentionData} isLoading={isAttentionLoading} setActiveTab={setActiveTab} />

      {/* 4. SALES PERFORMANCE */}
      <SalesPerformanceChart chartData={dashboardData?.chartData} hasTrend={hasTrend} comparisonLabel={dashboardData?.comparisonLabel} timeRange={timeRange} />

      {/* 5. ORDER HEALTH & CUSTOMERS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
        <OrderHealth orderHealth={dashboardData?.orderHealth} isLoading={isLoading} setActiveTab={setActiveTab} />
        <CustomerSnapshot dashboardData={dashboardData} isLoading={isLoading} />
      </div>

      {/* 6. PRODUCTS & CART */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
        <InventoryHealth dashboardData={dashboardData} isLoading={isLoading} setActiveTab={setActiveTab} />
        <CartRecovery dashboardData={dashboardData} isLoading={isLoading} setActiveTab={setActiveTab} />
      </div>

      {/* 7. TOP PRODUCTS & MARKETS */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 xl:gap-6">
        <TopProducts topProductsByVolume={dashboardData?.topProductsByVolume} topProductsByRevenue={dashboardData?.topProductsByRevenue} setActiveTab={setActiveTab} />
        <GeoDistribution geoDistribution={dashboardData?.geoDistribution} setActiveTab={setActiveTab} />
      </div>

      {/* 8. RECENT ACTIVITY & QUICK ACTIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 xl:gap-6">
        <LiveActivityFeed activities={dashboardData?.recentActivity} setActiveTab={setActiveTab} />
        <QuickActions setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default DashboardTab;
