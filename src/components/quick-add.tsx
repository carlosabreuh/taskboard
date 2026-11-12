"use client";

import { useRef, useState } from "react";
import { createTask } from "@/app/actions";
import type { Project } from "@/lib/types";

type ProjectOption = Pick<Project, "id" | "name" | "color">;

export function QuickAdd({
  projects,
  projectId,
  defaultDue,
}: {
  projects: ProjectOption[];
  /** Lock the task to this project (hides the project picker). */
  projectId?: string;
  defaultDue?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (form) => {
        await createTask(form);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="card p-3.5"
    >
      {projectId && <input type="hidden" name="project_id" value={projectId} />}
      <div className="flex items-center gap-2">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line text-ink-3">
          +
        </span>
        <input
          name="title"
          placeholder="Add a task… (press Enter)"
          required
          autoComplete="off"
          onFocus={() => setOpen(true)}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
        />
        <button type="submit" className="btn-primary py-1.5 text-xs">
          Add
        </button>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 sm:grid-cols-4">
          {!projectId && (
            <select name="project_id" defaultValue="" className="input">
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <select name="priority" defaultValue="normal" className="input">
            <option value="low">Low priority</option>
            <option value="normal">Normal priority</option>
            <option value="high">High priority</option>
          </select>
          <input
            type="date"
            name="due_date"
            defaultValue={defaultDue ?? ""}
            className="input"
            aria-label="Due date"
          />
          <input
            name="notes"
            placeholder="Notes"
            className={`input ${projectId ? "sm:col-span-2" : ""}`}
          />
        </div>
      )}
    </form>
  );
}
