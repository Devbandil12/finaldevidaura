export const setupErrorInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => response, // Return full response object so services can call res.data
    (error) => {
      // Just log it
      console.error("API Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      
      // Don't use window.toast here; let the mutation/query handle the UI presentation
      // Must reject with the original error so that error.response.data is accessible
      return Promise.reject(error);
    }
  );
};
