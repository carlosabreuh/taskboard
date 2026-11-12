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

/** A quiet card of what's new in Chiari, syringomyelia and related research. */
export async function FieldNews() {
  const items = await getFieldNews();
  if (items.length === 0) return null;

  return (
    <section className="mb-7">
      <h2 className="mb-2 flex items-baseline justify-between px-3 text-[15px] font-bold text-ink">
        From the field
        <a
          href="https://bobbyjonescsf.org/whatshappening/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-ink-3 hover:text-accent-ink dark:hover:text-accent"
        >
          Bobby Jones CSF ↗
        </a>
      </h2>
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
