import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  useImportLegalDocument,
  useOwnerLegalDocument,
  useOwnerLegalList,
  usePublishLegalDocument,
  useSaveLegalDraft,
} from "@/features/legal/api/useLegal";
import {
  LegalDocumentHtml,
  LegalRichTextEditor,
} from "@/features/legal/components/LegalRichTextEditor";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

function formatRuDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ManagerLegalPanel() {
  const { isOwner } = useAuth();
  const listQuery = useOwnerLegalList(isOwner);
  const [slug, setSlug] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const detailQuery = useOwnerLegalDocument(slug, isOwner && Boolean(slug));
  const saveMut = useSaveLegalDraft();
  const publishMut = usePublishLegalDocument();
  const importMut = useImportLegalDocument();

  useEffect(() => {
    if (!slug && listQuery.data?.items[0]) {
      setSlug(listQuery.data.items[0].slug);
    }
  }, [listQuery.data, slug]);

  useEffect(() => {
    if (detailQuery.data) {
      setContent(detailQuery.data.draftContent || "");
      setTitle(detailQuery.data.title);
      setPreview(false);
      setMsg(null);
      setErr(null);
    }
  }, [detailQuery.data]);

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Раздел доступен только владельцу.
      </p>
    );
  }

  if (listQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (listQuery.isError) {
    return (
      <p className="text-sm text-chili" role="alert">
        {(listQuery.error as Error).message || "Не удалось загрузить документы"}
      </p>
    );
  }

  const items = listQuery.data?.items ?? [];
  const active = items.find((i) => i.slug === slug) ?? null;

  const onSave = async () => {
    if (!slug) return;
    setErr(null);
    setMsg(null);
    try {
      await saveMut.mutateAsync({ slug, content, title });
      setMsg("Черновик сохранён. На сайте он ещё не виден.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка сохранения");
    }
  };

  const onPublish = async () => {
    if (!slug) return;
    if (
      !window.confirm(
        "Опубликовать документ? Будет создана новая версия, она появится на сайте.",
      )
    ) {
      return;
    }
    setErr(null);
    setMsg(null);
    try {
      await saveMut.mutateAsync({ slug, content, title });
      const published = await publishMut.mutateAsync(slug);
      setMsg(`Опубликовано. Версия ${published.version}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка публикации");
    }
  };

  const onImport = async (file: File | undefined) => {
    if (!slug || !file) return;
    setErr(null);
    setMsg(null);
    try {
      const result = await importMut.mutateAsync({ slug, file });
      setContent(result.draftContent);
      setMsg(
        "Текст извлечён и вставлен в черновик. Проверьте содержимое и опубликуйте вручную.",
      );
      setPreview(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка импорта");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Юридические документы</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Черновик → предпросмотр → публикация. На сайте видна только
          опубликованная версия.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((doc) => (
          <div
            key={doc.id}
            className={cn(
              "rounded-xl border border-border bg-card p-4",
              slug === doc.slug && "ring-2 ring-mustard/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{doc.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Версия: {doc.publishedVersion ?? "не опубликована"}
                  {" · "}
                  Изменена: {formatRuDate(doc.draftUpdatedAt ?? doc.publishedAt)}
                  {" · "}
                  Статус:{" "}
                  {doc.status === "published" ? "опубликована" : "черновик"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/${doc.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  На сайте
                </Link>
                <button
                  type="button"
                  onClick={() => setSlug(doc.slug)}
                  className="rounded-md bg-grill px-3 py-1.5 text-xs font-semibold text-mustard"
                >
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slug && active ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{active.title}</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold",
                  !preview
                    ? "bg-mustard/20 text-grill"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                Редактор
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold",
                  preview
                    ? "bg-mustard/20 text-grill"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                Предпросмотр
              </button>
            </div>
          </div>

          <label className="block text-sm">
            <span className="font-medium">Название</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>

          {detailQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Загрузка документа…</p>
          ) : preview ? (
            <div className="rounded-md border border-border bg-background p-4">
              <p className="mb-3 text-xs text-muted-foreground">
                Так документ будет выглядеть на публичной странице (черновик).
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                {title}
              </h1>
              <LegalDocumentHtml html={content} className="mt-4" />
            </div>
          ) : (
            <LegalRichTextEditor value={content} onChange={setContent} />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => onImport(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={importMut.isPending}
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-border px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {importMut.isPending ? "Импорт…" : "Импорт PDF/DOC/DOCX"}
            </button>
            <button
              type="button"
              disabled={saveMut.isPending}
              onClick={() => void onSave()}
              className="rounded-md border border-border px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saveMut.isPending ? "Сохраняем…" : "Сохранить черновик"}
            </button>
            <button
              type="button"
              disabled={publishMut.isPending || saveMut.isPending}
              onClick={() => void onPublish()}
              className="rounded-md bg-grill px-3 py-2 text-sm font-semibold text-mustard disabled:opacity-60"
            >
              {publishMut.isPending ? "Публикуем…" : "Опубликовать"}
            </button>
          </div>

          {msg ? <p className="text-sm text-foreground">{msg}</p> : null}
          {err ? (
            <p className="text-sm text-chili" role="alert">
              {err}
            </p>
          ) : null}

          {detailQuery.data && detailQuery.data.versions.length > 0 ? (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold">История версий</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {detailQuery.data.versions.map((v) => (
                  <li key={v.id}>
                    Версия {v.version}
                    {" · "}
                    {formatRuDate(v.publishedAt)}
                    {v.createdBy ? ` · ${v.createdBy.name}` : ""}
                    {v.version === detailQuery.data.publishedVersion
                      ? " · текущая"
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
