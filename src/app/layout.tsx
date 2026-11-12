import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Taskboard", template: "%s · Taskboard" },
  description: "Projects and tasks, out of your head and in one place.",
  appleWebApp: { capable: true, title: "Taskboard", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffcf4" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1913" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
