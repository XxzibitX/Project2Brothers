export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-grill text-white">
      {/* Tiny placeholder while full hero loads */}
      <img
        src="/hero-shawarma-blur.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
      />
      <picture>
        <source
          type="image/webp"
          srcSet="/hero-shawarma-800.webp 800w, /hero-shawarma.webp 1280w"
          sizes="100vw"
        />
        <img
          src="/hero-shawarma.png"
          alt=""
          width={1280}
          height={720}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover animate-fade"
        />
      </picture>
      <div className="hero-grain absolute inset-0" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24">
        <p className="animate-rise font-[family-name:var(--font-display)] text-4xl font-semibold leading-none tracking-tight text-mustard sm:text-5xl md:text-7xl lg:text-8xl">
          2Brothers
        </p>
        <h1 className="animate-rise animate-rise-delay-1 mt-4 max-w-xl font-[family-name:var(--font-display)] text-2xl font-medium leading-tight tracking-tight sm:text-3xl md:text-4xl">
          Шаурма с гриля — горячая, сочная, без компромиссов
        </h1>
        <p className="animate-rise animate-rise-delay-2 mt-4 max-w-md text-base text-white/75 sm:text-lg">
          Два брата, один рецепт и заказ онлайн за пару минут.
        </p>
        <div className="animate-rise animate-rise-delay-3 mt-8 flex flex-wrap gap-3">
          <a
            href="#menu"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("menu")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center rounded-md bg-mustard px-6 py-3 text-sm font-bold text-grill transition hover:brightness-105"
          >
            Смотреть меню
          </a>
        </div>
      </div>
    </section>
  );
}
