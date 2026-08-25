import React, { useState } from 'react';
import { 
  Heart, Star, MapPin, CreditCard, TrendingUp, AlertCircle, 
  BarChart4, ArrowRight, ArrowUpRight, ArrowDownRight, RefreshCcw, Sparkles
} from 'lucide-react';
import { useIntelligenceOverview, useCustomerProductIntelligence, useMarketIntelligence } from '../../features/admin/hooks/useIntelligence';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MarketIntelligenceTab = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30days');

  const { data: overview, isLoading: overviewLoading, isFetching: overviewFetching, refetch: refetchOverview } = useIntelligenceOverview(timeRange);
  const { data: custProd, isLoading: custProdLoading, isFetching: custProdFetching, refetch: refetchCustProd } = useCustomerProductIntelligence(timeRange);
  const { data: market, isLoading: marketLoading, isFetching: marketFetching, refetch: refetchMarket } = useMarketIntelligence(timeRange);

  const handleRefresh = () => {
    refetchOverview();
    refetchCustProd();
    refetchMarket();
  };

  const isLoading = overviewLoading || custProdLoading || marketLoading;
  const isRefreshing = overviewFetching || custProdFetching || marketFetching;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[var(--bg)] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[var(--sub)]">
          <RefreshCcw className="animate-spin text-[var(--brand)]" size={32} />
          <p className="font-body text-sm font-bold tracking-widest uppercase">Analyzing intelligence signals...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-body pb-20 transition-colors duration-500"
    >
      
      {/* 1. Header & Global Date Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border)]/50 pb-6">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-[var(--text)] flex items-center gap-3 tracking-tight">
            <div className="p-2.5 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 shadow-sm text-[var(--accent)]">
              <BarChart4 strokeWidth={1.5} size={28} /> 
            </div>
            Market & Customer Intelligence
          </h1>
          <p className="font-body text-sm text-[var(--sub)] mt-3 tracking-wide">
            Customer behavior, product demand, market signals, opportunities and risks.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[var(--surface)] p-1.5 rounded-[1.5rem] ring-1 ring-[var(--border)]/40 shadow-sm">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-[var(--text)] text-xs font-bold font-body px-3 py-2 rounded-[1rem] outline-none cursor-pointer"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="month">This Month</option>
          </select>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-[1rem] bg-[var(--surface-muted)] text-[var(--sub)] hover:text-[var(--brand)] transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin text-[var(--brand)]' : ''} />
          </motion.button>
        </div>
      </div>

      {/* 2. Intelligence Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1 */}
        <div className="bg-[var(--surface)] p-6 rounded-[2rem] ring-1 ring-[var(--border)]/40 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:shadow-md transition-all duration-500">
          <div>
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-2">Demand Growth</span>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-[var(--text)] tracking-tight">{overview?.summary?.demand?.value || 0}</span>
              <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${overview?.summary?.demand?.change >= 0 ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                {overview?.summary?.demand?.change >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                {Math.abs(overview?.summary?.demand?.change || 0).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-6 text-[11px] text-[var(--sub)] flex justify-between items-center border-t border-[var(--border)]/40 pt-4 font-medium">
            <span>{overview?.summary?.demand?.period}</span>
            <span className="text-[var(--text)] font-bold">Conf: {overview?.summary?.demand?.confidence?.toUpperCase()} ({overview?.summary?.demand?.sampleSize})</span>
          </div>
        </div>
        
        {/* Card 2 */}
        <div className="bg-[var(--surface)] p-6 rounded-[2rem] ring-1 ring-[var(--border)]/40 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:shadow-md transition-all duration-500">
          <div>
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-2">Sentiment Score</span>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-[var(--text)] tracking-tight">{overview?.summary?.sentiment?.value?.toFixed(1) || '0.0'}</span>
              <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${overview?.summary?.sentiment?.change >= 0 ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                {overview?.summary?.sentiment?.change >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                {Math.abs(overview?.summary?.sentiment?.change || 0).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="mt-6 text-[11px] text-[var(--sub)] flex justify-between items-center border-t border-[var(--border)]/40 pt-4 font-medium">
            <span>{overview?.summary?.sentiment?.period}</span>
            <span className="text-[var(--text)] font-bold">Conf: {overview?.summary?.sentiment?.confidence?.toUpperCase()} ({overview?.summary?.sentiment?.sampleSize})</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[var(--surface)] p-6 rounded-[2rem] ring-1 ring-[var(--border)]/40 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:shadow-md transition-all duration-500">
          <div>
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-2">Return Rate</span>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-[var(--text)] tracking-tight">{overview?.summary?.returnRisk?.value?.toFixed(1) || '0'}%</span>
              <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${overview?.summary?.returnRisk?.change <= 0 ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                {overview?.summary?.returnRisk?.change <= 0 ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                {Math.abs(overview?.summary?.returnRisk?.change || 0).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-6 text-[11px] text-[var(--sub)] flex justify-between items-center border-t border-[var(--border)]/40 pt-4 font-medium">
            <span>{overview?.summary?.returnRisk?.period}</span>
            <span className="text-[var(--text)] font-bold">Conf: {overview?.summary?.returnRisk?.confidence?.toUpperCase()} ({overview?.summary?.returnRisk?.sampleSize})</span>
          </div>
        </div>

      </div>

      {/* 3 & 4. Opportunities & Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Opportunities */}
        <div className="bg-[var(--surface)] rounded-[2.5rem] ring-1 ring-[var(--success)]/30 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="bg-[var(--success)]/5 px-8 py-5 border-b border-[var(--success)]/10 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--success)]/10 text-[var(--success)]">
              <TrendingUp size={20} strokeWidth={2} />
            </div>
            <h2 className="font-display text-xl font-medium text-[var(--success)] tracking-tight">Opportunities to capture</h2>
          </div>
          <div className="p-6 sm:p-8 space-y-4 flex-1">
            {overview?.opportunities?.length > 0 ? overview.opportunities.map((opp, idx) => (
              <div key={idx} className="bg-[var(--surface-muted)]/50 p-5 rounded-[1.5rem] ring-1 ring-[var(--border)]/40 hover:ring-[var(--success)]/30 transition-all duration-300">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-body font-bold text-sm text-[var(--text)]">{opp.title}</h4>
                    <p className="font-body text-xs text-[var(--sub)] mt-1.5 leading-relaxed">{opp.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap ${opp.confidence === 'high' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--warning)]/10 text-[var(--warning)]'}`}>
                    {opp.confidence} conf
                  </span>
                </div>
                {opp.actionUrl && (
                  <button 
                    onClick={() => navigate(opp.actionUrl)}
                    className="mt-4 font-body text-xs font-bold flex items-center gap-1.5 text-[var(--success)] hover:underline"
                  >
                    {opp.actionLabel} <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )) : (
              <p className="text-[var(--sub)] text-sm italic">No significant opportunities identified in this period.</p>
            )}
          </div>
        </div>

        {/* Risks */}
        <div className="bg-[var(--surface)] rounded-[2.5rem] ring-1 ring-[var(--error)]/30 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="bg-[var(--error)]/5 px-8 py-5 border-b border-[var(--error)]/10 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--error)]/10 text-[var(--error)]">
              <AlertCircle size={20} strokeWidth={2} />
            </div>
            <h2 className="font-display text-xl font-medium text-[var(--error)] tracking-tight">Risks to mitigate</h2>
          </div>
          <div className="p-6 sm:p-8 space-y-4 flex-1">
            {overview?.risks?.length > 0 ? overview.risks.map((risk, idx) => (
              <div key={idx} className="bg-[var(--surface-muted)]/50 p-5 rounded-[1.5rem] ring-1 ring-[var(--border)]/40 hover:ring-[var(--error)]/30 transition-all duration-300">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-body font-bold text-sm text-[var(--text)]">{risk.title}</h4>
                    <p className="font-body text-xs text-[var(--sub)] mt-1.5 leading-relaxed">{risk.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap ${risk.severity === 'high' ? 'bg-[var(--error)]/10 text-[var(--error)]' : 'bg-[var(--warning)]/10 text-[var(--warning)]'}`}>
                    {risk.confidence} conf
                  </span>
                </div>
                {risk.actionUrl && (
                  <button 
                    onClick={() => navigate(risk.actionUrl)}
                    className="mt-4 font-body text-xs font-bold flex items-center gap-1.5 text-[var(--error)] hover:underline"
                  >
                    {risk.actionLabel} <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )) : (
              <p className="text-[var(--sub)] text-sm italic">No significant risks identified in this period.</p>
            )}
          </div>
        </div>

      </div>

      {/* 7 & 8. Product Demand & Inventory Pressure */}
      <div className="bg-[var(--surface)] rounded-[2.5rem] ring-1 ring-[var(--border)]/40 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        <div className="px-8 py-6 border-b border-[var(--border)]/40 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/40 flex items-center justify-center text-[var(--brand)]">
            <Heart size={20} strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Product Demand & Conversion</h2>
        </div>
        <div className="p-6 sm:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest border-b border-[var(--border)]/50">
                <tr>
                  <th className="pb-4">Product</th>
                  <th className="pb-4">Wishlists (Demand)</th>
                  <th className="pb-4">Sales (Conversion)</th>
                  <th className="pb-4">Conv. Rate</th>
                  <th className="pb-4">Stock Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40 text-[var(--text)] font-body">
                {custProd?.productDemand?.length > 0 ? custProd.productDemand.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                    <td className="py-4 font-bold">{prod.name}</td>
                    <td className="py-4 text-[var(--sub)]">{prod.wishlists}</td>
                    <td className="py-4 text-[var(--sub)]">{prod.sales}</td>
                    <td className="py-4 font-bold">{prod.conversionRate.toFixed(1)}%</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${prod.stock < 10 ? 'bg-[var(--error)]/10 text-[var(--error)] ring-1 ring-[var(--error)]/20' : 'bg-[var(--success)]/10 text-[var(--success)] ring-1 ring-[var(--success)]/20'}`}>
                        {prod.stock} left
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="py-8 text-[var(--sub)] text-center italic">No data for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 10. Payment Behavior & Returns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Payment Behavior */}
        <div className="bg-[var(--surface)] rounded-[2.5rem] ring-1 ring-[var(--border)]/40 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="px-8 py-6 border-b border-[var(--border)]/40 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/40 flex items-center justify-center text-[var(--brand)]">
              <CreditCard size={20} strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Payment Behavior</h2>
          </div>
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center space-y-6">
             
             {/* Online */}
             <div className="bg-[var(--surface-muted)]/50 p-5 rounded-[1.5rem] ring-1 ring-[var(--border)]/40">
               <div className="flex justify-between mb-2">
                 <span className="font-body text-xs font-bold uppercase tracking-widest text-[var(--sub)]">Prepaid / Online</span>
                 <span className="font-body text-xs font-bold text-[var(--text)]">{market?.payment?.online?.orders || 0} orders</span>
               </div>
               <div className="w-full flex h-2.5 rounded-full overflow-hidden bg-[var(--border)]/40 gap-0.5">
                 <div className="bg-[var(--success)] transition-all duration-500" style={{ width: `${100 - (market?.payment?.online?.failureRate || 0)}%` }}></div>
                 <div className="bg-[var(--error)] transition-all duration-500" style={{ width: `${market?.payment?.online?.failureRate || 0}%` }}></div>
               </div>
               <div className="flex justify-between items-center mt-2.5 text-xs font-bold">
                 <span className="text-[var(--success)]">{(100 - (market?.payment?.online?.failureRate || 0)).toFixed(1)}% Success</span>
                 <span className="text-[var(--error)]">{market?.payment?.online?.failureRate?.toFixed(1) || 0}% Abandoned ({market?.payment?.online?.failedOrders || 0})</span>
               </div>
             </div>

             {/* COD */}
             <div className="bg-[var(--surface-muted)]/50 p-5 rounded-[1.5rem] ring-1 ring-[var(--border)]/40">
               <div className="flex justify-between mb-2">
                 <span className="font-body text-xs font-bold uppercase tracking-widest text-[var(--sub)]">Cash on Delivery</span>
                 <span className="font-body text-xs font-bold text-[var(--text)]">{market?.payment?.cod?.orders || 0} orders</span>
               </div>
               <div className="w-full flex h-2.5 rounded-full overflow-hidden bg-[var(--border)]/40 gap-0.5">
                 <div className="bg-[var(--warning)] transition-all duration-500" style={{ width: `${100 - (market?.payment?.cod?.rtoRate || 0)}%` }}></div>
                 <div className="bg-[var(--error)] transition-all duration-500" style={{ width: `${market?.payment?.cod?.rtoRate || 0}%` }}></div>
               </div>
               <div className="flex justify-between items-center mt-2.5 text-xs font-bold">
                 <span className="text-[var(--warning)]">{(100 - (market?.payment?.cod?.rtoRate || 0)).toFixed(1)}% Success</span>
                 <span className="text-[var(--error)]">{market?.payment?.cod?.rtoRate?.toFixed(1) || 0}% RTO/Cancel ({market?.payment?.cod?.rtoOrders || 0})</span>
               </div>
             </div>

          </div>
        </div>

        {/* Returns & Quality */}
        <div className="bg-[var(--surface)] rounded-[2.5rem] ring-1 ring-[var(--border)]/40 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="px-8 py-6 border-b border-[var(--border)]/40 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/40 flex items-center justify-center text-[var(--brand)]">
              <Sparkles size={20} strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Returns & Quality</h2>
          </div>
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-end bg-[var(--surface-muted)]/50 p-6 rounded-[1.75rem] ring-1 ring-[var(--border)]/40">
               <div>
                 <span className="font-body text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Overall Return Rate</span>
                 <h3 className="font-display text-4xl font-bold text-[var(--text)] mt-1">{market?.returns?.rate?.value?.toFixed(1) || 0}%</h3>
               </div>
               <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md mb-2 ${market?.returns?.rate?.change <= 0 ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                    {market?.returns?.rate?.change <= 0 ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                    {Math.abs(market?.returns?.rate?.change || 0).toFixed(1)}%
                  </span>
                  <p className="font-body text-[11px] font-bold text-[var(--sub)]">Conf: {market?.returns?.rate?.confidence?.toUpperCase()}</p>
               </div>
            </div>
            <p className="font-body text-xs text-[var(--muted)] mt-6 italic">
              Note: Return reason distribution is hidden pending structured return reasons schema update.
            </p>
          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default MarketIntelligenceTab;