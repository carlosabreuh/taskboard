import { TaskItem } from "./task-item";
import type { Project, TaskWithProject } from "@/lib/types";

type ProjectOption = Pick<Project, "id" | "name" | "color">;

export function TaskList({
  tasks,
  projects,
  showProject = true,
  empty = "Nothing here.",
  vanishWhenDone = false,
}: {
  tasks: TaskWithProject[];
  projects: ProjectOption[];
  showProject?: boolean;
  empty?: string;
  vanishWhenDone?: boolean;
}) {
  if (tasks.length === 0) {
    return <p className="px-3 py-3 text-sm text-ink-3">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-line/70">
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          task={t}
          projects={projects}
          showProject={showProject}
          vanishWhenDone={vanishWhenDone}
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
    <section className="mb-7">
      <h2 className="mb-2 flex items-baseline gap-2 px-3 text-[15px] font-bold text-ink">
        {title}
        {typeof count === "number" && count > 0 && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
            {count}
          </span>
        )}
      </h2>
      <div className="card px-2 py-1">{children}</div>
    </section>
  );
}
