import type { Metadata } from "next";
import { QuickAdd } from "@/components/quick-add";
import { Section, TaskList } from "@/components/task-list";
import { getOpenTasks, getProjectOptions, getRecentlyDone } from "@/lib/queries";

export const metadata: Metadata = { title: "All tasks" };

export default async function InboxPage() {
  const [tasks, projects, done] = await Promise.all([
    getOpenTasks(),
    getProjectOptions(),
    getRecentlyDone(25),
  ]);

  const doing = tasks.filter((t) => t.status === "doing");
  const dated = tasks.filter((t) => t.status !== "doing" && t.due_date);
  const undated = tasks.filter((t) => t.status !== "doing" && !t.due_date);
  const loose = undated.filter((t) => !t.project_id);
  const inProjects = undated.filter((t) => t.project_id);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">All tasks</h1>
        <p className="mt-1 text-sm text-ink-2">
          Every open task, across every project.
        </p>
      </header>

      <div className="mb-8">
        <QuickAdd projects={projects} />
      </div>

      {doing.length > 0 && (
        <Section title="In progress" count={doing.length}>
          <TaskList tasks={doing} projects={projects} />
        </Section>
      )}

      <Section title="Scheduled" count={dated.length}>
        <TaskList tasks={dated} projects={projects} empty="No dated tasks." />
      </Section>

      <Section title="Someday" count={inProjects.length}>
        <TaskList
          tasks={inProjects}
          projects={projects}
          empty="No undated project tasks."
        />
      </Section>

      <Section title="Loose ends" count={loose.length}>
        <TaskList
          tasks={loose}
          projects={projects}
          empty="No tasks without a project."
        />
      </Section>

      {done.length > 0 && (
        <Section title="Done" count={done.length}>
          <TaskList tasks={done} projects={projects} />
        </Section>
      )}
    </>
  );
}
