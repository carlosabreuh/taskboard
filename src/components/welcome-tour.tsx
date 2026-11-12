"use client";

import { useEffect, useState, useTransition } from "react";
import { markTourSeen } from "@/app/actions";
import { Sunflower } from "./sunflower";
import { Sparkle } from "./quick-add";

const STEPS: { title: string; body: string; art: React.ReactNode }[] = [
  {
    title: "Welcome to your Taskboard",
    body: "One quiet place for everything that's been living in your head. Here's the two-minute version of how it works.",
    art: <Sunflower size={72} />,
  },
  {
    title: "Today is home",
    body: "Overdue, due today, and the week ahead — nothing else. Tap the circle to finish a task, tap its name to change anything about it.",
    art: <Ring />,
  },
  {
    title: "Add things the way you'd say them",
    body: "“Call Dr. Patel Friday, high priority” becomes a task with the date and priority already set. Switch Smart off anytime for the plain form.",
    art: <SmartArt />,
  },
  {
    title: "Projects keep the pieces together",
    body: "A project is anything with more than one step. Each one gets a color, a progress bar, and its own list. Drop a spreadsheet on it and the tasks come out.",
    art: <Bars />,
  },
  {
    title: "Nothing is ever really gone",
    body: "Deleted something? Hit Undo, or find it in Recently deleted for 30 days. And when the list feels big, “Plan my day” picks a realistic order.",
    art: <Sparkle className="h-14 w-14 text-accent" />,
  },
];

export function WelcomeTour({ open: initiallyOpen }: { open: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [i, setI] = useState(0);
  const [, start] = useTransition();

  useEffect(() => {
    function onOpen() {
      setI(0);
      setOpen(true);
    }
    window.addEventListener("taskboard:tour", onOpen);
    return () => window.removeEventListener("taskboard:tour", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function finish() {
    setOpen(false);
    start(() => markTourSeen());
  }

  if (!open) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={finish}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-md overflow-hidden"
        style={{ animation: "tour-in 320ms cubic-bezier(0.2, 0.9, 0.3, 1.1)" }}
      >
        <div className="flex h-40 items-center justify-center bg-accent-soft/70">
          <div key={i} style={{ animation: "bloom 360ms cubic-bezier(0.2, 0.9, 0.3, 1.2)" }}>
            {step.art}
          </div>
        </div>
        <div className="px-6 pt-5 pb-4">
          <h2 id="tour-title" className="text-xl font-extrabold tracking-tight">
            {step.title}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
        </div>
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex gap-1.5 pl-2" aria-label={`Step ${i + 1} of ${STEPS.length}`}>
            {STEPS.map((_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => setI(n)}
                aria-label={`Go to step ${n + 1}`}
                className={`h-2 rounded-full transition-all ${
                  n === i ? "w-5 bg-accent" : "w-2 bg-line hover:bg-ink-3"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {!last && (
              <button type="button" onClick={finish} className="btn-ghost text-xs">
                Skip
              </button>
            )}
            {i > 0 && (
              <button type="button" onClick={() => setI(i - 1)} className="btn-ghost text-xs">
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? finish() : setI(i + 1))}
              className="btn-primary text-xs"
            >
              {last ? "Let's go" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TourButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("taskboard:tour"))}
      className={className}
    >
      Take the tour
    </button>
  );
}

/* Little illustrations, drawn with the app's own colors. */
function Ring() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      <circle cx="40" cy="40" r="26" fill="none" stroke="var(--line)" strokeWidth="5" />
      <circle cx="40" cy="40" r="26" fill="var(--accent)" />
      <path d="M28 41l8 8 16-18" fill="none" stroke="var(--accent-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SmartArt() {
  return (
    <svg viewBox="0 0 160 70" width="200" height="88" aria-hidden="true">
      <rect x="4" y="18" width="152" height="34" rx="17" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
      <rect x="16" y="31" width="78" height="8" rx="4" fill="var(--ink-3)" />
      <rect x="104" y="27" width="44" height="16" rx="8" fill="var(--accent)" />
      <path d="M20 8l1.4 3.6L25 13l-3.6 1.4L20 18l-1.4-3.6L15 13l3.6-1.4z" fill="var(--accent)" />
    </svg>
  );
}
function Bars() {
  return (
    <svg viewBox="0 0 160 70" width="200" height="88" aria-hidden="true">
      {[
        ["#b45309", 0.7],
        ["#1d4ed8", 0.35],
        ["#0f766e", 0.9],
      ].map(([c, w], n) => (
        <g key={n} transform={`translate(0 ${n * 22})`}>
          <circle cx="12" cy="8" r="6" fill={c as string} />
          <rect x="26" y="4" width="130" height="8" rx="4" fill="var(--surface-2)" />
          <rect x="26" y="4" width={130 * (w as number)} height="8" rx="4" fill={c as string} />
        </g>
      ))}
    </svg>
  );
}
