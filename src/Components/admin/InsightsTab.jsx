import React, { useMemo } from 'react';
import { 
  Heart, Star, MapPin, CreditCard, TrendingUp, AlertCircle, 
  BarChart4 
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAdminWishlistStats, useAdminOrders, useAdminFunnelStats, useAdminTopReturnedProducts } from '../../features/admin/hooks/useAdmin';
import { useProducts } from '../../features/catalog/hooks/useProducts';
import { 
  Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title 
} from 'chart.js';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const InsightsTab = () => {
  const { data: wishlistStats = [] } = useAdminWishlistStats();
  const { data: ordersResponse } = useAdminOrders(1, 1000);
  const orders = ordersResponse?.data || [];
  const { data: products = [] } = useProducts();
  const { data: funnelStats = [] } = useAdminFunnelStats();
  const { data: returnedProducts = [] } = useAdminTopReturnedProducts();

  // --- 1. DEMAND FORECASTING (Wishlist vs Stock) ---
  const demandData = useMemo(() => {
    if (!wishlistStats || !products) return [];
    
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
    .slice(0, 5);
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
    const sorted = Object.entries(cityMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
      labels: sorted.map(i => i[0]),
      data: sorted.map(i => i[1])
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn font-body transition-colors duration-300 pb-20">
      
      {/* HEADER */}
      <div className="pb-6 border-b border-[var(--border)]">
        <h1 className="font-display text-4xl font-medium text-[var(--text)] flex items-center gap-3 tracking-tight">
          <BarChart4 className="text-[var(--accent)]" strokeWidth={1.5} size={32} /> 
          Market Intelligence
        </h1>
        <p className="font-display italic text-[var(--sub)] text-lg mt-2 tracking-wide">
          Analyze customer intent, feedback, and regional demographics.
        </p>
      </div>

      {/* TOP ROW: Sentiment & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sentiment Card */}
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)] flex flex-col items-center justify-center text-center">
          <div className="mb-5 p-4 bg-[var(--accent-soft)] rounded-full text-[var(--brand)] border border-[var(--border)] shadow-sm">
            <Star size={32} fill="currentColor" strokeWidth={0} />
          </div>
          {/* Changed to font-body: Data and numbers must use Manrope */}
          <h2 className="font-body text-5xl font-bold text-[var(--text)] tracking-tight">
            {sentiment.avg} <span className="text-2xl text-[var(--muted)]">/ 5.0</span>
          </h2>
          <p className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mt-3">
            Based on {sentiment.count} verified reviews
          </p>
          
          {/* Mini Bar Chart for Star Distribution */}
          <div className="w-full mt-8 space-y-3">
             {[5,4,3,2,1].map((star, i) => (
               <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-3 font-body font-bold text-[var(--sub)]">{star}</span> 
                  <Star size={12} className="text-[var(--accent)]" fill="currentColor" strokeWidth={0} />
                  <div className="flex-1 h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${star >= 4 ? 'bg-[var(--success)]' : star === 3 ? 'bg-[var(--accent)]' : 'bg-[var(--error)]'}`} 
                      style={{ width: `${Math.max((sentiment.distribution[i] / (sentiment.count || 1)) * 100, 2)}%` }}
                    />
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Wishlist Leaderboard */}
        <div className="lg:col-span-2 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)] flex flex-col justify-between">
           <h3 className="font-display text-2xl font-medium text-[var(--text)] mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
             <Heart className="text-[var(--error)]" strokeWidth={1.5} size={24} /> 
             Most Wanted (Wishlist)
           </h3>
           <div className="space-y-4">
             {demandData.map((item, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] transition-all duration-300 hover:border-[var(--brand)] hover:shadow-sm group cursor-default">
                  <div className="flex items-center gap-4">
                    {/* Changed to font-body for UI numbers */}
                    <span className="font-body font-bold text-[var(--muted)] text-sm w-6 text-right group-hover:text-[var(--brand)] transition-colors">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    <img src={item.img || '/placeholder.png'} className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] transition-transform duration-500 ease-out group-hover:scale-105" alt="" />
                    <div className="min-w-0">
                      <h4 className="font-body font-bold text-[var(--text)] text-sm tracking-wide truncate group-hover:text-[var(--brand)] transition-colors">{item.name}</h4>
                      <p className="font-body font-bold text-[11px] text-[var(--sub)] truncate mt-1">{item.variant}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end font-body font-bold text-[var(--error)] text-base tracking-tight">
                       <Heart size={14} fill="currentColor" strokeWidth={0} className="text-[var(--error)]" /> {item.wishlistCount}
                    </div>
                    {item.stock < 5 && (
                      <span className="font-body text-[9px] uppercase tracking-widest font-bold bg-[var(--surface-muted)] text-[var(--error)] px-2.5 py-1 rounded border border-[var(--border)] mt-1.5 inline-block">
                        Low Stock: {item.stock}
                      </span>
                    )}
                  </div>
               </div>
             ))}
             {demandData.length === 0 && <p className="text-center text-[var(--sub)] text-lg font-display italic py-8 tracking-wide">No wishlist data yet.</p>}
           </div>
        </div>
      </div>

      {/* BOTTOM ROW: Geographics & Payment Prefs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Cities */}
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
          <h3 className="font-display text-2xl font-medium text-[var(--text)] mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
            <MapPin className="text-[var(--accent)]" strokeWidth={1.5} size={24} /> 
            Top Customer Locations
          </h3>
          <div className="h-64 mt-4">
             <Bar 
               data={{
                 labels: geoData.labels,
                 datasets: [{
                   label: 'Orders',
                   data: geoData.data,
                   backgroundColor: 'var(--brand)',
                   borderRadius: 6
                 }]
               }}
               options={{
                 indexAxis: 'y',
                 responsive: true,
                 maintainAspectRatio: false,
                 plugins: { legend: { display: false } },
                 scales: { 
                   x: { grid: { color: 'var(--border)', borderDash: [4, 4], drawBorder: false }, ticks: { color: 'var(--sub)', font: { family: 'Manrope', size: 12, weight: '600' } }, border: { display: false } }, 
                   y: { grid: { display: false, drawBorder: false }, ticks: { color: 'var(--text)', font: { family: 'Manrope', size: 13, weight: '700' } }, border: { display: false } } 
                 }
               }}
             />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)] flex flex-col">
          <h3 className="font-display text-2xl font-medium text-[var(--text)] mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
            <CreditCard className="text-[var(--accent)]" strokeWidth={1.5} size={24} /> 
            Payment Preferences
          </h3>
          <div className="flex-1 relative flex items-center justify-center min-h-[220px] mt-2">
             <Doughnut 
               data={{
                 labels: ['Online Payment', 'Cash on Delivery'],
                 datasets: [{
                   data: [
                     orders?.filter(o => o.paymentMode === 'online').length || 0,
                     orders?.filter(o => o.paymentMode === 'cod').length || 0
                   ],
                   backgroundColor: ['var(--brand)', 'var(--success)'],
                   borderWidth: 4,
                   borderColor: 'var(--surface)',
                   hoverOffset: 8
                 }]
               }}
               options={{
                 cutout: '75%',
                 plugins: { 
                   legend: { 
                     position: 'bottom', 
                     labels: { usePointStyle: true, padding: 20, color: 'var(--text)', font: { family: 'Manrope', size: 13, weight: '700' } } 
                   } 
                 }
               }}
             />
          </div>
        </div>

      </div>

      {/* ANALYTICS (Funnel & Returns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Funnel Stats */}
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)] flex flex-col justify-between">
          <div>
            <h3 className="font-display text-2xl font-medium text-[var(--text)] mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
              <TrendingUp className="text-[var(--success)]" strokeWidth={1.5} size={24} /> 
              Sales Funnel Drop-off
            </h3>
            <div className="space-y-4">
              {funnelStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  <span className="font-body font-bold text-[var(--text)] text-sm tracking-wide">{stat.stage}</span>
                  {/* Changed to font-body for data */}
                  <span className="font-body text-xl font-bold text-[var(--text)] tracking-tight">{stat.count?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          {funnelStats.length > 0 && funnelStats[0].count > 0 && (
            <div className="mt-8 p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] flex items-center justify-between shadow-sm">
              <span className="font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)]">Overall Conversion</span>
              {/* Changed to font-body for data */}
              <span className="font-body text-2xl font-bold text-[var(--success)] tracking-tight">
                {((funnelStats[funnelStats.length - 1].count / funnelStats[0].count) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Top Returned Products */}
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)] flex flex-col justify-between">
          <div>
            <h3 className="font-display text-2xl font-medium text-[var(--text)] mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
              <AlertCircle className="text-[var(--error)]" strokeWidth={1.5} size={24} /> 
              Most Returned Products
            </h3>
            <div className="space-y-4">
               {returnedProducts.length === 0 ? (
                 <div className="text-[var(--sub)] font-display italic text-lg tracking-wide text-center py-16">No returned products recorded yet.</div>
               ) : (
                 returnedProducts.map((item, i) => (
                   <div key={i} className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] transition-colors duration-300 hover:border-[var(--brand)] hover:shadow-sm group cursor-default">
                      <img src={item.img || '/placeholder.png'} className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] transition-transform duration-500 ease-out group-hover:scale-105" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-body font-bold text-[var(--text)] text-sm tracking-wide truncate group-hover:text-[var(--brand)] transition-colors">{item.productName}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        {/* Changed to font-body for data */}
                        <div className="font-body text-xl font-bold text-[var(--error)] tracking-tight">
                          {item.returnCount} <span className="text-[10px] uppercase tracking-widest text-[var(--muted)] ml-1">Returns</span>
                        </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default InsightsTab;