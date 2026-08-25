import { useMemo } from 'react';
import { useAdminReports, useAdminUsers, useAdminOrders } from './useAdmin';
import { useProducts } from '../../catalog/hooks/useProducts';

export const useReportsData = () => {
  const { data: reportOrders = [] } = useAdminReports();
  const { data: usersResponse } = useAdminUsers(1, 1000);
  const users = usersResponse?.data || [];
  const { data: products = [] } = useProducts();

  // --- 1. SALES ANALYTICS ENGINE (SYNCED WITH DASHBOARD) ---
  const salesData = useMemo(() => {
    if (!reportOrders || reportOrders.length === 0) return [];

    const dailyMap = {};

    reportOrders.forEach(order => {
       const isRevenueOrder = () => {
          if (order.status === 'Order Cancelled') return false;
          if (order.paymentMode === 'online' || order.paymentMode === 'wallet') return order.paymentStatus === 'paid';
          if (order.paymentMode === 'cod' || order.paymentMode === 'cash') return order.status === 'Delivered';
          return false;
       };

       if (!isRevenueOrder()) return;

       const date = new Date(order.createdAt).toLocaleDateString('en-US');
       
       if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0, profit: 0 };
       
       const totalAmount = parseFloat(order.totalAmount || 0);
       const walletAmount = parseFloat(order.walletAmountUsed || 0);
       
       dailyMap[date].revenue += (totalAmount + walletAmount);
       dailyMap[date].orders += 1;
       
       let orderCost = 0;
       
       const detailedOrder = reportOrders.find(ro => ro.id === order.id) || order;
       const items = detailedOrder.products || detailedOrder.orderItems || [];

       orderCost = items.reduce((pSum, p) => {
          const cost = p.costPrice ? parseFloat(p.costPrice) : 0; 
          const qty = p.quantity || 1;
          return pSum + (cost * qty);
       }, 0);
       
       dailyMap[date].profit += ((totalAmount + walletAmount) - orderCost);
    });

    return Object.values(dailyMap).sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [reportOrders]);

  // --- 2. INVENTORY INTELLIGENCE ---
  const inventoryData = useMemo(() => {
    if (!products) return [];
    return products.flatMap(p => 
      p.variants?.map(v => {
        const stock = parseInt(v.stock || 0);
        const sold = parseInt(v.sold || 0);
        const price = parseFloat(v.price || v.oprice || 0); 

        return {
          id: v.id,
          name: p.name,
          variant: v.name,
          sku: v.sku || 'N/A',
          stock: stock,
          sold: sold, 
          price: price,
          value: stock * price, 
          turnoverRate: (sold + stock) > 0 ? ((sold / (stock + sold)) * 100).toFixed(1) : 0
        };
      }) || []
    ).sort((a,b) => a.stock - b.stock); 
  }, [products]);

  // --- 3. CUSTOMER INSIGHTS ---
  const customerData = useMemo(() => {
    if (!users || !reportOrders) return [];
    
    const userMap = {};
    reportOrders.forEach(order => {
        const isRevenueOrder = () => {
          if (order.status === 'Order Cancelled') return false;
          if (order.paymentMode === 'online' || order.paymentMode === 'wallet') return order.paymentStatus === 'paid';
          if (order.paymentMode === 'cod' || order.paymentMode === 'cash') return order.status === 'Delivered';
          return false;
        };

        if (!isRevenueOrder()) return;
        
        if (!userMap[order.userId]) {
            const u = users.find(usr => usr.id === order.userId);
            userMap[order.userId] = {
                id: order.userId,
                name: u?.name || 'Guest/Unknown',
                email: u?.email || 'N/A',
                totalSpent: 0,
                orders: 0,
                lastOrder: order.createdAt,
                city: order.shippingAddress?.city || 'Unknown' 
            };
        }
        
        const spent = parseFloat(order.totalAmount || 0) + parseFloat(order.walletAmountUsed || 0);
        userMap[order.userId].totalSpent += spent;
        userMap[order.userId].orders += 1;
        
        if (new Date(order.createdAt) > new Date(userMap[order.userId].lastOrder)) {
            userMap[order.userId].lastOrder = order.createdAt;
        }
    });

    return Object.values(userMap).sort((a,b) => b.totalSpent - a.totalSpent);
  }, [users, reportOrders]);

  return { salesData, inventoryData, customerData };
};
