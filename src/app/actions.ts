"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function optional(form: FormData, key: string): string | null {
  const v = str(form, key);
  return v.length ? v : null;
}

/* ---------------- Auth ---------------- */

export async function signIn(
  _prev: { error?: string } | undefined,
  form: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(form, "email"),
    password: str(form, "password"),
  });
  if (error) return { error: "That email and password didn't match." };
  const next = str(form, "next");
  redirect(next.startsWith("/") ? next : "/");
}

export async function markTourSeen() {
  const supabase = await createClient();
  await supabase.auth.updateUser({ data: { tour_seen: true } });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/* ---------------- Projects ---------------- */

export async function createProject(form: FormData) {
  const { supabase, user } = await requireUser();
  const name = str(form, "name");
  if (!name) return;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      description: optional(form, "description"),
      color: str(form, "color") || "#7c6f64",
      due_date: optional(form, "due_date"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(id: string, form: FormData) {
  const { supabase } = await requireUser();
  const name = str(form, "name");
  if (!name) return;

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description: optional(form, "description"),
      color: str(form, "color") || "#7c6f64",
      status: (str(form, "status") || "active") as ProjectStatus,
      due_date: optional(form, "due_date"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
}

export async function setProjectStatus(id: string, status: ProjectStatus) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
}

/** Soft delete: the project and its tasks go to Recently deleted for 30 days. */
export async function deleteProject(id: string) {
  const { supabase } = await requireUser();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
  // Tasks keep their own deleted_at only if they weren't already in the trash,
  // so restoring the project brings back exactly what was live.
  await supabase
    .from("tasks")
    .update({ deleted_at: now })
    .eq("project_id", id)
    .is("deleted_at", null);
  revalidatePath("/", "layout");
  redirect("/projects");
}

/* ---------------- Tasks ---------------- */

export async function createTask(form: FormData) {
  const { supabase, user } = await requireUser();
  const title = str(form, "title");
  if (!title) return;

  const projectId = optional(form, "project_id");

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    project_id: projectId,
    title,
    notes: optional(form, "notes"),
    priority: (str(form, "priority") || "normal") as TaskPriority,
    due_date: optional(form, "due_date"),
    position: Date.now(), // newest last; cheap stable ordering
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/inbox");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function updateTask(id: string, form: FormData) {
  const { supabase } = await requireUser();
  const title = str(form, "title");
  if (!title) return;

  const projectId = optional(form, "project_id");
  const status = (str(form, "status") || "todo") as TaskStatus;

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      notes: optional(form, "notes"),
      project_id: projectId,
      status,
      priority: (str(form, "priority") || "normal") as TaskPriority,
      due_date: optional(form, "due_date"),
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function setTaskStatus(id: string, status: TaskStatus) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function toggleTaskDone(id: string, done: boolean) {
  return setTaskStatus(id, done ? "done" : "todo");
}

/** Soft delete: the task sits in Recently deleted for 30 days. */
export async function deleteTask(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/* ---------------- Recently deleted ---------------- */

export async function restoreTask(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function restoreProject(id: string) {
  const { supabase } = await requireUser();
  const { data: project } = await supabase
    .from("projects")
    .select("deleted_at")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  // Bring back the tasks that were deleted together with the project.
  if (project?.deleted_at) {
    await supabase
      .from("tasks")
      .update({ deleted_at: null })
      .eq("project_id", id)
      .eq("deleted_at", project.deleted_at);
  }
  revalidatePath("/", "layout");
}

export async function destroyTask(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trash");
}

export async function destroyProject(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("projects").delete().eq("id", id); // cascades to its tasks
  if (error) throw new Error(error.message);
  revalidatePath("/trash");
}

export async function emptyTrash() {
  const { supabase } = await requireUser();
  await supabase.from("tasks").delete().not("deleted_at", "is", null);
  await supabase.from("projects").delete().not("deleted_at", "is", null);
  revalidatePath("/", "layout");
}

/** Anything deleted more than 30 days ago is removed for good. */
export async function purgeOldTrash() {
  const { supabase } = await requireUser();
  const cutoff = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  await supabase.from("tasks").delete().lt("deleted_at", cutoff);
  await supabase.from("projects").delete().lt("deleted_at", cutoff);
}
