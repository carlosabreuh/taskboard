import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { purgeOldTrash } from "@/app/actions";
import { TrashList } from "@/components/trash-list";
import type { Project, Task } from "@/lib/types";

export const metadata: Metadata = { title: "Recently deleted" };

export default async function TrashPage() {
  await purgeOldTrash();
  const supabase = await createClient();

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, projects(id, name, color, deleted_at)")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  const projectRows = (projects ?? []) as Project[];
  // Tasks removed along with their project are restored with it, so list them under the project.
  const taskRows = ((tasks ?? []) as (Task & {
    projects: { id: string; name: string; color: string; deleted_at: string | null } | null;
  })[]).filter((t) => !(t.projects?.deleted_at && t.projects.deleted_at === t.deleted_at));

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Recently deleted</h1>
        <p className="mt-1 text-sm text-ink-2">
          Anything here can be restored for 30 days, then it clears out on its own.
        </p>
      </header>
      <TrashList tasks={taskRows} projects={projectRows} />
    </>
  );
}
