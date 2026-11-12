import { FieldNews } from "@/components/field-news";
import { InstallHint } from "@/components/install-hint";
import { PlanMyDay } from "@/components/plan-my-day";
import { QuickAdd } from "@/components/quick-add";
import { aiEnabled } from "@/lib/ai";
import { Section, TaskList } from "@/components/task-list";
import { addDaysISO, todayISO } from "@/lib/dates";
import { getOpenTasks, getProjectOptions } from "@/lib/queries";

export default async function TodayPage() {
  const [tasks, projects] = await Promise.all([getOpenTasks(), getProjectOptions()]);

  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);

  const overdue = tasks.filter((t) => t.due_date && t.due_date < today);
  const dueToday = tasks.filter((t) => t.due_date === today);
  const thisWeek = tasks.filter(
    (t) => t.due_date && t.due_date > today && t.due_date <= weekEnd,
  );
  const anytime = tasks
    .filter((t) => !t.due_date)
    .sort((a, b) => (a.priority === "high" ? -1 : 0) - (b.priority === "high" ? -1 : 0));
  const later = tasks.filter((t) => t.due_date && t.due_date > weekEnd);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const open = tasks.length;
  const ai = aiEnabled();

  return (
    <>
      <InstallHint />

      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{greeting}</h1>
        <p className="mt-1 text-sm text-ink-2">
          {open === 0
            ? "Nothing open. Enjoy it."
            : `${open} open task${open === 1 ? "" : "s"}` +
              (overdue.length
                ? ` · ${overdue.length} overdue`
                : dueToday.length
                  ? ` · ${dueToday.length} due today`
                  : "")}
        </p>
      </header>

      <div className="mb-4">
        <QuickAdd projects={projects} defaultDue={today} ai={ai} />
      </div>

      {ai && (
        <div className="mb-8">
          <PlanMyDay openCount={open} />
        </div>
      )}

      {overdue.length > 0 && (
        <Section title="Overdue" count={overdue.length}>
          <TaskList tasks={overdue} projects={projects} vanishWhenDone />
        </Section>
      )}

      <Section title="Today" count={dueToday.length}>
        <TaskList
          tasks={dueToday}
          projects={projects}
          vanishWhenDone
          empty="Nothing due today."
        />
      </Section>

      <Section title="Next 7 days" count={thisWeek.length}>
        <TaskList
          tasks={thisWeek}
          projects={projects}
          vanishWhenDone
          empty="Nothing coming up this week."
        />
      </Section>

      {anytime.length > 0 && (
        <Section title="Anytime" count={anytime.length}>
          <TaskList tasks={anytime} projects={projects} vanishWhenDone />
        </Section>
      )}

      {later.length > 0 && (
        <Section title="Later" count={later.length}>
          <TaskList tasks={later} projects={projects} vanishWhenDone />
        </Section>
      )}

      <FieldNews />

    </>
  );
}
