import { Link, useLocation, useParams } from "react-router-dom";
import { usePublicLegalDocument } from "@/features/legal/api/useLegal";
import { LegalDocumentHtml } from "@/features/legal/components/LegalRichTextEditor";

function formatRuDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function resolveSlug(
  pathname: string,
  paramSlug: string | undefined,
): string {
  if (paramSlug) return paramSlug;
  const part = pathname.replace(/^\//, "").split("/")[0] ?? "";
  return part;
}

export default function LegalDocumentPage() {
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const { pathname } = useLocation();
  const slug = resolveSlug(pathname, paramSlug);
  const { data, isPending, isError, error } = usePublicLegalDocument(slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        to="/"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← На главную
      </Link>

      {isPending ? (
        <p className="mt-8 text-sm text-muted-foreground">Загрузка…</p>
      ) : isError ? (
        <div className="mt-8 space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Документ недоступен
          </h1>
          <p className="text-sm text-chili" role="alert">
            {(error as Error).message || "Документ не опубликован"}
          </p>
        </div>
      ) : data ? (
        <article className="mt-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {data.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Редакция от {formatRuDate(data.publishedAt)}
            {" · "}
            версия {data.version}
          </p>
          <LegalDocumentHtml html={data.content} className="mt-8" />
        </article>
      ) : null}
    </div>
  );
}
