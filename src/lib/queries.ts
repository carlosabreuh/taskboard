import { createClient } from "@/lib/supabase/server";
import type { Project, TaskWithProject } from "@/lib/types";

export const TASK_SELECT = "*, projects(id, name, color)";

export async function getProjectOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, color")
    .is("deleted_at", null)
    .neq("status", "archived")
    .order("name");
  return (data ?? []) as Pick<Project, "id" | "name" | "color">[];
}

export async function getOpenTasks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .is("deleted_at", null)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true });
  return (data ?? []) as TaskWithProject[];
}

export async function getRecentlyDone(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .is("deleted_at", null)
    .eq("status", "done")
    .order("completed_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as TaskWithProject[];
}
