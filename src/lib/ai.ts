import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** AI features switch on only when the hosting env has an API key. */
export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const FAST = "claude-haiku-5-5"; // parsing a single line of text
const SMART = "claude-sonnet-5-5"; // planning and spreadsheet analysis

let client: Anthropic | null = null;
function anthropic() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/** Ask Claude for a JSON object matching `schema`. */
async function askJSON<T>(opts: {
  model: "fast" | "smart";
  system: string;
  user: string;
  schema: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<T> {
  const res = await anthropic().messages.create({
    model: opts.model === "fast" ? FAST : SMART,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    output_config: {
      effort: opts.effort ?? "low",
      format: { type: "json_schema", schema: opts.schema },
    },
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  return JSON.parse(text) as T;
}

/* ---------------- 1. Smart quick-add ---------------- */

export interface ParsedTask {
  title: string;
  due_date: string | null;
  priority: "low" | "normal" | "high";
  notes: string | null;
  project_name: string | null;
}

export async function parseTaskText(
  text: string,
  projectNames: string[],
  today: string,
  weekday: string,
): Promise<ParsedTask> {
  return askJSON<ParsedTask>({
    model: "fast",
    effort: "low",
    maxTokens: 400,
    system:
      `You turn one line of natural language into a task. Today is ${weekday} ${today}. ` +
      `Resolve relative dates ("Friday", "tomorrow", "next week", "end of month") to YYYY-MM-DD; if no date is mentioned, due_date is null. ` +
      `Priority is "high" if the text signals urgency or importance (urgent, asap, important, !!, high priority), "low" if it signals it can wait (someday, eventually, low priority), otherwise "normal". ` +
      `Strip the date/priority/project words out of the title so it reads as a clean action; keep the person's wording otherwise. ` +
      `Put anything extra (details, phone numbers, links) in notes, else null. ` +
      `If the text clearly refers to one of these projects, set project_name to that exact name, else null: ${JSON.stringify(projectNames)}.`,
    user: text,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "due_date", "priority", "notes", "project_name"],
      properties: {
        title: { type: "string" },
        due_date: { type: ["string", "null"] },
        priority: { type: "string", enum: ["low", "normal", "high"] },
        notes: { type: ["string", "null"] },
        project_name: { type: ["string", "null"] },
      },
    },
  });
}

/* ---------------- 2. Plan my day ---------------- */

export interface PlanItem {
  id: string;
  reason: string;
}
export interface DayPlan {
  headline: string;
  items: PlanItem[];
  parked: PlanItem[];
}

export async function planDay(
  tasks: {
    id: string;
    title: string;
    due_date: string | null;
    priority: string;
    status: string;
    project: string | null;
    notes: string | null;
  }[],
  today: string,
  weekday: string,
): Promise<DayPlan> {
  return askJSON<DayPlan>({
    model: "smart",
    effort: "medium",
    maxTokens: 2500,
    system:
      `You are helping one person plan a realistic day. Today is ${weekday} ${today}. ` +
      `Given their open tasks, pick the ones worth doing today (overdue first, then due today, then high priority, then quick wins or things that unblock a project), in the order they should tackle them. ` +
      `Aim for 3–7 items; a day with too much on it is not a plan. Everything else goes in "parked" with a short reason it can wait (at most 5 parked entries; skip the rest). ` +
      `Each reason is one short, plain sentence written to the person ("Was due Tuesday", "Quick, and it unblocks the move"). ` +
      `headline is one warm, specific sentence summarizing the day — no exclamation marks. ` +
      `Only use task ids from the list.`,
    user: JSON.stringify(tasks),
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "items", "parked"],
      properties: {
        headline: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "reason"],
            properties: { id: { type: "string" }, reason: { type: "string" } },
          },
        },
        parked: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "reason"],
            properties: { id: { type: "string" }, reason: { type: "string" } },
          },
        },
      },
    },
  });
}

/* ---------------- 3. Spreadsheet analysis ---------------- */

export interface SuggestedTask {
  title: string;
  due_date: string | null;
  priority: "low" | "normal" | "high";
  notes: string | null;
}
export interface SheetAnalysis {
  summary: string;
  highlights: string[];
  tasks: SuggestedTask[];
}

export async function analyzeSheet(
  filename: string,
  sheets: { name: string; headers: string[]; rows: unknown[][]; totalRows: number }[],
  context: string,
  today: string,
): Promise<SheetAnalysis> {
  return askJSON<SheetAnalysis>({
    model: "smart",
    effort: "medium",
    maxTokens: 4000,
    system:
      `You read a spreadsheet someone dropped into their personal task tracker and help them act on it. Today is ${today}. ` +
      `Write "summary" as 2–4 plain sentences: what the sheet is, what's in it, anything that stands out (totals, deadlines, gaps, inconsistencies). ` +
      `"highlights" are up to 5 short bullet facts worth knowing (numbers, dates, counts). ` +
      `"tasks" are concrete to-dos the sheet implies, each a clear action the person could tick off, with a YYYY-MM-DD due_date when the sheet gives one (else null), priority from urgency, and notes carrying the row details that matter (amounts, names, references). ` +
      `If rows are already to-do items, map each open one to a task; if the sheet is data (a budget, a list, a log), suggest the few follow-ups it implies instead. Max 40 tasks. Never invent rows that aren't there. ` +
      `Only part of large sheets is shown; totalRows tells you the true size.`,
    user:
      `File: ${filename}\n` +
      (context ? `Where it's being dropped: ${context}\n` : "") +
      JSON.stringify(sheets),
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "highlights", "tasks"],
      properties: {
        summary: { type: "string" },
        highlights: { type: "array", items: { type: "string" } },
        tasks: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "due_date", "priority", "notes"],
            properties: {
              title: { type: "string" },
              due_date: { type: ["string", "null"] },
              priority: { type: "string", enum: ["low", "normal", "high"] },
              notes: { type: ["string", "null"] },
            },
          },
        },
      },
    },
  });
}
