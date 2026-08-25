import React from 'react';
import { usePermissions } from '../../features/admin/hooks/usePermissions.js';

export const PermissionGate = ({ 
  children, 
  requirePermission, 
  requireAnyPermission,
  requireAllPermissions,
  fallback = null 
}) => {
  const { role, hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    // Optionally return a small spinner or nothing while loading
    return null;
  }

  // SUPER_ADMIN overrides everything
  if (role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  let hasAccess = true;

  if (requirePermission) {
    hasAccess = hasAccess && hasPermission(requirePermission);
  }

  if (requireAnyPermission) {
    hasAccess = hasAccess && hasAnyPermission(requireAnyPermission);
  }

  if (requireAllPermissions) {
    hasAccess = hasAccess && hasAllPermissions(requireAllPermissions);
  }

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
};
