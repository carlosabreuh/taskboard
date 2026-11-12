"use client";

import { useEffect, useState } from "react";
import { Sunflower } from "./sunflower";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = "taskboard:install-hint-dismissed";

/**
 * A one-time nudge to put the app on the home screen.
 * Android/Chrome: real install button. iPhone: the Share → Add to Home Screen steps.
 * Hidden once installed, or after she dismisses it.
 */
export function InstallHint() {
  const [mode, setMode] = useState<"hidden" | "ios" | "android">("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {}
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (isIOS) {
      setMode("ios");
      return;
    }
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (mode === "hidden") return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setMode("hidden");
  }

  return (
    <div className="card mb-6 flex items-center gap-3 px-4 py-3">
      <Sunflower size={34} className="shrink-0" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold">Put Taskboard on your home screen</p>
        {mode === "ios" ? (
          <p className="text-ink-2">
            Tap <ShareIcon /> Share, then <span className="font-semibold">Add to Home Screen</span>. It opens like an app, no browser bar.
          </p>
        ) : (
          <p className="text-ink-2">Opens like an app, no browser bar.</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {mode === "android" && (
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={async () => {
              if (!deferred) return;
              await deferred.prompt();
              const { outcome } = await deferred.userChoice;
              if (outcome === "accepted") dismiss();
            }}
          >
            Install
          </button>
        )}
        <button type="button" onClick={dismiss} className="btn-ghost -mr-2 text-xs">
          Not now
        </button>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="-mt-0.5 inline-block">
      <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}
