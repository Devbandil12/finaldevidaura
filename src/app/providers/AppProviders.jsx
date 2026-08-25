import React from 'react';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { ToastProvider } from "../../contexts/ToastContext";
import { UserProvider } from "../../contexts/UserContext";
import { CheckoutProvider } from "../../contexts/CheckoutContext";

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <QueryProvider>
        <ToastProvider position="bottom-right">
          <UserProvider>
          <CheckoutProvider>
            {children}
          </CheckoutProvider>
        </UserProvider>
        </ToastProvider>
      </QueryProvider>
    </AuthProvider>
  );
};
