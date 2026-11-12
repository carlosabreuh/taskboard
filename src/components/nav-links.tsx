"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@/lib/types";

type NavProject = Pick<Project, "id" | "name" | "color" | "status">;

function Item({
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
      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-surface-2 font-medium text-ink"
          : "text-ink-2 hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function NavLinks({ projects }: { projects: NavProject[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3 md:pb-6">
      <Item href="/" active={pathname === "/"}>
        <span className="w-4 text-center">☀︎</span> Today
      </Item>
      <Item href="/inbox" active={pathname === "/inbox"}>
        <span className="w-4 text-center">▤</span> All tasks
      </Item>
      <Item href="/projects" active={pathname === "/projects"}>
        <span className="w-4 text-center">◫</span> Projects
      </Item>

      <div className="hidden md:block">
        <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Projects
        </p>
        {projects.length === 0 && (
          <p className="px-3 text-xs text-ink-3">None yet</p>
        )}
        {projects.map((p) => (
          <Item
            key={p.id}
            href={`/projects/${p.id}`}
            active={pathname === `/projects/${p.id}`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: p.color }}
            />
            <span className={`truncate ${p.status === "done" ? "line-through text-ink-3" : ""}`}>
              {p.name}
            </span>
          </Item>
        ))}
        <Link
          href="/projects/new"
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-accent hover:bg-surface-2"
        >
          <span className="w-4 text-center">+</span> New project
        </Link>
      </div>
    </nav>
  );
}
