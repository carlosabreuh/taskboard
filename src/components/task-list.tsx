import { TaskItem } from "./task-item";
import type { Project, TaskWithProject } from "@/lib/types";

type ProjectOption = Pick<Project, "id" | "name" | "color">;

export function TaskList({
  tasks,
  projects,
  showProject = true,
  empty = "Nothing here.",
}: {
  tasks: TaskWithProject[];
  projects: ProjectOption[];
  showProject?: boolean;
  empty?: string;
}) {
  if (tasks.length === 0) {
    return <p className="px-2 py-3 text-sm text-ink-3">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-line/60">
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          task={t}
          projects={projects}
          showProject={showProject}
        />
      ))}
    </ul>
  );
}

export function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 flex items-baseline gap-2 px-2 text-sm font-semibold uppercase tracking-wider text-ink-2">
        {title}
        {typeof count === "number" && (
          <span className="text-xs font-normal normal-case tracking-normal text-ink-3">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}
