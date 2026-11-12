import { FieldNews } from "@/components/field-news";
import { PlanMyDay } from "@/components/plan-my-day";
import { QuickAdd } from "@/components/quick-add";
import { aiEnabled } from "@/lib/ai";
import { Section, TaskList } from "@/components/task-list";
import { addDaysISO, todayISO } from "@/lib/dates";
import { getOpenTasks, getProjectOptions, getRecentlyDone } from "@/lib/queries";

export default async function TodayPage() {
  const [tasks, projects, recentlyDone] = await Promise.all([
    getOpenTasks(),
    getProjectOptions(),
    getRecentlyDone(5),
  ]);

  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);

  const overdue = tasks.filter((t) => t.due_date && t.due_date < today);
  const dueToday = tasks.filter((t) => t.due_date === today);
  const thisWeek = tasks.filter(
    (t) => t.due_date && t.due_date > today && t.due_date <= weekEnd,
  );
  const highNoDate = tasks.filter((t) => !t.due_date && t.priority === "high");

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
          <TaskList tasks={overdue} projects={projects} />
        </Section>
      )}

      <Section title="Today" count={dueToday.length}>
        <TaskList
          tasks={dueToday}
          projects={projects}
          empty="Nothing due today."
        />
      </Section>

      <Section title="Next 7 days" count={thisWeek.length}>
        <TaskList
          tasks={thisWeek}
          projects={projects}
          empty="Nothing coming up this week."
        />
      </Section>

      {highNoDate.length > 0 && (
        <Section title="High priority, no date" count={highNoDate.length}>
          <TaskList tasks={highNoDate} projects={projects} />
        </Section>
      )}

      <FieldNews />

      {recentlyDone.length > 0 && (
        <Section title="Recently done">
          <TaskList tasks={recentlyDone} projects={projects} />
        </Section>
      )}
    </>
  );
}
