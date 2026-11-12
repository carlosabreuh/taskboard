import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectHeader } from "@/components/project-header";
import { QuickAdd } from "@/components/quick-add";
import { Section, TaskList } from "@/components/task-list";
import { createClient } from "@/lib/supabase/server";
import { getProjectOptions, TASK_SELECT } from "@/lib/queries";
import type { Project, TaskWithProject } from "@/lib/types";

async function loadProject(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as Project | null;
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = await loadProject(id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) notFound();

  const supabase = await createClient();
  const [{ data: taskRows }, projects] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_SELECT)
      .eq("project_id", id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("position", { ascending: true }),
    getProjectOptions(),
  ]);

  const tasks = (taskRows ?? []) as TaskWithProject[];
  const doing = tasks.filter((t) => t.status === "doing");
  const todo = tasks.filter((t) => t.status === "todo");
  const done = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  return (
    <>
      <ProjectHeader project={project} done={done.length} total={tasks.length} />

      <div className="mb-8">
        <QuickAdd projects={projects} projectId={project.id} />
      </div>

      {doing.length > 0 && (
        <Section title="In progress" count={doing.length}>
          <TaskList tasks={doing} projects={projects} showProject={false} />
        </Section>
      )}

      <Section title="To do" count={todo.length}>
        <TaskList
          tasks={todo}
          projects={projects}
          showProject={false}
          empty={
            tasks.length === 0
              ? "No tasks yet. Add the first one above."
              : "All caught up on this project."
          }
        />
      </Section>

      {done.length > 0 && (
        <Section title="Done" count={done.length}>
          <TaskList tasks={done} projects={projects} showProject={false} />
        </Section>
      )}
    </>
  );
}
