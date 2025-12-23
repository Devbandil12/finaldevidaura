import React, { useState, useMemo, useContext } from 'react';
import { 
  TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Activity, 
  CreditCard, Package, AlertTriangle, Clock, ArrowRight,
  Droplets, RefreshCcw, AlertCircle, UserPlus, Repeat, Ban
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  Title, Tooltip, Legend, ArcElement, BarElement, Filler 
} from 'chart.js';
import { AdminContext } from '../contexts/AdminContext';
import { ProductContext } from '../contexts/productContext';
import { UserContext } from '../contexts/UserContext';
import OrderChart from './OrderChart';

// Register ChartJS components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, 
  Tooltip, Legend, ArcElement, BarElement, Filler
);

// --- HELPER: Date Ranges & Comparison Logic ---
const getDateRange = (range) => {
  const now = new Date();
  const start = new Date();
  const prevStart = new Date();
  const prevEnd = new Date();

  switch (range) {
    case 'today':
      start.setHours(0,0,0,0);
      prevStart.setDate(now.getDate() - 1);
      prevStart.setHours(0,0,0,0);
      prevEnd.setDate(now.getDate() - 1);
      prevEnd.setHours(23,59,59,999);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      prevStart.setDate(now.getDate() - 14);
      prevEnd.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      prevStart.setMonth(now.getMonth() - 2);
      prevEnd.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      prevStart.setFullYear(now.getFullYear() - 2);
      prevEnd.setFullYear(now.getFullYear() - 1);
      break;
    default: // All time
      start.setFullYear(2000); 
  }
  return { current: { start, end: now }, previous: { start: prevStart, end: prevEnd } };
};

const calculateTrend = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// --- COMPONENT: Stat Card ---
const StatCard = ({ title, value, subtext, icon: Icon, trend, color, loading }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      {trend !== null && !isNaN(trend) && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <h4 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h4>
      )}
      {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
    </div>
  </div>
);

const DashboardTab = () => {
  const { orders, reportOrders, abandonedCarts, loading: adminLoading } = useContext(AdminContext);
  const { products, loading: productsLoading } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);
  
  const [timeRange, setTimeRange] = useState('month'); 

  // --- DATA PROCESSING ENGINE ---
  const dashboardData = useMemo(() => {
    if (!orders || !products) return null;

    const { current, previous } = getDateRange(timeRange);

    // Filter Helper
    const filterByDate = (data, start, end) => 
      data.filter(item => {
        const d = new Date(item.createdAt);
        return d >= start && d <= end;
      });

    // 1. Order Segments (Current vs Previous)
    const currentOrders = filterByDate(orders, current.start, current.end);
    const prevOrders = filterByDate(orders, previous.start, previous.end);
    
    // Success Check Logic
    const isSuccessful = (o) => 
      o.status !== 'Order Cancelled' && 
      o.status !== 'pending_payment' && 
      o.status !== 'pending payment' &&
      !(o.paymentMode === 'online' && (o.paymentStatus === 'pending' || o.paymentStatus === 'pending_payment'));

    const successOrders = currentOrders.filter(isSuccessful);
    const prevSuccessOrders = prevOrders.filter(isSuccessful);
    const cancelledOrders = currentOrders.filter(o => o.status === 'Order Cancelled');

    // 2. Financial Metrics
    const calcRevenue = (list) => list.reduce((sum, o) => sum + o.totalAmount, 0);
    const revenue = calcRevenue(successOrders);
    const prevRevenue = calcRevenue(prevSuccessOrders);
    const lostRevenue = calcRevenue(cancelledOrders);
    
    // Profit Calculation (Cost logic or 70% rule)
    const calcProfit = (list) => list.reduce((sum, order) => {
      let orderCost = 0;
      const detailedOrder = reportOrders.find(ro => ro.id === order.id) || order;
      if (detailedOrder.products || detailedOrder.orderItems) {
         const items = detailedOrder.products || detailedOrder.orderItems;
         orderCost = items.reduce((pSum, p) => pSum + ((p.costPrice || p.price * 0.7) * p.quantity), 0);
      } else {
         orderCost = order.totalAmount * 0.7;
      }
      return sum + (order.totalAmount - orderCost);
    }, 0);

    const profit = calcProfit(successOrders);
    const prevProfit = calcProfit(prevSuccessOrders);

    // 3. Customer Metrics (Simplified Logic)
    // In a real app, you'd check user creation date. Here we approximate by unique IDs in success orders.
    const uniqueUserIds = [...new Set(successOrders.map(o => o.userId))];
    // Determine 'New' vs 'Returning' if we had full user history. 
    // Fallback: If they have >1 order ever, they are returning.
    let returningCount = 0;
    let newCount = 0;
    
    uniqueUserIds.forEach(uid => {
        // Check global order history for this user
        const userTotalOrders = orders.filter(o => o.userId === uid).length;
        if (userTotalOrders > 1) returningCount++;
        else newCount++;
    });

    const returningRate = (uniqueUserIds.length > 0) 
        ? ((returningCount / uniqueUserIds.length) * 100) 
        : 0;

    // 4. Inventory Logic
    const lowStockVariants = [];
    products.forEach(p => {
      p.variants?.forEach(v => {
        if (v.stock < 10 && !v.isArchived) {
          lowStockVariants.push({ ...v, productName: p.name, image: p.imageurl?.[0] });
        }
      });
    });

    // 5. Chart Data
    const fragranceStats = {};
    successOrders.forEach(order => {
      const detailedOrder = reportOrders.find(ro => ro.id === order.id) || order;
      const items = detailedOrder.products || detailedOrder.orderItems || [];
      items.forEach(p => {
        const mainProduct = products.find(prod => prod.id === (p.productId || p.id));
        const family = mainProduct?.fragrance || 'Other';
        fragranceStats[family] = (fragranceStats[family] || 0) + 1;
      });
    });

    const chartLabels = [];
    const chartRevenue = [];
    const interval = (current.end - current.start) / (timeRange === 'today' ? 24 : 10);
    const steps = timeRange === 'today' ? 24 : 10;
    
    for(let i=0; i<steps; i++) {
      const pStart = new Date(current.start.getTime() + (interval * i));
      const pEnd = new Date(pStart.getTime() + interval);
      const label = timeRange === 'today' 
        ? pStart.toLocaleTimeString('en-US', { hour: 'numeric' })
        : pStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const chunk = successOrders.filter(o => { const d = new Date(o.createdAt); return d >= pStart && d < pEnd; });
      chartLabels.push(label);
      chartRevenue.push(chunk.reduce((sum, o) => sum + o.totalAmount, 0));
    }

    return {
      revenue, revenueTrend: calculateTrend(revenue, prevRevenue),
      profit, profitTrend: calculateTrend(profit, prevProfit),
      totalOrders: currentOrders.length, 
      successOrdersCount: successOrders.length,
      successTrend: calculateTrend(successOrders.length, prevSuccessOrders.length),
      aov: successOrders.length ? revenue / successOrders.length : 0,
      
      newCustomers: newCount,
      returningCustomers: returningCount,
      returningRate,
      lostRevenue,
      conversionRate: currentOrders.length ? (successOrders.length / currentOrders.length) * 100 : 0, // Order Success Rate

      abandonedVal: abandonedCarts?.reduce((acc, c) => acc + (c.variant?.oprice || 0), 0) || 0,
      lowStockVariants,
      fragranceData: { labels: Object.keys(fragranceStats), data: Object.values(fragranceStats) },
      chartData: { labels: chartLabels, revenue: chartRevenue },
    };
  }, [orders, reportOrders, products, abandonedCarts, timeRange]);

  const isLoading = adminLoading || productsLoading || !dashboardData;

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: { y: { grid: { borderDash: [4, 4], color: '#f3f4f6' }, ticks: { callback: v => '₹' + v } }, x: { grid: { display: false } } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
             <Activity className="text-indigo-600" /> Executive Dashboard
          </h1>
          <p className="text-sm text-gray-500">Real-time performance metrics for {timeRange === 'today' ? "today" : `the last ${timeRange}`}.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {['today', 'week', 'month', 'year'].map((range) => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all capitalize ${timeRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ROW 1: PRIMARY FINANCIALS (Restored Total Orders & AOV) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" value={`₹${dashboardData?.revenue.toLocaleString()}`} 
          trend={dashboardData?.revenueTrend} icon={DollarSign} color="indigo" loading={isLoading}
          subtext="Gross sales volume"
        />
        <StatCard 
          title="Net Profit (Est.)" value={`₹${dashboardData?.profit.toLocaleString()}`} 
          trend={dashboardData?.profitTrend} icon={TrendingUp} color="emerald" loading={isLoading}
          subtext={`${((dashboardData?.profit / (dashboardData?.revenue || 1)) * 100).toFixed(1)}% Margin`}
        />
        <StatCard 
          title="Total Orders" value={dashboardData?.totalOrders} 
          trend={dashboardData?.successTrend} icon={ShoppingBag} color="blue" loading={isLoading}
          subtext={`${dashboardData?.successOrdersCount} Successful`}
        />
        <StatCard 
          title="Avg. Order Value" value={`₹${dashboardData?.aov.toFixed(0)}`} 
          icon={CreditCard} color="purple" loading={isLoading}
          subtext="Per successful transaction"
        />
      </div>

      {/* ROW 2: CUSTOMER & EFFICIENCY METRICS (Restored Extras) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="New Customers" value={dashboardData?.newCustomers} 
          icon={UserPlus} color="teal" loading={isLoading}
        />
        <StatCard 
          title="Returning Rate" value={`${dashboardData?.returningRate.toFixed(1)}%`} 
          icon={Repeat} color="cyan" loading={isLoading}
          subtext={`${dashboardData?.returningCustomers} Loyal Customers`}
        />
        <StatCard 
          title="Lost Revenue" value={`₹${dashboardData?.lostRevenue.toLocaleString()}`} 
          icon={Ban} color="rose" loading={isLoading}
          subtext="From cancelled orders"
        />
        <StatCard 
          title="Conversion Rate" value={`${dashboardData?.conversionRate.toFixed(2)}%`} 
          icon={Package} color="amber" loading={isLoading}
          subtext="Order Success Rate"
        />
      </div>

      {/* ROW 3: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-indigo-500" size={20} /> Sales Trend
            </h3>
            <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md capitalize">{timeRange} view</span>
          </div>
          <div className="h-full pb-8">
             <Line data={{
                 labels: dashboardData?.chartData.labels,
                 datasets: [{
                     label: 'Revenue', data: dashboardData?.chartData.revenue,
                     borderColor: '#4F46E5', backgroundColor: 'rgba(79, 70, 229, 0.1)',
                     fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#fff',
                 }]
               }} options={lineOptions} 
             />
          </div>
        </div>

        {/* Fragrance Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Droplets className="text-pink-500" size={20} /> Fragrance Sales
          </h3>
          <div className="flex-1 relative flex items-center justify-center">
            {dashboardData?.fragranceData.data.length > 0 ? (
              <Doughnut data={{
                  labels: dashboardData?.fragranceData.labels,
                  datasets: [{
                    data: dashboardData?.fragranceData.data,
                    backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'],
                    borderWidth: 0,
                  }]
                }} options={{ cutout: '70%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } }}
              />
            ) : <div className="text-gray-400 text-sm">No fragrance data</div>}
          </div>
        </div>
      </div>

      {/* ROW 4: ALERTS & RECOVERY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} /> Stock Alerts
            </h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{dashboardData?.lowStockVariants.length} Low</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {dashboardData?.lowStockVariants.length === 0 ? (
               <div className="text-center py-8 text-gray-400">Inventory levels are healthy.</div>
            ) : (
              dashboardData?.lowStockVariants.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="flex items-center gap-3">
                    <img src={item.image || '/placeholder.png'} className="w-10 h-10 rounded-lg object-cover bg-white" alt="" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.productName}</h4>
                      <p className="text-xs text-amber-700">{item.name} (Size: {item.size}ml)</p>
                    </div>
                  </div>
                  <div className="text-right"><p className="font-black text-red-600">{item.stock} left</p></div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Abandoned Cart */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <RefreshCcw size={22} className="opacity-80" /> Recovery Potential
              </h3>
              <p className="text-indigo-100 text-sm mt-1">Revenue sitting in abandoned carts.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg"><Clock size={24} /></div>
          </div>
          <div className="flex items-end gap-2 mb-6">
            <h2 className="text-5xl font-black">₹{dashboardData?.abandonedVal.toLocaleString()}</h2>
            <span className="mb-2 font-medium opacity-80">pending</span>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
               View Carts <ArrowRight size={16} />
            </button>
            <div className="bg-white/10 px-4 py-3 rounded-xl flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none">{abandonedCarts?.length || 0}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">Carts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Volume Chart (Original) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Total Order Volume</h3>
        <OrderChart orders={orders} />
      </div>

    </div>
  );
};

export default DashboardTab;