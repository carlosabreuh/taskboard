import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { NavLinks, TabBar } from "@/components/nav-links";
import { Sunflower } from "@/components/sunflower";
import { UndoToast } from "@/components/undo-toast";
import type { Project } from "@/lib/types";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("projects")
    .select("id, name, color, status")
    .is("deleted_at", null)
    .neq("status", "archived")
    .order("created_at", { ascending: true });
  const projects = (data ?? []) as Pick<
    Project,
    "id" | "name" | "color" | "status"
  >[];

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      {/* Phone header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-1 md:hidden">
        <Link href="/" className="flex items-center gap-2 font-extrabold">
          <Sunflower size={26} />
          Taskboard
        </Link>
        <form action={signOut}>
          <button className="btn-ghost -mr-3 text-xs">Sign out</button>
        </form>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:px-3 md:py-5">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-3 text-lg font-extrabold">
          <Sunflower size={30} />
          Taskboard
        </Link>
        <NavLinks projects={projects} />
        <form action={signOut} className="mt-auto px-3">
          <p className="mb-1 truncate text-xs text-ink-3">{user.email}</p>
          <button className="btn-ghost -ml-4 text-xs">Sign out</button>
        </form>
      </aside>

      <main className="flex-1 px-4 pt-3 pb-28 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>

      <TabBar />
      <UndoToast />
    </div>
  );
}
