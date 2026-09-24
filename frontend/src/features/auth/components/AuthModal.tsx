import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { login, register, type AuthSession } from "@/api";
import { useAuthModal } from "@/features/auth/context/AuthModalContext";
import { PROFILE_QUERY_KEY } from "@/hooks/useAuth";
import {
  isValidPhoneNumber,
  PhoneInput,
} from "@/shared/components/PhoneInput";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1.5 w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-mustard focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--mustard)_28%,transparent)]";

export function AuthModal() {
  const navigate = useNavigate();
  const { authOpen, authMode, closeAuth, openAuth } = useAuthModal();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState(false);

  const isLogin = authMode === "login";

  const resetForm = () => {
    setPhone("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setPersonalDataConsent(false);
    setError(null);
    setPhoneError(false);
  };

  const authMutation = useMutation({
    mutationFn: async (): Promise<AuthSession> => {
      if (isLogin) {
        return login({ phone, password });
      }
      return register({
        phone,
        password,
        name,
        personalDataConsent: true,
      });
    },
    onSuccess: (session) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, session.user);
      resetForm();
      closeAuth();
      if (session.user.role === "manager" || session.user.role === "owner") {
        navigate("/manager", { replace: true });
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Ошибка авторизации");
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError(true);
      setError("Введите корректный номер телефона");
      return;
    }

    if (!isLogin && password !== passwordConfirm) {
      setError("Пароли не совпадают");
      return;
    }

    if (!isLogin && !personalDataConsent) {
      setError("Необходимо согласие на обработку персональных данных");
      return;
    }

    setPhoneError(false);
    authMutation.mutate();
  };

  const pending = authMutation.isPending;

  return (
    <Dialog
      open={authOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          closeAuth();
        }
      }}
    >
      <DialogContent className="w-[min(100%,400px)] max-w-[400px] gap-0 overflow-hidden border-border bg-card p-0 text-foreground sm:max-w-[400px] sm:rounded-2xl [&_[data-slot=dialog-close]]:top-3.5 [&_[data-slot=dialog-close]]:right-3.5 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-80 [&_[data-slot=dialog-close]]:hover:opacity-100 [&_[data-slot=dialog-close]]:hover:bg-white/10">
        <div className="relative border-b border-border bg-grill px-5 pb-4 pt-5 text-white">
          <DialogHeader className="mt-2.5 space-y-1 text-left">
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl text-white">
              {isLogin ? "Вход" : "Регистрация"}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/65">
              {isLogin
                ? "Войдите по номеру телефона"
                : "Создайте аккаунт для заказов"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 px-5 py-4">
          {!isLogin && (
            <div>
              <label htmlFor="auth-name" className="text-sm font-medium">
                Имя
              </label>
              <input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                placeholder="Как к вам обращаться"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-phone" className="text-sm font-medium">
              Телефон
            </label>
            <PhoneInput
              id="auth-phone"
              value={phone}
              onChange={(v) => {
                setPhone(v);
                if (phoneError) setPhoneError(false);
              }}
              error={phoneError}
              className="mt-1.5"
              disabled={pending}
              placeholder="999 123-45-67"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="text-sm font-medium">
              Пароль
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(fieldClass, phoneError && "")}
              placeholder={isLogin ? "Ваш пароль" : "Не меньше 6 символов"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? 1 : 6}
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="auth-password-confirm"
                className="text-sm font-medium"
              >
                Повтор пароля
              </label>
              <input
                id="auth-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={fieldClass}
                placeholder="Повторите пароль"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          )}

          {!isLogin && (
            <label className="flex items-start gap-2.5 text-sm leading-snug">
              <Checkbox
                checked={personalDataConsent}
                onCheckedChange={(v) => setPersonalDataConsent(v === true)}
                className="mt-0.5 border-border data-[state=checked]:border-grill data-[state=checked]:bg-grill"
                aria-required
              />
              <span className="text-muted-foreground">
                Я согласен на обработку персональных данных в соответствии с{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-grill underline-offset-2 hover:underline"
                  onClick={() => closeAuth()}
                >
                  Политикой обработки персональных данных
                </Link>
              </span>
            </label>
          )}

          {error && (
            <p
              className="rounded-md bg-chili/10 px-3 py-2 text-sm text-chili"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-mustard py-3 text-sm font-bold text-grill transition hover:brightness-105 disabled:opacity-60"
          >
            {pending ? "Подождите…" : isLogin ? "Войти" : "Зарегистрироваться"}
          </button>

          <p className="pb-1 text-center text-sm text-muted-foreground">
            {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button
              type="button"
              className="font-semibold text-grill underline-offset-2 hover:underline"
              onClick={() => {
                setError(null);
                setPhoneError(false);
                openAuth(isLogin ? "register" : "login");
              }}
            >
              {isLogin ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
