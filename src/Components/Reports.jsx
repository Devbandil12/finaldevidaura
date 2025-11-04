import React from 'react';
import { FaCrown, FaUserTag, FaTicketAlt, FaChartPie, FaDollarSign } from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';

const Reports = ({ products, users, orders }) => {

  // --- Sales by Category (This is CORRECT) ---
  const salesByCategory = (orders || [])
    .filter(order => order.status !== "Order Cancelled")
    .reduce((acc, order) => {
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach(p => {
          const category = p.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + (p.price * p.quantity);
        });
      }
      return acc;
    }, {});

  const categoryChartData = {
    labels: Object.keys(salesByCategory),
    datasets: [{ data: Object.values(salesByCategory), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }],
  };

  // --- Total Profit Calculation (This is CORRECT) ---
  const totalProfit = (orders || [])
    .filter(order => order.status !== "Order Cancelled" && order.status !== "order placed")
    .reduce((total, order) => {
      if (order.products && Array.isArray(order.products)) {
        const orderProfit = order.products.reduce((sum, p) => {
          const cost = p.costPrice || 0; // costPrice is on the merged product
          return sum + ((p.price - cost) * p.quantity);
        }, 0);
        return total + orderProfit;
      }
      return total;
    }, 0);

  // 🟢 FIXED: Top Selling Products ---
  const topProducts = products
    .map(product => {
      // Calculate total sold by summing up all its variants
      const totalSold = (product.variants || []).reduce((sum, variant) => sum + (variant.sold || 0), 0);
      return {
        ...product,
        totalSold: totalSold, // Add the new calculated property
      };
    })
    .sort((a, b) => b.totalSold - a.totalSold) // Sort by the new property
    .slice(0, 5);

  // --- Top Customers (This is CORRECT) ---
  const customerSpending = (orders || [])
    .filter(order => order.status !== "Order Cancelled")
    .reduce((acc, order) => {
      const userId = order.userId;
      const user = users.find(u => u.id === userId);
      const name = user ? user.name : 'Unknown User';

      if (!acc[userId]) {
        acc[userId] = { name: name, totalSpent: 0 };
      }

      acc[userId].totalSpent += order.totalAmount;
      return acc;
    }, {});

  const topCustomers = Object.entries(customerSpending)
    .sort(([, a], [, b]) => b.totalSpent - a.totalSpent)
    .slice(0, 5)
    .map(([userId, data]) => ({
      id: userId,
      name: data.name,
      totalSpent: data.totalSpent,
    }));

  // --- Most Used Coupons (This is CORRECT) ---
  const couponUsage = (orders || []).reduce((acc, order) => {
    if (order.couponCode) {
      acc[order.couponCode] = (acc[order.couponCode] || 0) + 1;
    }
    return acc;
  }, {});

  const mostUsedCoupons = Object.entries(couponUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Reports & Analytics</h2>

      {/* Reporting Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><FaChartPie className="mr-2 text-green-500" /> Sales by Category</h3>
          <Pie data={categoryChartData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><FaDollarSign className="mr-2 text-yellow-500" /> Total Profit</h3>
          <p className="text-5xl font-bold text-gray-800">₹{totalProfit.toFixed(2)}</p>
          <p className="text-gray-500 mt-2">Based on successful orders</p>
        </div>
      </div>

      {/* Top Performers Section */}
      <div>
        <h2 className="text-3xl font-bold mt-12 mb-4">Top Performers</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center"><FaCrown className="mr-2 text-yellow-500" /> Top Selling Products</h3>
            <ul className="space-y-3">
              {topProducts.map(p => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>{p.name}</span>
                  {/* 🟢 FIXED: Use the new totalSold property */}
                  <span className="font-bold text-green-600">{p.totalSold || 0} sold</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center"><FaUserTag className="mr-2 text-blue-500" /> Top Customers</h3>
            <ul className="space-y-3">
              {topCustomers.map(u => (
                <li key={u.id} className="flex items-center justify-between">
                  <span>{u.name}</span>
                  <span className="font-bold text-indigo-600">₹{u.totalSpent.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center"><FaTicketAlt className="mr-2 text-purple-500" /> Most Used Coupons</h3>
            <ul className="space-y-3">
              {mostUsedCoupons.map(c => (
                <li key={c.code} className="flex items-center justify-between">
                  <span className="font-mono bg-gray-200 px-2 py-1 rounded">{c.code}</span>
                  <span className="font-bold text-red-600">{c.count} times</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;