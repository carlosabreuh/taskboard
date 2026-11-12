"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyPlan, planMyDay, type PlanResult } from "@/app/ai-actions";
import { formatDue } from "@/lib/dates";
import { Sparkle } from "./quick-add";

export function PlanMyDay({ openCount }: { openCount: number }) {
  const [result, setResult] = useState<PlanResult | null>(null);
  const [pending, start] = useTransition();
  const [applying, startApply] = useTransition();
  const [applied, setApplied] = useState(false);
  const router = useRouter();

  if (openCount === 0) return null;

  function run() {
    setApplied(false);
    start(async () => setResult(await planMyDay()));
  }

  if (!result) {
    return (
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="btn-ghost -ml-1 gap-2 text-accent-ink dark:text-accent"
      >
        <Sparkle />
        {pending ? "Looking at everything…" : "Plan my day"}
      </button>
    );
  }

  if (!result.ok) {
    return (
      <p className="text-sm text-danger">
        {result.error}{" "}
        <button type="button" onClick={run} className="font-semibold underline">
          Try again
        </button>
      </p>
    );
  }

  const { plan, tasks } = result;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line bg-accent-soft/60 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-bold text-accent-ink dark:text-accent">
          <Sparkle /> Today, in order
        </p>
        <p className="mt-0.5 text-sm text-ink-2">{plan.headline}</p>
      </div>

      <ol className="divide-y divide-line/70">
        {plan.items.map((it, i) => {
          const t = tasks[it.id];
          return (
            <li key={it.id} className="flex gap-3 px-4 py-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-bold text-ink-2">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-medium">{t.title}</p>
                <p className="text-xs text-ink-3">
                  {it.reason}
                  {t.project ? ` · ${t.project}` : ""}
                  {t.due_date ? ` · ${formatDue(t.due_date)}` : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {plan.parked.length > 0 && (
        <details className="border-t border-line px-4 py-2.5">
          <summary className="cursor-pointer text-xs font-semibold text-ink-3">
            Can wait ({plan.parked.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {plan.parked.map((it) => (
              <li key={it.id} className="text-xs text-ink-2">
                <span className="font-medium text-ink">{tasks[it.id].title}</span> — {it.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-line px-3 py-2.5">
        <button type="button" onClick={() => setResult(null)} className="btn-ghost text-xs">
          Dismiss
        </button>
        <button type="button" onClick={run} disabled={pending} className="btn-ghost text-xs">
          {pending ? "Thinking…" : "Redo"}
        </button>
        <button
          type="button"
          disabled={applying || applied}
          onClick={() =>
            startApply(async () => {
              const r = await applyPlan(plan.items.map((i) => i.id));
              if (r.ok) {
                setApplied(true);
                router.refresh();
              }
            })
          }
          className="btn-primary text-xs"
        >
          {applied ? "Applied" : applying ? "Applying…" : "Use this order"}
        </button>
      </div>
    </div>
  );
}
