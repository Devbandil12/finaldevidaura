let getTokenFn = null;

// Function to inject Clerk's getToken method from the React tree
export const setAuthTokenGetter = (fn) => {
  getTokenFn = fn;
};

export const setupAuthInterceptor = (client) => {
  client.interceptors.request.use(
    async (config) => {
      if (getTokenFn) {
        try {
          const token = await getTokenFn();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.warn("Failed to get auth token", err);
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};
