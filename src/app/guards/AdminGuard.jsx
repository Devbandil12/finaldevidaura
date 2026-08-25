import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { usePermissions } from "../../features/admin/hooks/usePermissions";
import Loader from "../../Components/Loader";

export default function AdminGuard() {
  const { isLoaded, isSignedIn } = useUser();
  const { role: adminRole, isLoading: isRbacLoading } = usePermissions();

  // Wait for auth to load
  if (!isLoaded || (isSignedIn && isRbacLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
         <Loader text="Verifying Admin Access..." />
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Signed in but not an admin role in the RBAC system
  if (!adminRole) {
    return <Navigate to="/" replace />;
  }

  // Authorized
  return <Outlet />;
}
