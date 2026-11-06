import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Programming Study Tracker",
  description:
    "Organize your programming study with focused goals, weekly activity, and the projects you build.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
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
