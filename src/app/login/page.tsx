import type { Metadata } from "next";
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-ink text-xl font-semibold">
            ✓
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Taskboard</h1>
          <p className="mt-1 text-sm text-ink-2">
            Out of your head, into one place.
          </p>
        </div>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
