import { getFieldNews } from "@/lib/news";

function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Recent university and clinical research news on Chiari, syringomyelia and EDS. */
export async function FieldNews() {
  const items = await getFieldNews();
  if (items.length === 0) return null;

  return (
    <section className="mb-7">
      <h2 className="mb-2 px-3 text-[15px] font-bold text-ink">From the research world</h2>
      <ul className="card divide-y divide-line/70 px-2 py-1">
        {items.map((n) => (
          <li key={n.url}>
            <a
              href={n.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2/70"
            >
              <p className="text-[15px] font-medium leading-snug">{n.title}</p>
              <p className="mt-0.5 text-xs text-ink-3">
                {n.source}
                {n.date ? ` · ${when(n.date)}` : ""}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
