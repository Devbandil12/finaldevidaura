import React from 'react';
import { Users, UserCheck, UserPlus } from 'lucide-react';
import { useCustomerAnalytics } from '../../hooks/useAnalytics';
import { StatCard } from '../dashboard/StatCard';

const CustomerAnalytics = ({ timeRange, startDate, endDate }) => {
  const { data, isLoading, error } = useCustomerAnalytics(timeRange, startDate, endDate);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--sub)] font-body animate-pulse">Aggregating Customer Data...</p>
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

  const { kpis, topCustomers, hasTrend, comparisonLabel } = data || {};

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 animate-fadeIn">
      
      {/* ─── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title="Active Customers" 
          value={(kpis?.activeCustomers || 0).toLocaleString()} 
          subtext={`Unique customers who purchased ${comparisonLabel}`}
          icon={Users} 
          trend={null}
          color="brand"
        />
        <StatCard 
          title="New Registrations" 
          value={(kpis?.newCustomers || 0).toLocaleString()} 
          subtext={`Accounts created ${comparisonLabel}`}
          icon={UserPlus} 
          trend={null}
          color="accent"
        />
        <StatCard 
          title="Repeat Customers" 
          value={(kpis?.repeatCustomers || 0).toLocaleString()} 
          subtext={`Customers with >1 order all-time`}
          icon={UserCheck} 
          trend={null}
          color="success"
        />
      </div>

      {/* ─── TOP CUSTOMERS TABLE ────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border)]">
          <h3 className="font-display font-medium text-lg text-[var(--text)]">Top Customers by Spend</h3>
        </div>
        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left font-body text-sm">
            <thead className="bg-[var(--surface)] text-[var(--sub)] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Customer Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3 text-center">Orders</th>
                <th className="px-5 py-3 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {topCustomers && topCustomers.length > 0 ? topCustomers.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--surface)] transition-colors">
                  <td className="px-5 py-4 font-medium text-[var(--text)]">{user.name || 'N/A'}</td>
                  <td className="px-5 py-4 text-[var(--sub)]">
                    {user.email || 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-md bg-[var(--surface-muted)] text-[var(--sub)] font-bold text-xs">
                      {user.total_orders}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-[var(--brand)] text-right">
                    ₹{Number(user.total_spent).toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-[var(--muted)]">No customer data found in this period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CustomerAnalytics;
