import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  createStaff,
  getStaff,
  patchStaff,
  type StaffMember,
} from "@/api";
import { useAuth } from "@/hooks/useAuth";
import {
  isValidPhoneNumber,
  PhoneInput,
} from "@/shared/components/PhoneInput";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1 h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm outline-none transition focus:border-mustard focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--mustard)_28%,transparent)]";

export function ManagerStaffPanel() {
  const { user, isOwner } = useAuth();
  const qc = useQueryClient();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["manager", "staff"],
    queryFn: getStaff,
    enabled: isOwner,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"manager" | "owner">("manager");
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState(false);

  const createMut = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["manager", "staff"] });
      setName("");
      setPhone("");
      setPassword("");
      setRole("manager");
      setFormError(null);
      setPhoneError(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const patchMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchStaff>[1];
    }) => patchStaff(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["manager", "staff"] });
    },
  });

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Управление сотрудниками доступно только владельцу.
      </p>
    );
  }

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError(true);
      setFormError("Введите корректный номер телефона");
      return;
    }
    setPhoneError(false);
    createMut.mutate({ name, phone, password, role });
  };

  const resetPassword = (member: StaffMember) => {
    const next = window.prompt(
      `Новый пароль для ${member.name} (${member.phone})`,
      "",
    );
    if (!next || next.length < 6) {
      if (next != null) window.alert("Пароль не короче 6 символов");
      return;
    }
    patchMut.mutate({ id: member.id, body: { newPassword: next } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Сотрудники</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Создавайте менеджеров и при необходимости других владельцев.
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 text-sm font-semibold">Добавить</h3>
        <label className="block text-sm">
          <span className="font-medium">Имя</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="Имя сотрудника"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Телефон</span>
          <PhoneInput
            value={phone}
            onChange={(v) => {
              setPhone(v);
              if (phoneError) setPhoneError(false);
            }}
            error={phoneError}
            className="mt-1"
            placeholder="999 123-45-67"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            placeholder="Не меньше 6 символов"
            minLength={6}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Роль</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "manager" | "owner")}
            className={cn(fieldClass, "appearance-auto")}
          >
            <option value="manager">Менеджер</option>
            <option value="owner">Владелец</option>
          </select>
        </label>
        {formError && (
          <p className="sm:col-span-2 text-sm text-chili" role="alert">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={createMut.isPending}
          className="sm:col-span-2 rounded-md bg-grill px-4 py-2.5 text-sm font-semibold text-mustard disabled:opacity-60"
        >
          {createMut.isPending ? "Создаём…" : "Создать сотрудника"}
        </button>
      </form>

      {isPending && (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      )}
      {isError && (
        <p className="text-sm text-chili">
          {error instanceof Error ? error.message : "Ошибка загрузки"}
        </p>
      )}

      <ul className="space-y-3">
        {(data?.items ?? []).map((member) => (
          <li
            key={member.id}
            className={cn(
              "rounded-xl border border-border bg-card p-4",
              !member.isActive && "opacity-60",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {member.name}{" "}
                  <span className="text-xs font-medium text-muted-foreground">
                    {member.role === "owner" ? "владелец" : "менеджер"}
                    {!member.isActive ? " · отключён" : ""}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{member.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-1.5 text-sm"
                  onClick={() => resetPassword(member)}
                  disabled={patchMut.isPending}
                >
                  Сбросить пароль
                </button>
                {member.id !== user?.id && (
                  <button
                    type="button"
                    className="rounded-md border border-border px-3 py-1.5 text-sm"
                    disabled={patchMut.isPending}
                    onClick={() =>
                      patchMut.mutate({
                        id: member.id,
                        body: { isActive: !member.isActive },
                      })
                    }
                  >
                    {member.isActive ? "Отключить" : "Включить"}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
