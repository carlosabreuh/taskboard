"use client";

import { useTransition } from "react";
import {
  destroyProject,
  destroyTask,
  emptyTrash,
  restoreProject,
  restoreTask,
} from "@/app/actions";
import type { Project, Task } from "@/lib/types";

type TrashTask = Task & { projects: { id: string; name: string; color: string } | null };

function daysLeft(deletedAt: string | null): number {
  if (!deletedAt) return 30;
  const gone = (Date.now() - new Date(deletedAt).getTime()) / 86400000;
  return Math.max(0, Math.ceil(30 - gone));
}

export function TrashList({
  tasks,
  projects,
}: {
  tasks: TrashTask[];
  projects: Project[];
}) {
  const [pending, start] = useTransition();
  const empty = tasks.length === 0 && projects.length === 0;

  if (empty) {
    return (
      <div className="card p-8 text-center text-sm text-ink-3">
        Nothing deleted recently.
      </div>
    );
  }

  return (
    <div className={pending ? "opacity-60" : ""}>
      {projects.length > 0 && (
        <section className="mb-7">
          <h2 className="mb-2 px-3 text-[15px] font-bold">Projects</h2>
          <ul className="card divide-y divide-line/70 px-2 py-1">
            {projects.map((p) => (
              <Row
                key={p.id}
                title={p.name}
                meta={`Restores its tasks too · ${daysLeft(p.deleted_at)} days left`}
                color={p.color}
                onRestore={() => start(() => restoreProject(p.id))}
                onDestroy={() => {
                  if (confirm(`Permanently delete "${p.name}" and its tasks?`))
                    start(() => destroyProject(p.id));
                }}
              />
            ))}
          </ul>
        </section>
      )}

      {tasks.length > 0 && (
        <section className="mb-7">
          <h2 className="mb-2 px-3 text-[15px] font-bold">Tasks</h2>
          <ul className="card divide-y divide-line/70 px-2 py-1">
            {tasks.map((t) => (
              <Row
                key={t.id}
                title={t.title}
                meta={[t.projects?.name, `${daysLeft(t.deleted_at)} days left`].filter(Boolean).join(" · ")}
                color={t.projects?.color}
                onRestore={() => start(() => restoreTask(t.id))}
                onDestroy={() => {
                  if (confirm(`Permanently delete "${t.title}"?`))
                    start(() => destroyTask(t.id));
                }}
              />
            ))}
          </ul>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="btn-danger text-xs"
          onClick={() => {
            if (confirm("Permanently delete everything in Recently deleted?"))
              start(() => emptyTrash());
          }}
        >
          Empty recently deleted
        </button>
      </div>
    </div>
  );
}

function Row({
  title,
  meta,
  color,
  onRestore,
  onDestroy,
}: {
  title: string;
  meta: string;
  color?: string;
  onRestore: () => void;
  onDestroy: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-2 py-2.5">
      {color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{title}</p>
        <p className="text-xs text-ink-3">{meta}</p>
      </div>
      <button type="button" onClick={onRestore} className="btn-ghost text-xs text-accent-ink dark:text-accent">
        Restore
      </button>
      <button type="button" onClick={onDestroy} className="btn-danger text-xs" aria-label={`Delete ${title} forever`}>
        Delete forever
      </button>
    </li>
  );
}
