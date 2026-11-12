import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { NavLinks } from "@/components/nav-links";
import type { Project } from "@/lib/types";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, color, status")
    .neq("status", "archived")
    .order("created_at", { ascending: true });

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="border-b border-line bg-surface md:w-64 md:border-b-0 md:border-r md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 md:py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-ink text-sm">
              ✓
            </span>
            Taskboard
          </Link>
          <form action={signOut} className="md:hidden">
            <button className="btn-ghost text-xs">Sign out</button>
          </form>
        </div>

        <NavLinks
          projects={(projects ?? []) as Pick<Project, "id" | "name" | "color" | "status">[]}
        />

        <form action={signOut} className="hidden px-4 pb-4 md:block">
          <p className="mb-1 truncate text-xs text-ink-3">{user.email}</p>
          <button className="btn-ghost -ml-3 text-xs">Sign out</button>
        </form>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
