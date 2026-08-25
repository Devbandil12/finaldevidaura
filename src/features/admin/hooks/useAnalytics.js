import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '../../../api/client/httpClient';

// --- API FETCHERS ---

const fetchSalesAnalytics = async (timeRange, startDate, endDate) => {
  console.log("Fetching sales analytics from: /api/analytics/admin/sales");
  const { data } = await api.get('/api/analytics/admin/sales', {
    params: { timeRange, startDate, endDate }
  });
  return data;
};

const fetchCustomerAnalytics = async (timeRange, startDate, endDate) => {
  const { data } = await api.get('/api/analytics/admin/customers', {
    params: { timeRange, startDate, endDate }
  });
  return data;
};

const fetchProductAnalytics = async (timeRange, startDate, endDate) => {
  const { data } = await api.get('/api/analytics/admin/products', {
    params: { timeRange, startDate, endDate }
  });
  return data;
};

const fetchInventoryAnalytics = async () => {
  const { data } = await api.get('/api/analytics/admin/inventory');
  return data;
};

// --- HOOKS ---

export const useSalesAnalytics = (timeRange, startDate, endDate) => {
  return useQuery({
    queryKey: ['analytics', 'sales', timeRange, startDate, endDate],
    queryFn: () => fetchSalesAnalytics(timeRange, startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomerAnalytics = (timeRange, startDate, endDate) => {
  return useQuery({
    queryKey: ['analytics', 'customers', timeRange, startDate, endDate],
    queryFn: () => fetchCustomerAnalytics(timeRange, startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductAnalytics = (timeRange, startDate, endDate) => {
  return useQuery({
    queryKey: ['analytics', 'products', timeRange, startDate, endDate],
    queryFn: () => fetchProductAnalytics(timeRange, startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
};

export const useInventoryAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'inventory'],
    queryFn: fetchInventoryAnalytics,
    staleTime: 5 * 60 * 1000,
  });
};
