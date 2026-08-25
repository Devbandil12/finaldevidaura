import { useState, useEffect } from 'react';
import { httpClient as api } from '../../../api/client/httpClient.js';
import { useUser } from '@clerk/clerk-react';

export const usePermissions = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setRole(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get('/api/rbac/me');
        setRole(response.data.role);
        setPermissions(response.data.permissions || []);
      } catch (err) {
        if (err.response?.status !== 403) {
           console.error('Failed to fetch admin permissions:', err);
        }
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [isSignedIn, isLoaded]);

  const hasPermission = (requiredPermission) => {
    if (role === 'SUPER_ADMIN') return true;
    return permissions.includes(requiredPermission);
  };

  const hasAnyPermission = (requiredPermissions) => {
    if (role === 'SUPER_ADMIN') return true;
    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (requiredPermissions) => {
    if (role === 'SUPER_ADMIN') return true;
    return requiredPermissions.every(perm => permissions.includes(perm));
  };

  return {
    role,
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
};
