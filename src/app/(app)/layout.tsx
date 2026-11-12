import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { NavLinks, TabBar } from "@/components/nav-links";
import { Sunflower } from "@/components/sunflower";
import { UndoToast } from "@/components/undo-toast";
import { TourButton, WelcomeTour } from "@/components/welcome-tour";
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
        <div className="mt-auto px-3">
          <p className="mb-1 truncate text-xs text-ink-3">{user.email}</p>
          <div className="-ml-4 flex items-center">
            <TourButton className="btn-ghost text-xs" />
            <form action={signOut}>
              <button className="btn-ghost text-xs">Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col px-4 pt-3 pb-28 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-3xl flex-1">{children}</div>
        <p className="mx-auto mt-12 flex w-full max-w-3xl items-center justify-center gap-1.5 text-sm text-ink-3">
          With
          <svg viewBox="0 0 24 24" width="15" height="15" aria-label="love" role="img" className="inline-block -mt-px">
            <path
              d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.6 6.7 4.6c2 0 3.6 1.1 4.3 2.4.7-1.3 2.3-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"
              fill="#b8463f"
            />
          </svg>
          Carlos
        </p>
      </main>

      <TabBar />
      <UndoToast />
      <WelcomeTour open={user.user_metadata?.tour_seen !== true} />
    </div>
  );
}
