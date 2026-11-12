import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDue, isOverdue } from "@/lib/dates";
import { PROJECT_STATUS_LABEL, type Project } from "@/lib/types";
import { TourButton } from "@/components/welcome-tour";

export const metadata: Metadata = { title: "Projects" };

type ProjectRow = Project & { tasks: { status: string; deleted_at: string | null }[] };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, tasks(status, deleted_at)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const projects = (data ?? []) as ProjectRow[];
  const live = projects.filter((p) => p.status !== "archived");
  const archived = projects.filter((p) => p.status === "archived");

  return (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-ink-2">
            {live.length} project{live.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          + New project
        </Link>
      </header>

      {live.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-2">
            No projects yet. Start one and give it a few tasks.
          </p>
          <Link href="/projects/new" className="btn-primary mt-4">
            Create your first project
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {live.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </ul>
      )}

      <p className="mt-8 text-center text-xs md:hidden">
        <Link href="/trash" className="font-semibold text-ink-3">Recently deleted</Link>
        <span className="mx-2 text-ink-3">·</span>
        <TourButton className="font-semibold text-ink-3" />
      </p>

      {archived.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm text-ink-3">
            Archived ({archived.length})
          </summary>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {archived.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function ProjectCard({ project: p }: { project: ProjectRow }) {
  const live = p.tasks.filter((t) => !t.deleted_at);
  const total = live.length;
  const done = live.filter((t) => t.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const overdue = p.status === "active" && isOverdue(p.due_date);

  return (
    <li>
      <Link
        href={`/projects/${p.id}`}
        className="card block p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5"
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ background: p.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-medium">{p.name}</h3>
              {p.status !== "active" && (
                <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                  {PROJECT_STATUS_LABEL[p.status]}
                </span>
              )}
            </div>
            {p.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-ink-2">
                {p.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-ink-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: p.color }}
                />
              </div>
              <span className="shrink-0">
                {done}/{total}
              </span>
            </div>
            {p.due_date && (
              <p
                className={`mt-2 text-xs ${overdue ? "font-medium text-danger" : "text-ink-3"}`}
              >
                Due {formatDue(p.due_date)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
