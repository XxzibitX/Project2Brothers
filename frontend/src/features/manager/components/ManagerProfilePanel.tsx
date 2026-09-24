import { useState, type FormEvent } from "react";
import { changePassword } from "@/api";
import { useAuth } from "@/hooks/useAuth";

export function ManagerProfilePanel() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (newPassword.length < 6) {
      setError("Новый пароль — не короче 6 символов");
      return;
    }
    if (newPassword !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setPending(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сменить пароль");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Профиль</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.name} · {user?.phone}
          {user?.role === "owner" ? " · владелец" : " · менеджер"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Смена пароля</h3>
        <label className="block text-sm">
          <span className="font-medium">Текущий пароль</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            placeholder="Ваш текущий пароль"
            required
            autoComplete="current-password"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Новый пароль</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            placeholder="Не меньше 6 символов"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Повтор нового пароля</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            placeholder="Повторите новый пароль"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="text-sm text-chili" role="alert">
            {error}
          </p>
        )}
        {ok && (
          <p className="text-sm text-foreground">Пароль обновлён</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-grill px-4 py-2.5 text-sm font-semibold text-mustard disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Сменить пароль"}
        </button>
      </form>
    </div>
  );
}
