import type { Metadata } from "next";
import Link from "next/link";
import { createProject } from "@/app/actions";
import { ProjectFields } from "@/components/project-form";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">New project</h1>
      </header>
      <form action={createProject} className="card space-y-5 p-6">
        <ProjectFields />
        <div className="flex justify-end gap-2 pt-2">
          <Link href="/projects" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn-primary">
            Create project
          </button>
        </div>
      </form>
    </>
  );
}
