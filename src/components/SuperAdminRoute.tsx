import { Navigate, Outlet } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/use-super-admin";
import { Skeleton } from "@/components/ui/skeleton";

export const SuperAdminRoute = () => {
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-32 w-96" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
