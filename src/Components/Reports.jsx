import React, { useMemo } from 'react';
import { 
  PieChart, TrendingUp, DollarSign, Package, User, Ticket, Award, BarChart3 
} from 'lucide-react';
import { Pie } from 'react-chartjs-2';

const Reports = ({ products, users, orders }) => {

  const successfulOrders = useMemo(() => orders?.filter(o => o.status !== "Order Cancelled") || [], [orders]);

  // --- 1. Sales By Category ---
  const { salesByCategory, categoryLabels, categoryValues } = useMemo(() => {
    const counts = {};
    successfulOrders.forEach(order => {
      order.products?.forEach(p => {
        const cat = p.category || 'Uncategorized';
        counts[cat] = (counts[cat] || 0) + (p.price * p.quantity);
      });
    });
    return { 
      salesByCategory: counts, 
      categoryLabels: Object.keys(counts), 
      categoryValues: Object.values(counts) 
    };
  }, [successfulOrders]);

  // --- 2. Advanced Profit Metrics ---
  const { totalRevenue, totalCost, netProfit } = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    
    successfulOrders.forEach(order => {
      revenue += order.totalAmount;
      order.products?.forEach(p => {
        // Fallback: If no cost price, assume 70% of sell price is cost (30% margin)
        const unitCost = p.costPrice || (p.price * 0.7); 
        cost += unitCost * p.quantity;
      });
    });

    return { totalRevenue: revenue, totalCost: cost, netProfit: revenue - cost };
  }, [successfulOrders]);

  // --- 3. Top Products (ONLY DELIVERED) ---
  const topProducts = useMemo(() => {
    // 1. Calculate sold counts strictly from Delivered orders
    const deliveredCounts = {};

    orders?.forEach(order => {
      if (order.status === 'Delivered') {
        order.products?.forEach(item => {
          // Identify Product ID (handling backend object spread nuances)
          // We prefer productId if available, otherwise fallback to id
          const pId = item.productId || item.id; 
          deliveredCounts[pId] = (deliveredCounts[pId] || 0) + item.quantity;
        });
      }
    });

    // 2. Map this data to the main products list
    return products
      .map(product => {
        // Get the dynamic delivered count from our map
        const totalSold = deliveredCounts[product.id] || 0;
        return { ...product, totalSold };
      })
      .filter(p => p.totalSold > 0) // Only show products that have actually been delivered
      .sort((a, b) => b.totalSold - a.totalSold) // Sort Highest to Lowest
      .slice(0, 5);
  }, [products, orders]);

  // --- 4. Top Customers (By LTV - Lifetime Value) ---
  const topCustomers = useMemo(() => {
    const spendingMap = {};
    successfulOrders.forEach(order => {
      if (!spendingMap[order.userId]) {
        spendingMap[order.userId] = { 
          name: users.find(u => u.id === order.userId)?.name || 'Guest',
          totalSpent: 0, 
          orderCount: 0 
        };
      }
      spendingMap[order.userId].totalSpent += order.totalAmount;
      spendingMap[order.userId].orderCount += 1;
    });

    return Object.values(spendingMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }, [successfulOrders, users]);

  // --- Charts Data ---
  const pieData = {
    labels: categoryLabels,
    datasets: [{
      data: categoryValues,
      backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      borderWidth: 0,
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } } }
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <BarChart3 className="text-indigo-600" size={32} /> Financial Reports
        </h2>
        <p className="text-sm text-gray-500 mt-1">Deep dive into revenue, profit margins, and inventory performance.</p>
      </div>

      {/* 1. Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Gross Revenue</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-2">₹{totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-indigo-600 font-medium text-sm">
            <DollarSign size={16} /> Total Sales Volume
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Net Profit (Est.)</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">₹{netProfit.toLocaleString()}</h3>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-emerald-700 font-medium text-sm">
            <TrendingUp size={16} /> {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}% Margin
          </div>
        </div>

        {/* Cost of Goods */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Cost of Goods</p>
            <h3 className="text-3xl font-extrabold text-rose-600 mt-2">₹{totalCost.toLocaleString()}</h3>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-rose-700 font-medium text-sm">
            <Package size={16} /> Operational Expense
          </div>
        </div>
      </div>

      {/* 2. Category & Products Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-96 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-purple-600" /> Revenue by Category
          </h3>
          <div className="flex-1 relative min-h-0">
            <Pie data={pieData} options={pieOptions} updateMode="resize" />
          </div>
        </div>

        {/* Top Products Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-96 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award size={20} className="text-amber-500" /> Best Sellers (Delivered)
          </h3>
          <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-lg font-bold text-gray-400 w-6 text-center">#{i+1}</span>
                <img src={(Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl) || "/fallback.png"} alt="" className="w-10 h-10 rounded-lg object-cover bg-white" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                  <p className="text-xs text-gray-500">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{p.totalSold} Sold</p>
                  <p className="text-xs text-green-600 font-medium">Verified</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <Package size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No delivered sales yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Top Customers */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User size={20} className="text-blue-600" /> High Value Customers (LTV)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topCustomers.map((user, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-center hover:border-blue-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mx-auto mb-3 text-lg">
                {user.name.charAt(0)}
              </div>
              <h4 className="font-bold text-gray-900 text-sm truncate">{user.name}</h4>
              <p className="text-xs text-gray-500 mb-2">{user.orderCount} Orders</p>
              <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-green-600">
                ₹{user.totalSpent.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Reports;