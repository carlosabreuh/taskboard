"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteTask, toggleTaskDone, updateTask } from "@/app/actions";
import { announceDelete } from "./undo-toast";
import { formatDue, isOverdue } from "@/lib/dates";
import {
  PRIORITY_LABEL,
  type Project,
  type TaskWithProject,
} from "@/lib/types";

type ProjectOption = Pick<Project, "id" | "name" | "color">;

export function TaskItem({
  task,
  projects,
  showProject = true,
}: {
  task: TaskWithProject;
  projects: ProjectOption[];
  showProject?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState(task.status === "done");
  const done = pending ? optimisticDone : task.status === "done";
  const overdue = !done && isOverdue(task.due_date);

  function toggle() {
    const next = !done;
    setOptimisticDone(next);
    startTransition(() => toggleTaskDone(task.id, next));
  }

  if (editing) {
    return (
      <li className="card my-1 p-4 ring-2 ring-accent/30">
        <form
          action={async (form) => {
            await updateTask(task.id, form);
            setEditing(false);
          }}
          className="space-y-3"
        >
          <input
            name="title"
            defaultValue={task.title}
            required
            autoFocus
            className="input font-medium"
          />
          <textarea
            name="notes"
            defaultValue={task.notes ?? ""}
            placeholder="Notes"
            rows={2}
            className="input"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="label">Project</label>
              <select
                name="project_id"
                defaultValue={task.project_id ?? ""}
                className="input"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={task.status} className="input">
                <option value="todo">To do</option>
                <option value="doing">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                name="priority"
                defaultValue={task.priority}
                className="input"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Due</label>
              <input
                type="date"
                name="due_date"
                defaultValue={task.due_date ?? ""}
                className="input"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="btn-danger -ml-3"
              onClick={() => {
                startTransition(async () => {
                  await deleteTask(task.id);
                  announceDelete({ kind: "task", id: task.id, label: task.title });
                });
              }}
            >
              Delete
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
      </li>
    );
  }

  return (
    <li
      className={`group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-[background-color,opacity] duration-200 hover:bg-surface-2/70 ${
        done ? "opacity-55" : ""
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={done ? "Mark not done" : "Mark done"}
        className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color] duration-200 ${
          done
            ? "check-done border-accent bg-accent text-accent-ink"
            : "border-line hover:border-accent"
        }`}
      >
        {done && (
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`text-[15px] font-medium transition-colors ${done ? "line-through text-ink-3" : "text-ink"}`}
          >
            {task.title}
          </span>
          {task.status === "doing" && !done && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink dark:text-accent">
              In progress
            </span>
          )}
          {task.priority === "high" && !done && (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
              {PRIORITY_LABEL.high}
            </span>
          )}
        </div>
        {task.notes && (
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-2">{task.notes}</p>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-3">
          {task.due_date && (
            <span className={overdue ? "font-medium text-danger" : ""}>
              {overdue ? "Overdue · " : ""}
              {formatDue(task.due_date)}
            </span>
          )}
          {showProject && task.projects && (
            <span className="inline-flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: task.projects.color }}
              />
              {task.projects.name}
            </span>
          )}
        </div>
      </button>

      {showProject && task.projects && (
        <Link
          href={`/projects/${task.projects.id}`}
          className="hidden shrink-0 text-xs text-ink-3 opacity-0 transition-opacity hover:text-accent group-hover:opacity-100 sm:block"
        >
          Open →
        </Link>
      )}
    </li>
  );
}
