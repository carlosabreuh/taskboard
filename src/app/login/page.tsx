import type { Metadata } from "next";
import { Sunflower } from "@/components/sunflower";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Sunflower size={64} className="mx-auto mb-4 drop-shadow-sm" />
          <h1 className="text-[28px] font-extrabold tracking-tight">
            Taskboard
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Out of your head, into one place.
          </p>
        </div>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
