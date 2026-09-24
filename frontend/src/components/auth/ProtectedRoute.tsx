import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";
import type { UserRole } from "@/api";

type Props = {
  children: ReactNode;
  allowedRoles?: UserRole[];
  /** Куда редиректить неавторизованных */
  fallbackTo?: string;
};

/** Как ProtectedRoute в агрегаторе: ждём profile, проверяем роль */
export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackTo = "/account",
}: Props) {
  const { user, isLoading, isFetching, isError } = useAuth();

  if (isLoading || ((isError || !user) && isFetching)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to={fallbackTo} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/account" replace />;
  }

  return children;
}
