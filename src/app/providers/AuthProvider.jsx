import React, { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from "../../api/client/auth";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key in environment variables.");
}

const AuthTokenInjector = ({ children }) => {
  const { getToken } = useAuth();
  setAuthTokenGetter(getToken);

  return <>{children}</>;
};

export const AuthProvider = ({ children }) => {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AuthTokenInjector>
        {children}
      </AuthTokenInjector>
    </ClerkProvider>
  );
};
