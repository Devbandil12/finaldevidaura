import React, { createContext, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useUserDetails } from '../features/users/hooks/useUsers';
import { subscribeToPush } from '../utils/pushNotification';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { data: userdetails, isLoading: isUserLoading } = useUserDetails();

  const { getToken } = useAuth();

  useEffect(() => {
    const initPush = async () => {
      if (isSignedIn && userdetails?.id) {
        const token = await getToken();
        subscribeToPush(userdetails.id, token);
      }
    };
    initPush();
  }, [isSignedIn, userdetails, getToken]);

  return (
    <UserContext.Provider value={{ userdetails, isLoaded, isSignedIn, isUserLoading }}>
      {children}
    </UserContext.Provider>
  );
};