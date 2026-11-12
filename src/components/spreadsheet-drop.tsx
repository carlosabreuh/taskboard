"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { analyzeSpreadsheet, importTasks, type SheetResult } from "@/app/ai-actions";
import { formatDue } from "@/lib/dates";
import { Sparkle } from "./quick-add";

const ACCEPT = ".xlsx,.xls,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";

export function SpreadsheetDrop({
  projectId,
  projectName,
}: {
  projectId: string | null;
  projectName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [result, setResult] = useState<SheetResult | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();
  const [importing, startImport] = useTransition();
  const [done, setDone] = useState<number | null>(null);
  const router = useRouter();

  function handle(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    form.set("context", projectName ? `the project "${projectName}"` : "the all-tasks list");
    setDone(null);
    start(async () => {
      const r = await analyzeSpreadsheet(form);
      setResult(r);
      if (r.ok) setChecked(new Set(r.analysis.tasks.map((_, i) => i)));
    });
  }

  if (result?.ok) {
    const { analysis, filename } = result;
    const all = analysis.tasks.length;
    return (
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-accent-soft/60 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-accent-ink dark:text-accent">
            <Sparkle /> {filename}
          </p>
          <p className="mt-1 text-sm text-ink-2">{analysis.summary}</p>
          {analysis.highlights.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {analysis.highlights.map((h) => (
                <li key={h} className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-ink-2">
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>

        {all > 0 ? (
          <>
            <div className="flex items-center justify-between px-4 pt-3 pb-1 text-xs text-ink-3">
              <span>
                {checked.size} of {all} to add
              </span>
              <button
                type="button"
                className="font-semibold"
                onClick={() =>
                  setChecked(checked.size === all ? new Set() : new Set(analysis.tasks.map((_, i) => i)))
                }
              >
                {checked.size === all ? "None" : "All"}
              </button>
            </div>
            <ul className="max-h-80 divide-y divide-line/70 overflow-y-auto">
              {analysis.tasks.map((t, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer gap-3 px-4 py-2 hover:bg-surface-2/60">
                    <input
                      type="checkbox"
                      checked={checked.has(i)}
                      onChange={(e) => {
                        const next = new Set(checked);
                        if (e.target.checked) next.add(i);
                        else next.delete(i);
                        setChecked(next);
                      }}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium">{t.title}</span>
                      <span className="block text-xs text-ink-3">
                        {[t.due_date && formatDue(t.due_date), t.priority !== "normal" && `${t.priority} priority`, t.notes]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="px-4 py-3 text-sm text-ink-3">No to-dos to pull out of this one.</p>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-line px-3 py-2.5">
          {done !== null && (
            <span className="mr-auto text-xs font-medium text-ink-2">
              Added {done} task{done === 1 ? "" : "s"}
            </span>
          )}
          <button type="button" onClick={() => setResult(null)} className="btn-ghost text-xs">
            Close
          </button>
          {all > 0 && done === null && (
            <button
              type="button"
              disabled={importing || checked.size === 0}
              onClick={() =>
                startImport(async () => {
                  const r = await importTasks(
                    analysis.tasks.filter((_, i) => checked.has(i)),
                    projectId,
                  );
                  if (r.ok) {
                    setDone(r.count);
                    router.refresh();
                  }
                })
              }
              className="btn-primary text-xs"
            >
              {importing ? "Adding…" : `Add ${checked.size} as tasks`}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files[0]);
      }}
      className={`rounded-2xl border-2 border-dashed px-4 py-3 text-sm transition-colors ${
        over ? "border-accent bg-accent-soft/50" : "border-line text-ink-3"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Sparkle className="text-accent" />
          {pending
            ? "Reading the sheet…"
            : "Drop a spreadsheet here to get a summary and pull out tasks"}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="btn-ghost -mr-2 text-xs"
        >
          Choose file
        </button>
      </div>
      {result && !result.ok && (
        <p className="mt-2 text-xs font-medium text-danger">{result.error}</p>
      )}
    </div>
  );
}
