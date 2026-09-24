import { useState } from "react";
import { ManagerExtrasPanel } from "@/features/manager/components/ManagerExtrasPanel";
import { ManagerLegalPanel } from "@/features/manager/components/ManagerLegalPanel";
import { ManagerMenuPanel } from "@/features/manager/components/ManagerMenuPanel";
import { ManagerOrdersPanel } from "@/features/manager/components/ManagerOrdersPanel";
import { ManagerProfilePanel } from "@/features/manager/components/ManagerProfilePanel";
import { ManagerSettingsPanel } from "@/features/manager/components/ManagerSettingsPanel";
import { ManagerStaffPanel } from "@/features/manager/components/ManagerStaffPanel";
import { useNewOrderAlerts } from "@/features/manager/hooks/useNewOrderAlerts";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Tab =
  | "orders"
  | "menu"
  | "extras"
  | "profile"
  | "staff"
  | "settings"
  | "legal";

export default function Manager() {
  const [tab, setTab] = useState<Tab>("orders");
  const { user, isOwner } = useAuth();
  const { badge } = useNewOrderAlerts(true);

  const tabs: { id: Tab; label: string; ownerOnly?: boolean }[] = [
    { id: "orders", label: "Заказы" },
    { id: "menu", label: "Меню" },
    { id: "extras", label: "Допы" },
    { id: "profile", label: "Профиль" },
    { id: "staff", label: "Сотрудники", ownerOnly: true },
    { id: "settings", label: "Настройки", ownerOnly: true },
    { id: "legal", label: "Юридические документы", ownerOnly: true },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Панель менеджера
        </h1>
        <p className="mt-2 text-muted-foreground">
          {user?.name ? `${user.name} · ` : ""}
          {user?.role === "owner" ? "Владелец" : "Менеджер"} · заказы и меню
          {badge > 0 ? (
            <span className="ml-2 inline-flex items-center rounded-md bg-chili/15 px-2 py-0.5 text-xs font-semibold text-chili">
              новых: {badge}
            </span>
          ) : null}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {tabs
          .filter((item) => !item.ownerOnly || isOwner)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative border-b-2 px-4 py-2.5 text-sm font-semibold transition",
                tab === item.id
                  ? "border-mustard text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {item.id === "orders" && badge > 0 ? (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-chili px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </button>
          ))}
      </div>

      {tab === "orders" && <ManagerOrdersPanel />}
      {tab === "menu" && <ManagerMenuPanel />}
      {tab === "extras" && <ManagerExtrasPanel />}
      {tab === "profile" && <ManagerProfilePanel />}
      {tab === "staff" && <ManagerStaffPanel />}
      {tab === "settings" && <ManagerSettingsPanel />}
      {tab === "legal" && <ManagerLegalPanel />}
    </div>
  );
}
