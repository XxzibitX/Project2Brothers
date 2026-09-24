import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronRight } from "lucide-react";
import type {
  Product,
  ProductExtra,
  ProductIngredient,
  UpsertProductDto,
} from "@/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateCategory,
  useCategories,
  useDeleteCategory,
} from "@/features/manager/api/useCategories";
import {
  useCreateExtra,
  useManagerExtras,
} from "@/features/manager/api/useManagerExtras";
import {
  useCreateProduct,
  useDeleteProduct,
  useManagerProducts,
  useUpdateProduct,
  useUploadProductImage,
} from "@/features/manager/api/useManagerProducts";
import {
  ExtraPicker,
  IngredientPicker,
} from "@/features/manager/components/ModifierPickers";
import { ProductImage } from "@/components/ProductImage";
import { useToast } from "@/shared/ui/toast";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  description: string;
  price: string;
  weight: string;
  category: string;
  image: string;
  popular: boolean;
  ingredients: ProductIngredient[];
  extras: ProductExtra[];
};

const emptyForm = (category = ""): FormState => ({
  name: "",
  description: "",
  price: "",
  weight: "",
  category,
  image: "",
  popular: false,
  ingredients: [],
  extras: [],
});

function productToForm(product: Product): FormState {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    weight: product.weight,
    category: product.category,
    image: product.image,
    popular: Boolean(product.popular),
    ingredients: [...(product.ingredients ?? [])],
    extras: [...(product.extras ?? [])],
  };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export function ManagerMenuPanel() {
  const { data: productsData, isPending, isError, error } = useManagerProducts();
  const { data: categoriesData } = useCategories();
  const { data: extrasData } = useManagerExtras();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createExtra = useCreateExtra();
  const toast = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  /** Развёрнутые категории (по умолчанию все свёрнуты) */
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleCategory = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const items = productsData?.items ?? [];
  const categories = categoriesData?.items ?? [];
  const isEditing = creating || editingId != null;
  const saving =
    createProduct.isPending ||
    updateProduct.isPending ||
    uploadImage.isPending;

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setFormError(null);
    try {
      const { url } = await uploadImage.mutateAsync(file);
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Не удалось загрузить изображение",
      );
    }
  };

  const ingredientOptions = useMemo(() => {
    const map = new Map<string, ProductIngredient>();
    for (const product of items) {
      for (const ing of product.ingredients ?? []) {
        if (!map.has(ing.id)) map.set(ing.id, ing);
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [items]);

  const extraOptions = useMemo(() => {
    const fromCatalog = (extrasData?.items ?? []).map((e) => ({
      id: e.key,
      name: e.name,
      price: e.price,
    }));
    if (fromCatalog.length > 0) return fromCatalog;
    // fallback: уникальные допы с товаров
    const map = new Map<string, ProductExtra>();
    for (const product of items) {
      for (const extra of product.extras ?? []) {
        if (!map.has(extra.id)) map.set(extra.id, extra);
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [extrasData?.items, items]);

  const grouped = useMemo(() => {
    const byKey = new Map<string, Product[]>();
    for (const product of items) {
      const list = byKey.get(product.category) ?? [];
      list.push(product);
      byKey.set(product.category, list);
    }
    const known = categories.map((c) => ({
      key: c.key,
      name: c.name,
      products: byKey.get(c.key) ?? [],
    }));
    const knownKeys = new Set(categories.map((c) => c.key));
    const orphanKeys = [...byKey.keys()].filter((k) => !knownKeys.has(k));
    const orphans = orphanKeys.map((key) => ({
      key,
      name: key,
      products: byKey.get(key) ?? [],
    }));
    return [...known, ...orphans];
  }, [items, categories]);

  useEffect(() => {
    if (!editingId) return;
    const product = items.find((p) => p.id === editingId);
    if (product) setForm(productToForm(product));
  }, [editingId, items]);

  const openCreate = (categoryKey?: string) => {
    setEditingId(null);
    setCreating(true);
    setForm(
      emptyForm(categoryKey || categories[0]?.key || ""),
    );
    setFormError(null);
  };

  const openEdit = (product: Product) => {
    setCreating(false);
    setEditingId(product.id);
    setForm(productToForm(product));
    setFormError(null);
  };

  const closeForm = () => {
    setCreating(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const price = Number(form.price);
    if (!form.name.trim() || !form.description.trim() || !form.image.trim()) {
      setFormError("Заполните название, описание и URL картинки");
      return;
    }
    if (!form.category) {
      setFormError("Выберите категорию");
      return;
    }
    if (!form.image.trim()) {
      setFormError("Загрузите изображение товара");
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setFormError("Укажите корректную цену");
      return;
    }

    const body: UpsertProductDto = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      weight: form.weight.trim() || "—",
      category: form.category,
      image: form.image.trim(),
      popular: form.popular,
      ingredients: form.ingredients,
      extras: form.extras,
    };

    try {
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, body });
      } else {
        await createProduct.mutateAsync(body);
      }
      closeForm();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Не удалось сохранить товар",
      );
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Удалить товар из меню?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      if (editingId === id) closeForm();
      toast.success("Товар удалён из меню");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось удалить товар",
      );
    }
  };

  const onAddCategory = async () => {
    setCategoryError(null);
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError("Введите название категории");
      return;
    }
    try {
      await createCategory.mutateAsync({ name });
      setNewCategoryName("");
      toast.success("Категория добавлена");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось создать категорию";
      setCategoryError(message);
      toast.error(message);
    }
  };

  const onDeleteCategory = async (key: string, name: string) => {
    if (!window.confirm(`Удалить категорию «${name}»?`)) return;
    setCategoryError(null);
    try {
      await deleteCategory.mutateAsync(key);
      toast.success(`Категория «${name}» удалена`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось удалить категорию";
      setCategoryError(message);
      toast.error(message);
    }
  };

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Загрузка меню…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-chili">
        {error instanceof Error ? error.message : "Ошибка загрузки меню"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[200px] flex-1 text-sm">
            <span className="font-medium">Новая категория</span>
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Например: Десерты"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={onAddCategory}
            disabled={createCategory.isPending}
            className="rounded-md bg-mustard px-3 py-2 text-sm font-bold text-grill disabled:opacity-60"
          >
            Добавить категорию
          </button>
        </div>
        {categoryError && (
          <p className="mt-2 text-sm text-chili" role="alert">
            {categoryError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{items.length} позиций</p>
        <button
          type="button"
          onClick={() => openCreate()}
          className="rounded-md bg-grill px-3 py-2 text-sm font-semibold text-mustard"
        >
          Добавить товар
        </button>
      </div>

      <Dialog
        open={isEditing}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card text-foreground sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              {editingId ? "Редактирование товара" : "Новый товар"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Измените данные и сохраните"
                : "Заполните карточку товара"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-3 text-sm">
              <span className="block text-center font-medium">Изображение</span>
              <div className="flex flex-col items-center gap-3">
                <div className="relative aspect-[4/3] w-full max-w-[220px] overflow-hidden rounded-lg border border-border bg-muted">
                  {form.image ? (
                    <ProductImage
                      src={form.image}
                      alt=""
                      priority
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="grid h-full place-items-center px-3 text-center text-xs text-muted-foreground">
                      Нет изображения
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-grill px-4 py-2 text-sm font-semibold text-mustard transition hover:brightness-110 disabled:opacity-60">
                    {uploadImage.isPending ? "Загрузка…" : "Загрузить файл"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={saving}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        void onPickImage(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WEBP или GIF, до 5 МБ — сохранится как сжатый WebP
                  </p>
                  {form.image ? (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => setForm((f) => ({ ...f, image: "" }))}
                    >
                      Убрать изображение
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Название</span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Цена (₽)</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Вес</span>
                <input
                  value={form.weight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weight: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  placeholder="350 г"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Категория</span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  required
                >
                  <option value="" disabled>
                    Выберите…
                  </option>
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="font-medium">Описание</span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                required
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.popular}
                onChange={(e) =>
                  setForm((f) => ({ ...f, popular: e.target.checked }))
                }
              />
              Популярное
            </label>

            <IngredientPicker
              label="Что можно убрать"
              value={form.ingredients}
              options={ingredientOptions}
              onChange={(ingredients) =>
                setForm((f) => ({ ...f, ingredients }))
              }
            />

            <ExtraPicker
              label="Допы"
              hint="Список из вкладки «Допы». Можно создать новый прямо здесь."
              value={form.extras}
              options={extraOptions}
              onChange={(extras) => setForm((f) => ({ ...f, extras }))}
              onCreateNew={async (name, price) => {
                const created = await createExtra.mutateAsync({ name, price });
                return {
                  id: created.key,
                  name: created.name,
                  price: created.price,
                };
              }}
            />

            {formError && (
              <p className="text-sm text-chili" role="alert">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeForm}
                className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-grill px-4 py-2.5 text-sm font-semibold text-mustard disabled:opacity-60"
              >
                {saving ? "Сохраняем…" : "Сохранить"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {grouped.map((group) => {
          const expanded = expandedKeys.has(group.key);
          return (
            <section
              key={group.key}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => toggleCategory(group.key)}
                  className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left transition hover:bg-muted/40"
                  aria-expanded={expanded}
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      expanded && "rotate-90",
                    )}
                  />
                  <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
                    {group.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {group.products.length}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5 pr-3">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedKeys((prev) => new Set(prev).add(group.key));
                      openCreate(group.key);
                    }}
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium sm:text-sm"
                  >
                    + Товар
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(group.key, group.name)}
                    disabled={deleteCategory.isPending}
                    className="rounded-md border border-chili/30 px-2.5 py-1.5 text-xs font-medium text-chili disabled:opacity-60 sm:text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="space-y-3 border-t border-border px-4 py-3">
                  {group.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Пока пусто</p>
                  ) : (
                    <ul className="space-y-3">
                      {group.products.map((product) => (
                        <li
                          key={product.id}
                          className={cn(
                            "rounded-xl border border-border bg-background p-4",
                            editingId === product.id && "ring-1 ring-mustard",
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 flex-1 gap-3">
                              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:size-20">
                                {product.image ? (
                                  <ProductImage
                                    src={product.image}
                                    alt=""
                                    className="h-full w-full"
                                  />
                                ) : (
                                  <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
                                    Нет фото
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold">{product.name}</p>
                                  {product.popular && (
                                    <span className="rounded-md bg-mustard/25 px-1.5 py-0.5 text-[11px] font-semibold text-grill">
                                      Хит
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                  {product.description}
                                </p>
                                <p className="mt-1 text-sm font-bold tabular-nums">
                                  {formatPrice(product.price)} · {product.weight}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Убрать:{" "}
                                  {(product.ingredients ?? [])
                                    .map((i) => i.name)
                                    .join(", ") || "—"}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  Допы:{" "}
                                  {(product.extras ?? [])
                                    .map((e) => `${e.name} (+${e.price}₽)`)
                                    .join(", ") || "—"}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(product)}
                                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
                              >
                                Изменить
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(product.id)}
                                disabled={deleteProduct.isPending}
                                className="rounded-md border border-chili/30 px-3 py-1.5 text-sm font-medium text-chili disabled:opacity-60"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
