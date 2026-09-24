import { Navigate } from "react-router-dom";
import { MyOrdersList } from "@/features/account/components/MyOrdersList";
import { useAuthModal } from "@/features/auth/context/AuthModalContext";
import { useAuth } from "@/hooks/useAuth";

export default function Account() {
  const { user, isAuthenticated, isLoading, isManager } = useAuth();
  const { openAuth } = useAuthModal();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (isManager) {
    return <Navigate to="/manager" replace />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Личный кабинет
        </h1>
        <p className="mt-2 text-muted-foreground">
          Войдите, чтобы видеть заказы и профиль.
        </p>
        <button
          type="button"
          onClick={() => openAuth("login")}
          className="mt-6 rounded-md bg-mustard px-5 py-3 text-sm font-bold text-grill"
        >
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {user.name}
        </h1>
        <p className="mt-2 text-muted-foreground">{user.phone}</p>
      </div>

      <div className="mt-8">
        <MyOrdersList />
      </div>
    </div>
  );
}
