export type ProjectStatus = "active" | "on_hold" | "done" | "archived";
export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "normal" | "high";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskWithProject = Task & {
  projects: Pick<Project, "id" | "name" | "color"> | null;
};

export const PROJECT_COLORS = [
  "#b45309", // amber
  "#b91c1c", // red
  "#be185d", // pink
  "#7e22ce", // purple
  "#1d4ed8", // blue
  "#0f766e", // teal
  "#15803d", // green
  "#57534e", // stone
] as const;

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On hold",
  done: "Done",
  archived: "Archived",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};
