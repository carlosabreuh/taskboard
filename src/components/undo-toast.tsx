"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreProject, restoreTask } from "@/app/actions";

type Undo = { kind: "task" | "project"; id: string; label: string };

/** Fire from anywhere after a delete: announceDelete({ kind, id, label }). */
export function announceDelete(detail: Undo) {
  window.dispatchEvent(new CustomEvent("taskboard:deleted", { detail }));
}

export function UndoToast() {
  const [undo, setUndo] = useState<Undo | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function onDeleted(e: Event) {
      setUndo((e as CustomEvent<Undo>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setUndo(null), 8000);
    }
    window.addEventListener("taskboard:deleted", onDeleted);
    return () => {
      window.removeEventListener("taskboard:deleted", onDeleted);
      clearTimeout(timer);
    };
  }, []);

  if (!undo) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 md:bottom-6"
    >
      <div className="card flex items-center gap-3 px-4 py-2.5 text-sm">
        <span className="max-w-[55vw] truncate">
          Deleted “{undo.label}”
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (undo.kind === "task") await restoreTask(undo.id);
              else await restoreProject(undo.id);
              setUndo(null);
              router.refresh();
            })
          }
          className="font-bold text-accent-ink dark:text-accent"
        >
          {pending ? "Restoring…" : "Undo"}
        </button>
      </div>
    </div>
  );
}
