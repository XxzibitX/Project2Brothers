import { useState } from "react";
import type { MenuExtra } from "@/api";
import {
  useCreateExtra,
  useDeleteExtra,
  useManagerExtras,
  useUpdateExtra,
} from "@/features/manager/api/useManagerExtras";
import { useToast } from "@/shared/ui/toast";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export function ManagerExtrasPanel() {
  const { data, isPending, isError, error } = useManagerExtras();
  const createExtra = useCreateExtra();
  const updateExtra = useUpdateExtra();
  const deleteExtra = useDeleteExtra();
  const toast = useToast();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("50");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const items = data?.items ?? [];

  const onCreate = async () => {
    setFormError(null);
    const trimmed = name.trim();
    const priceNum = Number(price);
    if (!trimmed) {
      setFormError("Введите название допа");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFormError("Укажите корректную цену");
      return;
    }
    try {
      await createExtra.mutateAsync({ name: trimmed, price: priceNum });
      setName("");
      setPrice("50");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось создать");
    }
  };

  const startEdit = (extra: MenuExtra) => {
    setEditingKey(extra.key);
    setEditName(extra.name);
    setEditPrice(String(extra.price));
    setFormError(null);
  };

  const onSaveEdit = async () => {
    if (!editingKey) return;
    setFormError(null);
    const trimmed = editName.trim();
    const priceNum = Number(editPrice);
    if (!trimmed) {
      setFormError("Введите название");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFormError("Укажите корректную цену");
      return;
    }
    try {
      await updateExtra.mutateAsync({
        key: editingKey,
        body: { name: trimmed, price: priceNum },
      });
      setEditingKey(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось сохранить");
    }
  };

  const onDelete = async (extra: MenuExtra) => {
    if (
      !window.confirm(
        `Удалить доп «${extra.name}»? Он также пропадёт из всех товаров.`,
      )
    ) {
      return;
    }
    setFormError(null);
    try {
      await deleteExtra.mutateAsync(extra.key);
      if (editingKey === extra.key) setEditingKey(null);
      toast.success(`Доп «${extra.name}» удалён`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось удалить";
      setFormError(message);
      toast.error(message);
    }
  };

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Загрузка допов…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-chili">
        {error instanceof Error ? error.message : "Ошибка загрузки допов"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Новый доп</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Справочник для всех товаров. Потом выбираете нужные в карточке
          товара.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-[180px] flex-1 text-sm">
            <span className="font-medium">Название</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Сыр, халапеньо…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="w-28 text-sm">
            <span className="font-medium">Цена (₽)</span>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={onCreate}
            disabled={createExtra.isPending}
            className="rounded-md bg-mustard px-4 py-2 text-sm font-bold text-grill disabled:opacity-60"
          >
            Добавить
          </button>
        </div>
        {formError && (
          <p className="mt-2 text-sm text-chili" role="alert">
            {formError}
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          {items.length} допов в справочнике
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Пока пусто — добавьте первый доп выше.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((extra) => (
              <li
                key={extra.key}
                className="rounded-xl border border-border bg-card p-3 sm:p-4"
              >
                {editingKey === extra.key ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="min-w-[160px] flex-1 text-sm">
                      <span className="font-medium">Название</span>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                      />
                    </label>
                    <label className="w-28 text-sm">
                      <span className="font-medium">Цена</span>
                      <input
                        type="number"
                        min={0}
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={onSaveEdit}
                      disabled={updateExtra.isPending}
                      className="rounded-md bg-grill px-3 py-2 text-sm font-semibold text-mustard disabled:opacity-60"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingKey(null)}
                      className="rounded-md border border-border px-3 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{extra.name}</p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        {formatPrice(extra.price)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(extra)}
                        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(extra)}
                        disabled={deleteExtra.isPending}
                        className="rounded-md border border-chili/30 px-3 py-1.5 text-sm font-medium text-chili disabled:opacity-60"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
