import React, { useMemo } from 'react';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, Activity, 
  CreditCard, Package, AlertCircle 
} from 'lucide-react';
import { Line, Pie } from 'react-chartjs-2';
import OrderChart from './OrderChart';

// --- SALES CHART ---
const SalesChart = ({ orders }) => {
  const salesData = useMemo(() => {
    // Group by Date
    const grouped = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + order.totalAmount;
      return acc;
    }, {});

    const labels = Object.keys(grouped);
    const data = Object.values(grouped);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue (₹)',
          data,
          fill: true,
          backgroundColor: 'rgba(79, 70, 229, 0.1)', // Indigo-500 with opacity
          borderColor: '#4F46E5', // Indigo-600
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#4F46E5',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [orders]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1F2937',
        titleColor: '#F3F4F6',
        bodyColor: '#F3F4F6',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#F3F4F6' },
        ticks: { callback: (value) => `₹${value}` },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="bg-white p-6 rounded-2xl  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] h-96 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-indigo-600" size={20} /> Sales Trend
        </h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Last 30 Days</span>
      </div>
      <div className="flex-1 relative min-h-0 w-full">
        <Line data={salesData} options={options} updateMode="resize" />
      </div>
    </div>
  );
};

// --- CUSTOMER RETENTION CHART ---
const CustomerRetentionChart = ({ newCustomers, returningCustomers }) => {
  const data = {
    labels: ['New', 'Returning'],
    datasets: [
      {
        data: [newCustomers, returningCustomers],
        backgroundColor: ['#10B981', '#3B82F6'], // Emerald & Blue
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
    },
    cutout: '70%', // Donut Style
  };

  return (
    <div className="bg-white p-6 rounded-2xl  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] h-96 flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Users className="text-blue-600" size={20} /> Customer Mix
      </h3>
      <div className="flex-1 relative min-h-0 flex items-center justify-center">
        {(newCustomers === 0 && returningCustomers === 0) ? (
          <div className="text-gray-400 text-sm text-center">No customer data yet</div>
        ) : (
          <Pie data={data} options={options} updateMode="resize" />
        )}
      </div>
    </div>
  );
};

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => (
  <div className="bg-white p-5 rounded-2xl  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={22} />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h4 className="text-2xl font-extrabold text-gray-900">{value}</h4>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  </div>
);

// --- MAIN DASHBOARD COMPONENT ---
const DashboardTab = ({ 
  orders, successfulOrders, totalRevenue, totalOrders, conversionRate, 
  averageOrderValue, newCustomers, returningCustomers, cancelledOrdersValue, totalQueries 
}) => {
  
  // Calculate Profit (Assuming 30% Margin for Demo if costPrice is missing)
  const estimatedProfit = useMemo(() => {
    return successfulOrders.reduce((acc, order) => {
        // If products have costPrice, use it. Else assume 30% margin.
        const orderCost = order.products?.reduce((sum, p) => sum + ((p.costPrice || p.price * 0.7) * p.quantity), 0) || (order.totalAmount * 0.7);
        return acc + (order.totalAmount - orderCost);
    }, 0);
  }, [successfulOrders]);

  const profitMargin = totalRevenue > 0 ? ((estimatedProfit / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 sm:p-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Executive Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time overview of your store's performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-sm font-medium text-gray-600">
          <Activity size={16} className="text-green-500 animate-pulse" /> Live Updates
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${totalRevenue?.toLocaleString()}`} 
          icon={DollarSign} 
          colorClass="bg-indigo-50 text-indigo-600" 
          subtext="Gross sales volume"
        />
        <StatCard 
          title="Net Profit (Est.)" 
          value={`₹${estimatedProfit?.toLocaleString()}`} 
          icon={TrendingUp} 
          colorClass="bg-emerald-50 text-emerald-600" 
          trend={profitMargin}
          subtext={`${profitMargin}% Margin`}
        />
        <StatCard 
          title="Total Orders" 
          value={totalOrders} 
          icon={ShoppingBag} 
          colorClass="bg-blue-50 text-blue-600" 
          subtext={`${successfulOrders?.length} Successful`}
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`₹${averageOrderValue?.toFixed(0)}`} 
          icon={CreditCard} 
          colorClass="bg-purple-50 text-purple-600" 
          subtext="Per successful transaction"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="New Customers" 
          value={newCustomers} 
          icon={Users} 
          colorClass="bg-teal-50 text-teal-600" 
        />
        <StatCard 
          title="Returning Rate" 
          value={`${returningCustomers > 0 ? ((returningCustomers / (newCustomers + returningCustomers)) * 100).toFixed(1) : 0}%`} 
          icon={Activity} 
          colorClass="bg-cyan-50 text-cyan-600" 
          subtext={`${returningCustomers} Loyal Customers`}
        />
        <StatCard 
          title="Lost Revenue" 
          value={`₹${cancelledOrdersValue?.toLocaleString()}`} 
          icon={AlertCircle} 
          colorClass="bg-rose-50 text-rose-600" 
          subtext="From cancelled orders"
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${conversionRate.toFixed(2)}%`} 
          icon={Package} 
          colorClass="bg-amber-50 text-amber-600" 
          subtext="Visitors to Buyers"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SalesChart orders={successfulOrders} />
        </div>
        <div className="lg:col-span-1">
          <CustomerRetentionChart newCustomers={newCustomers} returningCustomers={returningCustomers} />
        </div>
      </div>

      {/* Order Volume Chart */}
      <div className="bg-white p-6 rounded-2xl  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
        <OrderChart orders={orders} />
      </div>

    </div>
  );
};

export default DashboardTab;