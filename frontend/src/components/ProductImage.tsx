import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Первые карточки в каталоге — без lazy */
  priority?: boolean;
};

export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {!loaded && !failed && (
        <div
          className="absolute inset-0 animate-pulse bg-muted"
          aria-hidden
        />
      )}
      {!failed ? (
        <img
          key={src}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      ) : (
        <div className="grid h-full min-h-[4rem] place-items-center text-xs text-muted-foreground">
          Нет фото
        </div>
      )}
    </div>
  );
}
