import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesTab = ({ salesData = [] }) => {
  const totalRevenue = salesData.reduce((a, b) => a + (b.revenue || 0), 0);
  const totalProfit = salesData.reduce((a, b) => a + (b.profit || 0), 0);
  const avgDailySales = salesData.length ? (totalRevenue / salesData.length).toFixed(0) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20">
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
         {/* Revenue Card */}
         <div className="p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] hover:border-[var(--border)] transition-all duration-300 group cursor-default">
           <p className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 group-hover:text-[var(--brand)] transition-colors">Total Period Revenue</p>
           <h3 className="font-body font-bold text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
             ₹{totalRevenue.toLocaleString()}
           </h3>
         </div>

         {/* Profit Card */}
         <div className="p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] hover:border-[var(--border)] transition-all duration-300 group cursor-default">
           <p className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 group-hover:text-[var(--success)] transition-colors">Total Profit</p>
           <h3 className="font-body font-bold text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
             ₹{totalProfit.toLocaleString()}
           </h3>
         </div>

         {/* Avg Daily Sales Card */}
         <div className="p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] hover:border-[var(--border)] transition-all duration-300 group cursor-default">
           <p className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 group-hover:text-[var(--brand)] transition-colors">Avg. Daily Sales</p>
           <h3 className="font-body font-bold text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
             ₹{Number(avgDailySales).toLocaleString()}
           </h3>
         </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[var(--surface)] p-6 md:p-8 rounded-3xl border border-[var(--border)] shadow-[var(--shadow)]">
        <h4 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight mb-6">Revenue Overview (Last 14 Days)</h4>
        <div className="h-80 w-full">
            <Bar 
              data={{
                labels: salesData.slice(-14).map(d => d.date),
                datasets: [
                  {
                    label: 'Revenue',
                    data: salesData.slice(-14).map(d => d.revenue),
                    backgroundColor: 'var(--brand)',
                    borderRadius: 6,
                    barThickness: 'flex',
                  }
                ]
              }}
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: {
                  legend: { display: false }
                },
                scales: { 
                  x: { 
                    grid: { display: false },
                    ticks: { color: 'var(--muted)', font: { family: 'Manrope', size: 10 } }
                  },
                  y: {
                    grid: { color: 'var(--border)' },
                    ticks: { color: 'var(--muted)', font: { family: 'Manrope', size: 10 } }
                  }
                } 
              }}
            />
        </div>
      </div>

      {/* Sales Table Section */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-[var(--surface)] border-b border-[var(--border)]">
          <h4 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Daily Breakdown</h4>
        </div>
        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left text-sm min-w-[700px] border-collapse">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[...salesData].reverse().map((day, i) => (
                <tr key={i} className="hover:bg-[var(--surface)] transition-colors duration-300 group cursor-default">
                  <td className="px-6 py-4 font-body font-bold text-[var(--text)] text-sm tracking-wide group-hover:text-[var(--brand)] transition-colors">{day.date}</td>
                  <td className="px-6 py-4 font-body font-bold text-[var(--sub)] text-sm">{day.orders}</td>
                  <td className="px-6 py-4 font-body font-bold text-[var(--text)] text-sm tracking-tight">₹{day.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-body font-bold text-[var(--success)] text-sm tracking-tight">₹{day.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
              {salesData.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center font-display italic text-xl text-[var(--sub)] tracking-wide">
                    No sales data available.
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

export default SalesTab;