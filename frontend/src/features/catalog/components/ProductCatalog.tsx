import { useState } from "react";
import { useProducts } from "@/features/catalog/api/useProducts";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { useCategories } from "@/features/manager/api/useCategories";
import { cn } from "@/lib/utils";

export function ProductCatalog() {
  const [category, setCategory] = useState<string>("all");
  const { data: categoriesData } = useCategories();
  const { data, isPending, isFetching, isError, error } = useProducts(
    category === "all" ? {} : { category },
  );

  const items = data?.items ?? [];
  const categories = categoriesData?.items ?? [];
  const showInitialLoading = isPending && items.length === 0;

  return (
    <section id="menu" className="relative scroll-mt-8 bg-ash py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-grill/10 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-chili">
            Меню
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
            Выберите и закажите онлайн
          </h2>
          <p className="mt-3 text-muted-foreground">
            Свежая шаурма, гарниры и напитки — собирайте заказ и забирайте
            горячим.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-md px-3.5 py-2 text-sm font-semibold transition",
              category === "all"
                ? "bg-grill text-mustard"
                : "bg-white text-foreground hover:bg-muted",
            )}
          >
            Всё
          </button>
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={cn(
                "rounded-md px-3.5 py-2 text-sm font-semibold transition",
                category === c.key
                  ? "bg-grill text-mustard"
                  : "bg-white text-foreground hover:bg-muted",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {showInitialLoading && (
          <p className="text-sm text-muted-foreground">Загрузка меню…</p>
        )}
        {isError && (
          <p className="text-sm text-chili">
            {error instanceof Error ? error.message : "Не удалось загрузить меню"}
          </p>
        )}

        {!showInitialLoading && !isError && (
          <div
            className={cn(
              "catalog-grid transition-opacity",
              isFetching && !isPending && "opacity-60",
            )}
          >
            {items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 6}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
