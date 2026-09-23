const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "blockquote",
  "h2",
  "ul",
  "ol",
  "li",
]);

/** Keep a small set of formatting tags and drop every attribute. */
export function sanitizePoemHtml(raw: string): string {
  const withoutDanger = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      "",
    )
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "");

  return withoutDanger
    .replace(/<\/?([a-z0-9]+)[^>]*>/gi, (match, tag: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED.has(name)) return "";
      if (name === "br") return "<br>";
      if (match.startsWith("</")) return `</${name}>`;
      return `<${name}>`;
    })
    .trim();
}

export function poemExcerpt(html: string, max = 180): string {
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|h2|li|blockquote)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
