function highlight(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent * 2);
  const pad2 = " ".repeat((indent + 1) * 2);

  if (value === null) return `<span class="text-muted-foreground/60">null</span>`;
  if (typeof value === "boolean") return `<span class="text-orange-400">${value}</span>`;
  if (typeof value === "number") return `<span class="text-amber-400">${value}</span>`;

  if (typeof value === "string") {
    const baseIndent = " ".repeat((indent + 1) * 2);
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, `\n${baseIndent}`);
    return `<span class="text-emerald-400">"${escaped}"</span>`;
  }

  if (Array.isArray(value)) {
    if (!value.length) return `<span class="text-muted-foreground">[]</span>`;
    const items = value.map((v) => `${pad2}${highlight(v, indent + 1)}`).join(",\n");
    return `<span class="text-muted-foreground">[</span>\n${items}\n${pad}<span class="text-muted-foreground">]</span>`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    if (!keys.length) return `<span class="text-muted-foreground">{}</span>`;
    const items = keys
      .map(
        (k) =>
          `${pad2}<span class="text-violet-400">"${k}"</span><span class="text-muted-foreground">: </span>${highlight((value as Record<string, unknown>)[k], indent + 1)}`,
      )
      .join(",\n");
    return `<span class="text-muted-foreground">{</span>\n${items}\n${pad}<span class="text-muted-foreground">}</span>`;
  }

  return String(value);
}

export function JsonViewer({ value }: { value: unknown }) {
  const parsed = typeof value === "string" ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value;
  const html = highlight(parsed);

  return (
    <div className="bg-muted/50 border border-border/60 rounded-md p-3 mt-4 max-h-60 overflow-auto">
      <pre
        className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-all m-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}