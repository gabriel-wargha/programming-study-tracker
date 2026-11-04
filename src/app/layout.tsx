import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Programming Study Tracker",
  description:
    "Organize your programming study with focused goals, weekly activity, and the projects you build.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only fixed top-4 left-4 z-50 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
