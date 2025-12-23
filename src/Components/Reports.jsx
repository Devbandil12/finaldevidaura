import React, { useState, useMemo, useContext } from 'react';
import { 
  BarChart3, PieChart, Package, Users, Download, 
  Search, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AdminContext } from '../contexts/AdminContext';
import { ProductContext } from '../contexts/productContext';

const Reports = () => {
  const { reportOrders, users, orders } = useContext(AdminContext);
  const { products } = useContext(ProductContext);
  const [activeTab, setActiveTab] = useState('sales'); // sales, inventory, customers
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. SALES ANALYTICS ENGINE ---
  const salesData = useMemo(() => {
    // Fallback to basic orders if reportOrders (detailed) aren't loaded yet
    const sourceData = (reportOrders && reportOrders.length > 0) ? reportOrders : orders;
    if (!sourceData) return [];

    const dailyMap = {};

    sourceData.forEach(order => {
       // Only count valid sales
       if (order.status === 'Order Cancelled' || order.status === 'pending_payment') return;

       const date = new Date(order.createdAt).toLocaleDateString('en-US');
       
       if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0, profit: 0 };
       
       dailyMap[date].revenue += order.totalAmount;
       dailyMap[date].orders += 1;
       
       // Calculate Cost
       let cost = 0;
       if (order.products) {
          cost = order.products.reduce((sum, p) => sum + ((p.costPrice || p.price * 0.7) * p.quantity), 0);
       } else {
          cost = order.totalAmount * 0.7;
       }
       
       dailyMap[date].profit += (order.totalAmount - cost);
    });

    // Sort by date descending
    return Object.values(dailyMap).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [reportOrders, orders]);

  // --- 2. INVENTORY INTELLIGENCE ---
  const inventoryData = useMemo(() => {
    if (!products) return [];
    return products.flatMap(p => 
      p.variants?.map(v => ({
        id: v.id,
        name: p.name,
        variant: v.name,
        sku: v.sku || 'N/A',
        stock: v.stock,
        sold: v.sold || 0, // Ensure your backend routes/products.js updates 'sold' count on order
        price: v.oprice,
        // Potential revenue sitting in stock
        value: v.stock * v.oprice, 
        // Turnover rate: Sold / (Sold + Stock)
        turnoverRate: (v.sold + v.stock) > 0 ? ((v.sold / (v.stock + v.sold)) * 100).toFixed(1) : 0
      })) || []
    ).sort((a,b) => a.stock - b.stock); // Show lowest stock first
  }, [products]);

  // --- 3. CUSTOMER INSIGHTS ---
  const customerData = useMemo(() => {
    if (!users || !orders) return [];
    
    const userMap = {};
    orders.forEach(order => {
        if (order.status === 'Order Cancelled') return;
        
        if (!userMap[order.userId]) {
            const u = users.find(usr => usr.id === order.userId);
            userMap[order.userId] = {
                id: order.userId,
                name: u?.name || 'Guest/Unknown',
                email: u?.email || 'N/A',
                totalSpent: 0,
                orders: 0,
                lastOrder: order.createdAt,
                city: order.shippingAddress?.city || 'Unknown' // Using shippingAddress from order detail
            };
        }
        userMap[order.userId].totalSpent += order.totalAmount;
        userMap[order.userId].orders += 1;
        
        // Update last seen
        if (new Date(order.createdAt) > new Date(userMap[order.userId].lastOrder)) {
            userMap[order.userId].lastOrder = order.createdAt;
        }
    });

    return Object.values(userMap).sort((a,b) => b.totalSpent - a.totalSpent);
  }, [users, orders]);

  // --- UI COMPONENTS ---
  const TabButton = ({ id, label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
        activeTab === id 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-sans space-y-8 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Exportable data for accounting and inventory management.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* NAVIGATION */}
      <div className="flex flex-wrap gap-3">
        <TabButton id="sales" label="Sales Performance" icon={BarChart3} />
        <TabButton id="inventory" label="Inventory Logic" icon={Package} />
        <TabButton id="customers" label="Customer Insights" icon={Users} />
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[500px] overflow-hidden">
        
        {/* --- SALES TAB --- */}
        {activeTab === 'sales' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                 <p className="text-xs font-bold text-indigo-500 uppercase">Total Period Revenue</p>
                 <h3 className="text-2xl font-black text-indigo-900 mt-1">
                   ₹{salesData.reduce((a,b) => a + b.revenue, 0).toLocaleString()}
                 </h3>
               </div>
               <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                 <p className="text-xs font-bold text-emerald-500 uppercase">Total Profit</p>
                 <h3 className="text-2xl font-black text-emerald-900 mt-1">
                   ₹{salesData.reduce((a,b) => a + b.profit, 0).toLocaleString()}
                 </h3>
               </div>
               <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                 <p className="text-xs font-bold text-blue-500 uppercase">Avg. Daily Sales</p>
                 <h3 className="text-2xl font-black text-blue-900 mt-1">
                   ₹{salesData.length ? (salesData.reduce((a,b) => a + b.revenue, 0) / salesData.length).toFixed(0) : 0}
                 </h3>
               </div>
            </div>

            <div className="h-80 mb-8">
                <Bar 
                  data={{
                    labels: salesData.slice(0, 14).reverse().map(d => d.date), // Last 14 days
                    datasets: [
                      {
                        label: 'Revenue',
                        data: salesData.slice(0, 14).reverse().map(d => d.revenue),
                        backgroundColor: '#4F46E5',
                        borderRadius: 4
                      }
                    ]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } } } }}
                />
            </div>

            {/* Sales Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Date</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesData.map((day, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{day.date}</td>
                      <td className="px-4 py-3">{day.orders}</td>
                      <td className="px-4 py-3">₹{day.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">₹{day.profit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- INVENTORY TAB --- */}
        {activeTab === 'inventory' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search SKU or Product..." 
                   className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                   onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                 />
               </div>
               <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium">
                  Inventory Value: <span className="font-bold">₹{inventoryData.reduce((a,b) => a + b.value, 0).toLocaleString()}</span>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Variant</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Stock Level</th>
                    <th className="px-4 py-3">Turnover Rate</th>
                    <th className="px-4 py-3 text-right">Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryData
                    .filter(i => i.name.toLowerCase().includes(searchTerm) || i.sku.toLowerCase().includes(searchTerm))
                    .map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.variant}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.sku}</td>
                      <td className={`px-4 py-3 font-bold ${item.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {item.stock} Units
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                           <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${Math.min(item.turnoverRate, 100)}%` }}></div>
                           </div>
                           <span className="text-xs">{item.turnoverRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">₹{item.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- CUSTOMERS TAB --- */}
        {activeTab === 'customers' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               {/* Segmentation Chart */}
               <div className="bg-gray-50 p-6 rounded-2xl flex items-center justify-center">
                  <div className="h-40 w-40">
                    <Doughnut 
                      data={{
                        labels: ['VIP (>5k)', 'Regular', 'New'],
                        datasets: [{
                           data: [
                             customerData.filter(c => c.totalSpent > 5000).length,
                             customerData.filter(c => c.totalSpent <= 5000 && c.orders > 1).length,
                             customerData.filter(c => c.orders === 1).length
                           ],
                           backgroundColor: ['#4F46E5', '#3B82F6', '#93C5FD'],
                           borderWidth: 0
                        }]
                      }}
                      options={{ maintainAspectRatio: false }}
                    />
                  </div>
                  <div className="ml-8">
                     <h4 className="font-bold text-gray-900 mb-1">Customer Segments</h4>
                     <p className="text-xs text-gray-500 max-w-[150px]">Based on Lifetime Value (LTV) and order frequency.</p>
                  </div>
               </div>
            </div>

            {/* Top Customers List */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3 text-right">LTV (Total Spent)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerData.slice(0, 50).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.email}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(c.lastOrder).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{c.orders}</td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-600">₹{c.totalSpent.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;