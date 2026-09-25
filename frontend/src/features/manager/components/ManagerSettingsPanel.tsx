import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import {
  getManagerSettings,
  getManagerSystemStatus,
  testTelegramSettings,
  updateCafeSettings,
  updateTelegramSettings,
} from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { CONFIG_QUERY_KEY } from "@/hooks/useConfig";
import { cn } from "@/lib/utils";

const SYSTEM_STATUS_KEY = ["manager", "system-status"] as const;

function parseChatIds(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "mt-1 inline-block size-2.5 shrink-0 rounded-full",
        ok ? "bg-emerald-600" : "bg-chili",
      )}
      aria-hidden
    />
  );
}

function formatCheckedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ManagerSettingsPanel() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["manager", "settings"],
    queryFn: getManagerSettings,
    enabled: isOwner,
  });

  const systemQuery = useQuery({
    queryKey: SYSTEM_STATUS_KEY,
    queryFn: getManagerSystemStatus,
    enabled: isOwner,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const [supportPhone, setSupportPhone] = useState("");
  const [cafeAddress, setCafeAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatIdList, setChatIdList] = useState<string[]>([]);
  const [newChatId, setNewChatId] = useState("");
  const [cafeMsg, setCafeMsg] = useState<string | null>(null);
  const [tgMsg, setTgMsg] = useState<string | null>(null);
  const [tgErr, setTgErr] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setSupportPhone(data.cafe.supportPhone);
    setCafeAddress(data.cafe.cafeAddress);
    setWorkingHours(data.cafe.workingHours);
    setChatIdList(parseChatIds(data.telegram.chatIds));
    setNewChatId("");
    setBotToken("");
  }, [data]);

  const cafeMut = useMutation({
    mutationFn: updateCafeSettings,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["manager", "settings"] });
      void qc.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
      setCafeMsg("Контакты сохранены");
    },
    onError: (err: Error) => setCafeMsg(err.message),
  });

  const tgMut = useMutation({
    mutationFn: updateTelegramSettings,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["manager", "settings"] });
      void qc.invalidateQueries({ queryKey: SYSTEM_STATUS_KEY });
      setTgErr(null);
      setTgMsg("Telegram сохранён");
      setBotToken("");
      setNewChatId("");
    },
    onError: (err: Error) => {
      setTgMsg(null);
      setTgErr(err.message);
    },
  });

  const testMut = useMutation({
    mutationFn: testTelegramSettings,
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: SYSTEM_STATUS_KEY });
      if (res.ok) {
        setTgErr(null);
        setTgMsg(res.message);
      } else {
        setTgMsg(null);
        setTgErr(res.message);
      }
    },
    onError: (err: Error) => {
      void qc.invalidateQueries({ queryKey: SYSTEM_STATUS_KEY });
      setTgMsg(null);
      setTgErr(err.message);
    },
  });

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Настройки кафе и Telegram доступны только владельцу.
      </p>
    );
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-chili">
        {error instanceof Error ? error.message : "Ошибка загрузки"}
      </p>
    );
  }

  const onCafe = (e: FormEvent) => {
    e.preventDefault();
    setCafeMsg(null);
    cafeMut.mutate({ supportPhone, cafeAddress, workingHours });
  };

  const addChatId = () => {
    const ids = parseChatIds(newChatId);
    if (!ids.length) return;
    setChatIdList((prev) => {
      const next = [...prev];
      for (const id of ids) {
        if (!next.includes(id)) next.push(id);
      }
      return next;
    });
    setNewChatId("");
    setTgMsg(null);
    setTgErr(null);
  };

  const removeChatId = (id: string) => {
    setChatIdList((prev) => prev.filter((x) => x !== id));
    setTgMsg(null);
    setTgErr(null);
  };

  const onTelegram = (e: FormEvent) => {
    e.preventDefault();
    setTgMsg(null);
    setTgErr(null);
    // Подхватываем id из поля ввода, если забыли нажать «Добавить»
    const pendingIds = parseChatIds(newChatId);
    const merged = [...chatIdList];
    for (const id of pendingIds) {
      if (!merged.includes(id)) merged.push(id);
    }
    if (pendingIds.length) {
      setChatIdList(merged);
      setNewChatId("");
    }
    tgMut.mutate({
      chatIds: merged.join(","),
      ...(botToken.trim() ? { botToken: botToken.trim() } : {}),
    });
  };

  const system = systemQuery.data;
  const pending = system?.pendingTelegramOrders ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Настройки</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Контакты на сайте и Telegram для уведомлений о заказах.
        </p>
      </div>

      <section className="max-w-lg space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Система</h3>
          <button
            type="button"
            disabled={systemQuery.isFetching}
            onClick={() => void systemQuery.refetch()}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          >
            {systemQuery.isFetching ? "Обновляем…" : "Обновить статус"}
          </button>
        </div>

        {systemQuery.isPending && !system ? (
          <p className="text-sm text-muted-foreground">Проверяем…</p>
        ) : systemQuery.isError ? (
          <p className="text-sm text-chili" role="alert">
            Не удалось получить статус системы
          </p>
        ) : system ? (
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2.5">
              <StatusDot ok={system.api} />
              <div>
                <p className="font-medium">Сайт / API</p>
                <p className="text-xs text-muted-foreground">Работает</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <StatusDot ok={system.db} />
              <div>
                <p className="font-medium">База данных</p>
                <p className="text-xs text-muted-foreground">
                  {system.db ? "Подключение ок" : "Нет связи с БД"}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <StatusDot ok={system.telegram.ok} />
              <div className="min-w-0">
                <p className="font-medium">Telegram</p>
                <p
                  className={cn(
                    "text-xs break-words",
                    system.telegram.ok
                      ? "text-muted-foreground"
                      : "text-chili",
                  )}
                >
                  {system.telegram.message}
                  {system.telegram.ok && !system.telegram.polling
                    ? " · кнопки статусов в чате могут быть недоступны"
                    : null}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <StatusDot ok={pending === 0} />
              <div>
                <p className="font-medium">Очередь уведомлений</p>
                <p
                  className={cn(
                    "text-xs",
                    pending > 0 ? "text-chili" : "text-muted-foreground",
                  )}
                >
                  {pending > 0
                    ? `Ожидают отправки: ${pending}`
                    : "Ожидают отправки: 0"}
                </p>
              </div>
            </li>
          </ul>
        ) : null}

        {system ? (
          <p className="text-[11px] text-muted-foreground">
            Проверено: {formatCheckedAt(system.checkedAt)} · автообновление
            каждые 30 с
          </p>
        ) : null}

        <button
          type="button"
          disabled={testMut.isPending}
          onClick={() => testMut.mutate()}
          className="w-full rounded-md bg-grill px-4 py-2.5 text-sm font-semibold text-mustard disabled:opacity-60"
        >
          {testMut.isPending
            ? "Проверяем Telegram…"
            : "Проверить Telegram (тест в чат)"}
        </button>
        {tgMsg && <p className="text-sm text-foreground">{tgMsg}</p>}
        {tgErr && (
          <p className="text-sm text-chili" role="alert">
            {tgErr}
          </p>
        )}
      </section>

      <form
        onSubmit={onCafe}
        className="max-w-lg space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <h3 className="text-sm font-semibold">Кафе</h3>
        <label className="block text-sm">
          <span className="font-medium">Телефон</span>
          <input
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Адрес</span>
          <input
            value={cafeAddress}
            onChange={(e) => setCafeAddress(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Часы работы</span>
          <input
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            placeholder="Пн–Вс 10:00–22:00"
          />
        </label>
        {cafeMsg && <p className="text-sm">{cafeMsg}</p>}
        <button
          type="submit"
          disabled={cafeMut.isPending}
          className="w-full rounded-md bg-grill px-4 py-2.5 text-sm font-semibold text-mustard disabled:opacity-60"
        >
          {cafeMut.isPending ? "Сохраняем…" : "Сохранить контакты"}
        </button>
      </form>

      <form
        onSubmit={onTelegram}
        className="max-w-lg space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <h3 className="text-sm font-semibold">Telegram</h3>
        <p className="text-xs text-muted-foreground">
          Токен от @BotFather. Chat id — напишите боту /start или /chatid.
          {data?.telegram.hasToken
            ? ` Сейчас: ${data.telegram.botTokenMasked}`
            : " Токен ещё не задан."}
        </p>
        <label className="block text-sm">
          <span className="font-medium">Bot token</span>
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            placeholder="Оставьте пустым, чтобы не менять"
            autoComplete="off"
          />
        </label>

        <div className="space-y-2 text-sm">
          <span className="font-medium">Получатели (chat id)</span>
          {chatIdList.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Пока никого нет — добавьте хотя бы один chat id.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {chatIdList.map((id, index) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm tabular-nums">{id}</p>
                    {index === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        основной (правка статуса в этом чате)
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChatId(id)}
                    className="shrink-0 text-xs font-medium text-chili hover:underline"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addChatId();
                }
              }}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2"
              placeholder="Новый chat id"
              inputMode="numeric"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={addChatId}
              disabled={!newChatId.trim()}
              className="shrink-0 rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              Добавить
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Изменения применятся после «Сохранить Telegram».
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="submit"
            disabled={tgMut.isPending}
            className="w-full rounded-md bg-grill px-4 py-2.5 text-sm font-semibold text-mustard disabled:opacity-60"
          >
            {tgMut.isPending ? "Сохраняем…" : "Сохранить Telegram"}
          </button>
          <button
            type="button"
            disabled={testMut.isPending}
            onClick={() => testMut.mutate()}
            className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {testMut.isPending ? "Проверка…" : "Проверить бота"}
          </button>
        </div>
      </form>
    </div>
  );
}
