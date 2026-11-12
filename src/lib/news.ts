import "server-only";

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  date: string | null;
}

const FEEDS: { url: string; source: string; take: number }[] = [
  {
    url:
      "https://news.google.com/rss/search?q=" +
      encodeURIComponent(
        '("chiari malformation" OR syringomyelia OR "ehlers-danlos") (university OR study OR researchers OR neurosurgery)',
      ) +
      "&hl=en-US&gl=US&ceid=US:en",
    source: "Research",
    take: 4,
  },
];

function pick(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return null;
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parse(xml: string, source: string, take: number): NewsItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  const out: NewsItem[] = [];
  for (const it of items) {
    const title = pick(it, "title");
    const url = pick(it, "link");
    if (!title || !url) continue;
    const date = pick(it, "pubDate");
    const src = pick(it, "source");
    out.push({
      // Google News titles end with " - Outlet"; keep the outlet as the source line instead.
      title: src ? title.replace(new RegExp(`\\s*-\\s*${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "") : title,
      url,
      source: src ?? source,
      date: date ? new Date(date).toISOString() : null,
    });
    if (out.length >= take) break;
  }
  return out;
}

/** Latest items, cached by the platform for 6 hours. Never throws. */
export async function getFieldNews(): Promise<NewsItem[]> {
  const results = await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const res = await fetch(f.url, {
          next: { revalidate: 21600 },
          headers: { "user-agent": "Taskboard/1.0 (+personal task tracker)" },
        });
        if (!res.ok) return [];
        return parse(await res.text(), f.source, f.take);
      } catch {
        return [];
      }
    }),
  );
  return results.flat();
}
