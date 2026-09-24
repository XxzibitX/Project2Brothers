import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/** Редирект менеджера с клиентских страниц на дашборд */
export function ManagerAway({ children }: { children: React.ReactNode }) {
  const { isManager } = useAuth();

  // Не ждём getMe: у гостя профиля нет, корзина должна открываться сразу.
  // Менеджера уведём, как только роль станет известна.
  if (isManager) {
    return <Navigate to="/manager" replace />;
  }

  return <>{children}</>;
}
