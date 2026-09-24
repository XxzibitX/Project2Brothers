import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, Phone, ShoppingBag, UserRound, X } from "lucide-react";
import { logout } from "@/api";
import { useAuthModal } from "@/features/auth/context/AuthModalContext";
import { useAuth, PROFILE_QUERY_KEY } from "@/hooks/useAuth";
import { useCafeContacts } from "@/hooks/useConfig";
import { useCart } from "@/features/cart/context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPhoneDisplay, toTelHref } from "@/shared/lib/phone";
import { cn } from "@/lib/utils";

function headerNavClass(active: boolean) {
  return cn(
    "rounded-md px-2.5 py-1.5 text-sm font-medium transition sm:px-3",
    active
      ? "bg-white/15 text-white"
      : "text-white/80 hover:bg-white/10 hover:text-white",
  );
}

function mobileNavClass(active: boolean) {
  return cn(
    "block rounded-lg px-4 py-3 text-base font-semibold transition",
    active
      ? "bg-grill text-mustard"
      : "text-foreground hover:bg-muted",
  );
}

export default function Header() {
  const { totalQty } = useCart();
  const { isAuthenticated, isManager } = useAuth();
  const { supportPhone } = useCafeContacts();
  const { openAuth } = useAuthModal();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const telHref = supportPhone ? toTelHref(supportPhone) : "";
  const phoneLabel = supportPhone ? formatPhoneDisplay(supportPhone) : "";

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.removeQueries({ queryKey: ["orders"] });
      setMenuOpen(false);
      navigate("/", { replace: true });
    },
  });

  const goToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMenuOpen(false);
    if (pathname === "/") {
      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate("/", { state: { scrollToMenu: true } });
  };

  const closeAnd = (fn: () => void) => {
    setMenuOpen(false);
    fn();
  };

  return (
    <header
      className={cn(
        "z-50",
        onHome && !isManager
          ? "absolute inset-x-0 top-0"
          : "sticky top-0 border-b border-border bg-grill",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-20 sm:gap-6 sm:px-6">
        <Link
          to={isManager ? "/manager" : "/"}
          className="shrink-0 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white sm:text-xl"
        >
          2Brothers
        </Link>

        {isManager ? (
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-60 sm:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span>Выйти</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop nav */}
            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
              <NavLink
                to="/"
                end
                className={({ isActive }) => headerNavClass(isActive)}
              >
                Главная
              </NavLink>
              <Link
                to="/"
                onClick={goToMenu}
                className={headerNavClass(false)}
              >
                Меню
              </Link>
              {isAuthenticated ? (
                <NavLink
                  to="/account"
                  className={({ isActive }) => headerNavClass(isActive)}
                >
                  Заказы
                </NavLink>
              ) : null}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:ml-0">
              {telHref ? (
                <a
                  href={telHref}
                  className="hidden items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white md:inline-flex sm:px-3"
                  title={`Позвонить ${phoneLabel}`}
                >
                  <Phone className="h-4 w-4" />
                  <span className="tabular-nums tracking-wide">{phoneLabel}</span>
                </a>
              ) : null}

              {/* Desktop auth */}
              <div className="hidden md:contents">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-60 sm:px-3"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Выйти</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuth("login")}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 sm:px-3"
                  >
                    <UserRound className="h-4 w-4" />
                    <span>Войти</span>
                  </button>
                )}
              </div>

              <Link
                to="/cart"
                className="relative inline-flex items-center gap-2 rounded-md bg-mustard px-3 py-2 text-sm font-semibold text-grill transition hover:brightness-105"
                aria-label="Корзина"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Корзина</span>
                {totalQty > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-md bg-chili px-1 text-[11px] font-bold text-white">
                    {totalQty}
                  </span>
                )}
              </Link>

              {/* Mobile burger */}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white transition hover:bg-white/10 md:hidden"
                  aria-label="Открыть меню"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>

                <SheetContent
                  side="right"
                  showCloseButton={false}
                  className="w-[min(100%,20rem)] border-border bg-card p-0 text-foreground"
                >
                  <SheetHeader className="border-b border-border bg-grill px-5 py-4 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <SheetTitle className="font-[family-name:var(--font-display)] text-lg text-white">
                        Меню
                      </SheetTitle>
                      <button
                        type="button"
                        onClick={() => setMenuOpen(false)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/85 transition hover:bg-white/10"
                        aria-label="Закрыть"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </SheetHeader>

                  <nav className="flex flex-col gap-1 p-3">
                    <NavLink
                      to="/"
                      end
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => mobileNavClass(isActive)}
                    >
                      Главная
                    </NavLink>
                    <Link
                      to="/"
                      onClick={goToMenu}
                      className={mobileNavClass(false)}
                    >
                      Меню
                    </Link>
                    {isAuthenticated ? (
                      <NavLink
                        to="/account"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => mobileNavClass(isActive)}
                      >
                        Заказы
                      </NavLink>
                    ) : null}

                    <div className="my-2 border-t border-border" />

                    {telHref ? (
                      <a
                        href={telHref}
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-base font-semibold text-foreground transition hover:bg-muted"
                      >
                        <Phone className="h-5 w-5" />
                        <span className="tabular-nums tracking-wide">
                          {phoneLabel}
                        </span>
                      </a>
                    ) : null}

                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-base font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
                      >
                        <LogOut className="h-5 w-5" />
                        Выйти
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          closeAnd(() => openAuth("login"))
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-base font-semibold text-foreground transition hover:bg-muted"
                      >
                        <UserRound className="h-5 w-5" />
                        Войти
                      </button>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
