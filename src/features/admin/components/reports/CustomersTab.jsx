import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const CustomersTab = ({ customerData = [] }) => {
  const vipCount = customerData.filter(c => c.totalSpent > 5000).length;
  const regularCount = customerData.filter(c => c.totalSpent <= 5000 && c.orders > 1).length;
  const newCount = customerData.filter(c => c.orders === 1).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20">
      
      {/* Chart Section */}
      <div className="bg-[var(--surface)] p-6 md:p-8 rounded-3xl border border-[var(--border)] shadow-[var(--shadow)] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
         
         <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-48 w-48 relative">
              <Doughnut 
                data={{
                  labels: ['VIP (>5k)', 'Regular', 'New'],
                  datasets: [{
                     data: [vipCount, regularCount, newCount],
                     backgroundColor: [
                       'var(--brand)', 
                       'var(--accent)', 
                       'var(--muted)'
                     ],
                     borderWidth: 0,
                     hoverOffset: 4
                  }]
                }}
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
            <div className="text-center sm:text-left">
                <h4 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight mb-1">Customer Segments</h4>
                <p className="font-body text-xs font-bold text-[var(--muted)] uppercase tracking-wider max-w-[180px]">Based on Lifetime Value (LTV) and order frequency.</p>
            </div>
         </div>

         {/* Summary Metric Pills */}
         <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] text-center shadow-sm">
               <p className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">VIP</p>
               <h3 className="font-body font-bold text-2xl text-[var(--text)]">{vipCount}</h3>
            </div>
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] text-center shadow-sm">
               <p className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">Regular</p>
               <h3 className="font-body font-bold text-2xl text-[var(--text)]">{regularCount}</h3>
            </div>
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] text-center shadow-sm">
               <p className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">New</p>
               <h3 className="font-body font-bold text-2xl text-[var(--text)]">{newCount}</h3>
            </div>
         </div>
      </div>

      {/* Customers Table Section */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
          <h4 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Customer Directory</h4>
          <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--text)] bg-[var(--surface)] px-3 py-1 rounded-md border border-[var(--border)] shadow-sm">
            Showing Top {Math.min(customerData.length, 50)} Customers
          </span>
        </div>

        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left text-sm min-w-[750px] border-collapse">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4 text-right">LTV (Total Spent)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {customerData.slice(0, 50).map((c, i) => (
                <tr key={i} className="hover:bg-[var(--surface)] transition-colors duration-300 group cursor-default">
                  <td className="px-6 py-4 font-body font-bold text-[var(--text)] text-sm tracking-wide group-hover:text-[var(--brand)] transition-colors">{c.name}</td>
                  <td className="px-6 py-4 font-body text-xs font-bold text-[var(--sub)] truncate max-w-[200px]">{c.email}</td>
                  <td className="px-6 py-4 font-body text-xs font-bold text-[var(--muted)]">{new Date(c.lastOrder).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-6 py-4 font-body font-bold text-[var(--text)]">{c.orders}</td>
                  <td className="px-6 py-4 text-right font-body font-bold text-[var(--brand)] text-sm tracking-tight">₹{c.totalSpent.toLocaleString()}</td>
                </tr>
              ))}
              {customerData.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center font-display italic text-xl text-[var(--sub)] tracking-wide">
                    No customer data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomersTab;