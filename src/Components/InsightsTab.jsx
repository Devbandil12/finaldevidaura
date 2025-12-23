import React, { useMemo, useContext } from 'react';
import { 
  Heart, Star, MapPin, CreditCard, TrendingUp, AlertCircle, 
  ThumbsUp, ThumbsDown, BarChart4 
} from 'lucide-react';
import { Bar, Doughnut, PolarArea } from 'react-chartjs-2';
import { AdminContext } from '../contexts/AdminContext';
import { ProductContext } from '../contexts/productContext';
import { 
  Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend 
} from 'chart.js';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const InsightsTab = () => {
  const { wishlistStats, orders } = useContext(AdminContext);
  const { products } = useContext(ProductContext);

  // --- 1. DEMAND FORECASTING (Wishlist vs Stock) ---
  const demandData = useMemo(() => {
    if (!wishlistStats || !products) return [];
    
    // Merge wishlist count with live product data
    return wishlistStats.map(w => {
      const product = products.find(p => p.variants?.some(v => v.id === w.variantId));
      const variant = product?.variants?.find(v => v.id === w.variantId);
      return {
        name: product?.name || 'Unknown',
        variant: variant?.name || '-',
        wishlistCount: parseInt(w.count) || 0,
        stock: variant?.stock || 0,
        img: product?.imageurl?.[0]
      };
    })
    .sort((a,b) => b.wishlistCount - a.wishlistCount)
    .slice(0, 5); // Top 5
  }, [wishlistStats, products]);

  // --- 2. SENTIMENT ANALYSIS (Reviews) ---
  const sentiment = useMemo(() => {
    if (!products) return { avg: 0, count: 0, distribution: [] };
    
    let totalRating = 0;
    let totalReviews = 0;
    const distribution = { 5:0, 4:0, 3:0, 2:0, 1:0 };

    products.forEach(p => {
      if (p.reviews) {
        p.reviews.forEach(r => {
          totalRating += r.rating;
          totalReviews++;
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });
      }
    });

    return {
      avg: totalReviews ? (totalRating / totalReviews).toFixed(1) : 0,
      count: totalReviews,
      distribution: [distribution[5], distribution[4], distribution[3], distribution[2], distribution[1]]
    };
  }, [products]);

  // --- 3. DEMOGRAPHICS (Cities) ---
  const geoData = useMemo(() => {
    if (!orders) return {};
    const cityMap = {};
    orders.forEach(o => {
      const city = o.shippingAddress?.city || o.address?.city || 'Unknown';
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    // Top 5 Cities
    const sorted = Object.entries(cityMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
      labels: sorted.map(i => i[0]),
      data: sorted.map(i => i[1])
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
          <BarChart4 className="text-purple-600" /> Market Intelligence
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Analyze customer intent, feedback, and demographics.
        </p>
      </div>

      {/* TOP ROW: Sentiment & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sentiment Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="mb-4 p-4 bg-yellow-50 rounded-full text-yellow-500">
            <Star size={32} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-black text-gray-900">{sentiment.avg} / 5.0</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Based on {sentiment.count} verified reviews</p>
          
          {/* Mini Bar Chart for Star Distribution */}
          <div className="w-full mt-6 space-y-2">
             {[5,4,3,2,1].map((star, i) => (
               <div key={star} className="flex items-center gap-2 text-xs">
                 <span className="w-3">{star}</span> <Star size={10} className="text-gray-300" />
                 <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                   <div 
                     className={`h-full ${star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-400' : 'bg-red-500'}`} 
                     style={{ width: `${(sentiment.distribution[i] / (sentiment.count || 1)) * 100}%` }}
                   />
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Wishlist Leaderboard */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
             <Heart className="text-rose-500" /> Most Wanted (Wishlist)
           </h3>
           <div className="space-y-4">
             {demandData.map((item, i) => (
               <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-300 text-lg">#{i+1}</span>
                    <img src={item.img || '/placeholder.png'} className="w-12 h-12 rounded-lg object-cover bg-gray-200" alt="" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.variant}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end font-bold text-rose-600">
                       <Heart size={14} fill="currentColor" /> {item.wishlistCount}
                    </div>
                    {item.stock < 5 && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Low Stock: {item.stock}
                      </span>
                    )}
                  </div>
               </div>
             ))}
             {demandData.length === 0 && <p className="text-center text-gray-400 py-4">No wishlist data yet.</p>}
           </div>
        </div>
      </div>

      {/* BOTTOM ROW: Geographics & Payment Prefs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Cities */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <MapPin className="text-blue-500" /> Top Customer Locations
          </h3>
          <div className="h-64">
             <Bar 
               data={{
                 labels: geoData.labels,
                 datasets: [{
                   label: 'Orders',
                   data: geoData.data,
                   backgroundColor: 'rgba(59, 130, 246, 0.8)',
                   borderRadius: 4
                 }]
               }}
               options={{
                 indexAxis: 'y',
                 responsive: true,
                 maintainAspectRatio: false,
                 plugins: { legend: { display: false } },
                 scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
               }}
             />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CreditCard className="text-indigo-500" /> Payment Preferences
          </h3>
          <div className="flex-1 relative flex items-center justify-center">
             <Doughnut 
               data={{
                 labels: ['Online Payment', 'Cash on Delivery'],
                 datasets: [{
                   data: [
                     orders?.filter(o => o.paymentMode === 'online').length || 0,
                     orders?.filter(o => o.paymentMode === 'cod').length || 0
                   ],
                   backgroundColor: ['#6366f1', '#10b981'],
                   borderWidth: 0
                 }]
               }}
               options={{
                 cutout: '75%',
                 plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }
               }}
             />
          </div>
        </div>

      </div>
    </div>
  );
};

export default InsightsTab;