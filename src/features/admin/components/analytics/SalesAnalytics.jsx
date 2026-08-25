import React from 'react';
import { 
  IndianRupee, 
  ShoppingCart, 
  TrendingUp, 
  Activity, 
  Wallet,
  XCircle,
  Tag
} from 'lucide-react';
import { useSalesAnalytics } from '../../hooks/useAnalytics';
import { StatCard } from '../dashboard/StatCard';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-lg shadow-[var(--shadow-strong)] font-body text-sm">
        <p className="font-bold text-[var(--text)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4 font-medium">
            <span>{entry.name}:</span>
            <span>
              {entry.name === 'Revenue' || entry.name === 'Profit' ? '₹' : ''}
              {Number(entry.value).toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SalesAnalytics = ({ timeRange, startDate, endDate }) => {
  const { data, isLoading, error } = useSalesAnalytics(timeRange, startDate, endDate);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--sub)] font-body animate-pulse">Aggregating Sales Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-[var(--error)] font-body bg-[var(--error-light)] rounded-xl m-6">
        <h3 className="font-bold mb-2">Error Loading Analytics</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  const { kpis, chartData, tableData, hasTrend, comparisonLabel } = data || {};

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 animate-fadeIn">
      
      {/* ─── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${(kpis?.revenue || 0).toLocaleString()}`} 
          subtext={`Gross collected revenue ${comparisonLabel}`}
          icon={IndianRupee} 
          trend={hasTrend ? kpis?.revenueTrend : null}
          color="brand"
        />
        <StatCard 
          title="Net Profit" 
          value={`₹${(kpis?.profit || 0).toLocaleString()}`} 
          subtext={`Revenue minus COGS ${comparisonLabel}`}
          icon={TrendingUp} 
          trend={hasTrend ? kpis?.profitTrend : null}
          color="success"
        />
        <StatCard 
          title="Total Orders" 
          value={(kpis?.orders || 0).toLocaleString()} 
          subtext={`Paid & completed orders ${comparisonLabel}`}
          icon={ShoppingCart} 
          trend={hasTrend ? kpis?.ordersTrend : null}
          color="amber"
        />
        <StatCard 
          title="Avg Order Value (AOV)" 
          value={`₹${(kpis?.aov || 0).toLocaleString(undefined, {maximumFractionDigits:0})}`} 
          subtext={`Average spend per order ${comparisonLabel}`}
          icon={Activity} 
          trend={hasTrend ? kpis?.aovTrend : null}
          color="sub"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title="Total Discounts Given" 
          value={`₹${(kpis?.discounts || 0).toLocaleString()}`} 
          subtext={`Coupons & offers ${comparisonLabel}`}
          icon={Tag} 
          trend={hasTrend ? kpis?.discountsTrend : null}
          color="accent"
        />
        <StatCard 
          title="Total Refunds" 
          value={`₹${(kpis?.refunds || 0).toLocaleString()}`} 
          subtext={`Processed refunds ${comparisonLabel}`}
          icon={Wallet} 
          trend={hasTrend ? kpis?.refundsTrend : null}
          color="error"
        />
        <StatCard 
          title="Cancellation Rate" 
          value={`${(kpis?.cancellationRate || 0).toFixed(1)}%`} 
          subtext={`Of total attempted orders`}
          icon={XCircle} 
          trend={null}
          color="muted"
        />
      </div>

      {/* ─── CHART ──────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)] p-6">
        <h3 className="font-display font-medium text-lg text-[var(--text)] mb-6">Revenue vs Orders Trend</h3>
        {chartData && chartData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--sub)', fontSize: 12 }} 
                  dy={10} 
                  minTickGap={30}
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--sub)', fontSize: 12 }} 
                  tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--sub)', fontSize: 12 }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="var(--brand)" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="var(--accent)" strokeWidth={3} dot={{r:3, strokeWidth:2}} activeDot={{r:5}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-[var(--muted)] font-body">
            No trend data available for this period.
          </div>
        )}
      </div>

      {/* ─── TABLE ──────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border)]">
          <h3 className="font-display font-medium text-lg text-[var(--text)]">Recent Completed Orders</h3>
        </div>
        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left font-body text-sm">
            <thead className="bg-[var(--surface)] text-[var(--sub)] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tableData && tableData.length > 0 ? tableData.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--surface)] transition-colors">
                  <td className="px-5 py-4 font-medium text-[var(--text)]">{order.id}</td>
                  <td className="px-5 py-4 text-[var(--sub)]">
                    {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-4 font-bold text-[var(--text)] text-right">
                    ₹{Number(order.revenue).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-muted)] text-[var(--sub)]">
                      {order.paymentMode}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-[var(--success)] font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></div>
                      {order.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-[var(--muted)]">No orders found in this period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default SalesAnalytics;
