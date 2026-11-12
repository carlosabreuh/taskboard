"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProject, setProjectStatus, updateProject } from "@/app/actions";
import { ProjectFields } from "./project-form";
import { formatDue, isOverdue } from "@/lib/dates";
import { PROJECT_STATUS_LABEL, type Project } from "@/lib/types";

export function ProjectHeader({
  project,
  done,
  total,
}: {
  project: Project;
  done: number;
  total: number;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pct = total ? Math.round((done / total) * 100) : 0;
  const overdue = project.status === "active" && isOverdue(project.due_date);

  if (editing) {
    return (
      <form
        action={async (form) => {
          await updateProject(project.id, form);
          setEditing(false);
          router.refresh();
        }}
        className="card mb-8 space-y-5 p-6"
      >
        <ProjectFields project={project} />
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="btn-danger -ml-3"
            disabled={pending}
            onClick={() => {
              if (
                confirm(
                  `Delete "${project.name}" and all ${total} of its tasks? This can't be undone.`,
                )
              ) {
                startTransition(() => deleteProject(project.id));
              }
            }}
          >
            Delete project
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <header className="mb-8">
      <div className="flex items-start gap-3">
        <span
          className="mt-2 h-4 w-4 shrink-0 rounded-full"
          style={{ background: project.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {project.name}
            </h1>
            {project.status !== "active" && (
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-ink-2">
                {PROJECT_STATUS_LABEL[project.status]}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-ink-2">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
            <span>
              {done}/{total} done · {pct}%
            </span>
            {project.due_date && (
              <span className={overdue ? "font-medium text-danger" : ""}>
                Target {formatDue(project.due_date)}
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${pct}%`, background: project.color }}
            />
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {project.status === "active" && total > 0 && done === total && (
            <button
              className="btn-ghost text-ok"
              disabled={pending}
              onClick={() =>
                startTransition(() => setProjectStatus(project.id, "done"))
              }
            >
              Mark done
            </button>
          )}
          <button className="btn-ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
      </div>
    </header>
  );
}
