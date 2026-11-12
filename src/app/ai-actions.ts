"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import {
  aiEnabled,
  analyzeSheet,
  parseTaskText,
  planDay,
  type DayPlan,
  type SheetAnalysis,
  type SuggestedTask,
} from "@/lib/ai";
import { todayISO } from "@/lib/dates";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function weekday(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

const AI_OFF = "AI features need an ANTHROPIC_API_KEY on the server.";

/** Turn API failures into something a person can act on. */
function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/credit balance|billing/i.test(msg))
    return "The AI account is out of credits — add some at console.anthropic.com (Plans & Billing) and try again.";
  if (/invalid x-api-key|authentication/i.test(msg))
    return "The AI key on the server isn't valid. Check ANTHROPIC_API_KEY in Vercel and redeploy.";
  if (/rate limit|overloaded|529/i.test(msg))
    return "The AI is busy right now — give it a few seconds and try again.";
  if (/JSON/i.test(msg)) return "The AI's answer came back garbled. Try once more.";
  return "Something went wrong talking to the AI. Try again in a moment.";
}

/* ---------------- 1. Smart quick-add ---------------- */

export async function smartAddTask(
  text: string,
  lockedProjectId?: string | null,
): Promise<{ ok: true; title: string; due_date: string | null } | { ok: false; error: string }> {
  if (!aiEnabled()) return { ok: false, error: AI_OFF };
  const clean = text.trim();
  if (!clean) return { ok: false, error: "Type something first." };

  const { supabase, user } = await requireUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .is("deleted_at", null)
    .neq("status", "archived");
  const names = (projects ?? []).map((p) => p.name);

  let parsed;
  try {
    parsed = await parseTaskText(clean, names, todayISO(), weekday());
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }

  let projectId: string | null = lockedProjectId ?? null;
  if (!projectId && parsed.project_name) {
    projectId = (projects ?? []).find((p) => p.name === parsed.project_name)?.id ?? null;
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    project_id: projectId,
    title: parsed.title || clean,
    notes: parsed.notes,
    priority: parsed.priority,
    due_date: parsed.due_date,
    position: Date.now(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, title: parsed.title || clean, due_date: parsed.due_date };
}

/* ---------------- 2. Plan my day ---------------- */

export type PlanResult =
  | { ok: true; plan: DayPlan; tasks: Record<string, { title: string; project: string | null; due_date: string | null }> }
  | { ok: false; error: string };

export async function planMyDay(): Promise<PlanResult> {
  if (!aiEnabled()) return { ok: false, error: AI_OFF };
  const { supabase } = await requireUser();

  const { data } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, status, notes, projects(name)")
    .is("deleted_at", null)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(80);

  const rows = (data ?? []) as unknown as {
    id: string; title: string; due_date: string | null; priority: string;
    status: string; notes: string | null; projects: { name: string } | null;
  }[];
  if (rows.length === 0) return { ok: false, error: "Nothing open to plan." };

  const slim = rows.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    priority: t.priority,
    status: t.status,
    project: t.projects?.name ?? null,
    notes: t.notes ? t.notes.slice(0, 140) : null,
  }));

  try {
    const plan = await planDay(slim, todayISO(), weekday());
    const known = new Set(rows.map((r) => r.id));
    plan.items = plan.items.filter((i) => known.has(i.id));
    plan.parked = plan.parked.filter((i) => known.has(i.id));
    const tasks = Object.fromEntries(
      rows.map((r) => [r.id, { title: r.title, project: r.projects?.name ?? null, due_date: r.due_date }]),
    );
    return { ok: true, plan, tasks };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

/** Apply a plan: the chosen tasks get today's date and the suggested order. */
export async function applyPlan(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireUser();
  const today = todayISO();
  const base = Date.now() - ids.length * 10;
  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from("tasks")
      .update({ position: base + i * 10, due_date: today })
      .eq("id", ids[i])
      .or(`due_date.is.null,due_date.gte.${today}`); // don't move overdue dates forward
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------- 3. Spreadsheet drop ---------------- */

export type SheetResult =
  | { ok: true; analysis: SheetAnalysis; filename: string }
  | { ok: false; error: string };

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 300;
const MAX_COLS = 25;

export async function analyzeSpreadsheet(form: FormData): Promise<SheetResult> {
  if (!aiEnabled()) return { ok: false, error: AI_OFF };
  await requireUser();

  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (file.size > MAX_BYTES) return { ok: false, error: "That file is over 4 MB — try a smaller sheet." };
  const context = String(form.get("context") ?? "");

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer", cellDates: true });
  } catch {
    return { ok: false, error: "Couldn't open that file. Use .xlsx, .xls or .csv." };
  }

  const sheets = wb.SheetNames.slice(0, 5).map((name) => {
    const ws = wb.Sheets[name];
    const all = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" });
    const nonEmpty = all.filter((r) => r.some((c) => String(c).trim() !== ""));
    const headers = (nonEmpty[0] ?? []).slice(0, MAX_COLS).map(String);
    const rows = nonEmpty.slice(1, 1 + MAX_ROWS).map((r) => r.slice(0, MAX_COLS));
    return { name, headers, rows, totalRows: Math.max(nonEmpty.length - 1, 0) };
  });

  if (sheets.every((s) => s.rows.length === 0 && s.headers.length === 0)) {
    return { ok: false, error: "That sheet looks empty." };
  }

  try {
    const analysis = await analyzeSheet(file.name, sheets, context, todayISO());
    return { ok: true, analysis, filename: file.name };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

export async function importTasks(
  tasks: SuggestedTask[],
  projectId: string | null,
): Promise<{ ok: boolean; count: number; error?: string }> {
  const { supabase, user } = await requireUser();
  if (tasks.length === 0) return { ok: true, count: 0 };
  const base = Date.now();
  const { error } = await supabase.from("tasks").insert(
    tasks.map((t, i) => ({
      user_id: user.id,
      project_id: projectId,
      title: t.title.slice(0, 300),
      notes: t.notes,
      priority: t.priority,
      due_date: t.due_date,
      position: base + i,
    })),
  );
  if (error) return { ok: false, count: 0, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, count: tasks.length };
}
