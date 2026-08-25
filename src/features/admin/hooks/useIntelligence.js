import { useQuery } from '@tanstack/react-query';
import { httpClient } from '../../../api/client/httpClient';

const fetchOverview = async (timeRange) => {
  const res = await httpClient.get(`/api/intelligence/overview?timeRange=${timeRange}`);
  return res.data;
};

const fetchCustomerProduct = async (timeRange) => {
  const res = await httpClient.get(`/api/intelligence/customer-product?timeRange=${timeRange}`);
  return res.data;
};

const fetchMarket = async (timeRange) => {
  const res = await httpClient.get(`/api/intelligence/market?timeRange=${timeRange}`);
  return res.data;
};

export const useIntelligenceOverview = (timeRange = '30days') => {
  return useQuery({
    queryKey: ['intelligence-overview', timeRange],
    queryFn: () => fetchOverview(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCustomerProductIntelligence = (timeRange = '30days') => {
  return useQuery({
    queryKey: ['intelligence-customer-product', timeRange],
    queryFn: () => fetchCustomerProduct(timeRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useMarketIntelligence = (timeRange = '30days') => {
  return useQuery({
    queryKey: ['intelligence-market', timeRange],
    queryFn: () => fetchMarket(timeRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
