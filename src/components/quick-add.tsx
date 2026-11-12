"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/app/actions";
import { smartAddTask } from "@/app/ai-actions";
import { formatDue } from "@/lib/dates";
import type { Project } from "@/lib/types";

type ProjectOption = Pick<Project, "id" | "name" | "color">;

export function QuickAdd({
  projects,
  projectId,
  defaultDue,
  ai = false,
}: {
  projects: ProjectOption[];
  /** Lock the task to this project (hides the project picker). */
  projectId?: string;
  defaultDue?: string;
  /** Natural-language parsing is available on the server. */
  ai?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [smart, setSmart] = useState(ai);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  function flash(text: string, error = false) {
    setToast({ text, error });
    setTimeout(() => setToast(null), error ? 6000 : 3500);
  }

  async function submit(form: FormData) {
    if (smart) {
      const text = String(form.get("title") ?? "");
      startTransition(async () => {
        const r = await smartAddTask(text, projectId ?? null);
        if (r.ok) {
          formRef.current?.reset();
          flash(`Added "${r.title}"${r.due_date ? ` · ${formatDue(r.due_date)}` : ""}`);
          inputRef.current?.focus();
        } else {
          flash(r.error, true);
        }
      });
      return;
    }
    await createTask(form);
    formRef.current?.reset();
    setOpen(false);
  }

  return (
    <div className="relative">
      <form ref={formRef} action={submit} className="card p-3.5">
        {projectId && <input type="hidden" name="project_id" value={projectId} />}
        <div className="flex items-center gap-2">
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line text-ink-3">
            +
          </span>
          <input
            ref={inputRef}
            name="title"
            placeholder={
              smart
                ? "Try “call the vet Friday, high priority”"
                : "Add a task… (press Enter)"
            }
            required
            autoComplete="off"
            disabled={pending}
            onFocus={() => !smart && setOpen(true)}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3 disabled:opacity-60"
          />
          {ai && (
            <button
              type="button"
              onClick={() => {
                setSmart((s) => !s);
                setOpen(smart);
              }}
              aria-pressed={smart}
              title={smart ? "Smart add is on — dates and priority are read from your words" : "Smart add is off"}
              className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors sm:inline-flex ${
                smart ? "bg-accent-soft text-accent-ink dark:text-accent" : "text-ink-3 hover:bg-surface-2"
              }`}
            >
              <Sparkle /> Smart
            </button>
          )}
          <button type="submit" disabled={pending} className="btn-primary py-1.5 text-xs">
            {pending ? "Adding…" : "Add"}
          </button>
        </div>

        {open && !smart && (
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

      {ai && (
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-ink-3 sm:hidden">
          <button type="button" onClick={() => setSmart((s) => !s)} className="font-semibold">
            Smart add: {smart ? "on" : "off"}
          </button>
        </div>
      )}

      {toast && (
        <p
          role="status"
          className={`mt-2 px-2 text-xs font-medium ${toast.error ? "text-danger" : "text-ink-2"}`}
        >
          {toast.text}
        </p>
      )}
    </div>
  );
}

export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 1l1.6 4.4L14 7l-4.4 1.6L8 13l-1.6-4.4L2 7l4.4-1.6z" />
    </svg>
  );
}
