"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@/lib/types";

type NavProject = Pick<Project, "id" | "name" | "color" | "status">;

const SunIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
  </svg>
);
const ListIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);
const FolderIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const PRIMARY = [
  { href: "/", label: "Today", icon: SunIcon },
  { href: "/inbox", label: "All tasks", icon: ListIcon },
  { href: "/projects", label: "Projects", icon: FolderIcon },
];

function SideItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors duration-150 ${
        active
          ? "bg-accent-soft font-bold text-ink"
          : "font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function NavLinks({ projects }: { projects: NavProject[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {PRIMARY.map((item) => (
        <SideItem key={item.href} href={item.href} active={pathname === item.href}>
          <span className="text-ink-3">{item.icon}</span>
          {item.label}
        </SideItem>
      ))}

      <p className="mt-6 mb-1 px-3 text-xs font-bold text-ink-3">Projects</p>
      {projects.length === 0 && (
        <p className="px-3 text-xs text-ink-3">None yet</p>
      )}
      {projects.map((p) => (
        <SideItem
          key={p.id}
          href={`/projects/${p.id}`}
          active={pathname === `/projects/${p.id}`}
        >
          <span
            className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: p.color }}
          />
          <span
            className={`truncate ${p.status === "done" ? "text-ink-3 line-through" : ""}`}
          >
            {p.name}
          </span>
        </SideItem>
      ))}
      <Link
        href="/projects/new"
        className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-accent-ink/80 hover:bg-accent-soft dark:text-accent"
      >
        <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[13px] font-bold leading-none text-accent-ink">
          +
        </span>
        New project
      </Link>

      <SideItem href="/trash" active={pathname === "/trash"}>
        <span className="text-ink-3">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </span>
        Recently deleted
      </SideItem>
    </nav>
  );
}

/** Bottom tab bar, phones only. */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md justify-around">
        {PRIMARY.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
                  active ? "text-accent-ink dark:text-accent" : "text-ink-3"
                }`}
              >
                <span
                  className={`rounded-full px-4 py-1 transition-colors ${
                    active ? "bg-accent-soft" : ""
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
