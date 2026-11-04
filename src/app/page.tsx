import { ArrowDown, BookOpen, Check, Code2, GitBranch, Target } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Choose a small goal",
    description: "Pick a topic and decide what done looks like.",
    icon: Target,
  },
  {
    title: "Record the work",
    description: "Keep a weekly record of what you did and the time you spent.",
    icon: BookOpen,
  },
  {
    title: "Keep what you build",
    description: "Connect your projects to the learning that made them possible.",
    icon: GitBranch,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 sm:px-10">
      <header className="flex items-center justify-between gap-4 border-b py-6 sm:py-8">
        <Link href="/" className="flex items-center gap-3 rounded-sm font-semibold">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Code2 aria-hidden="true" className="size-5" />
          </span>
          <span className="max-w-44 text-sm leading-snug sm:max-w-none">
            Programming Study Tracker
          </span>
        </Link>
        <span className="shrink-0 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
          Workspace preview
        </span>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 py-16 sm:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p className="mb-6 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              A little focus goes a long way
            </p>
            <h1 className="text-5xl leading-[1.08] font-semibold tracking-tight sm:text-7xl">
              Small steps.
              <br />
              <span className="text-primary">Real progress.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              A home for your programming study. Set clear goals, record your
              weekly practice, and keep the projects you build along the way.
            </p>
            <Button asChild size="lg" className="mt-8">
              <a href="#how-it-works">
                See the approach
                <ArrowDown aria-hidden="true" />
              </a>
            </Button>
          </div>

          <section
            aria-labelledby="workspace-heading"
            className="relative rounded-2xl border bg-card p-7 shadow-[0_8px_40px_-20px_#28564130] sm:p-9"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">ONE STEP AT A TIME</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary">
                <Check aria-hidden="true" className="size-4" />
              </span>
            </div>
            <div aria-hidden="true" className="mb-8 flex h-28 items-end gap-3 border-b px-4">
              {[28, 42, 38, 62, 76, 96].map((height, index) => (
                <div
                  key={height}
                  className={`flex-1 rounded-t-md ${index === 5 ? "bg-primary" : "bg-secondary"}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <h2 id="workspace-heading" className="text-xl font-semibold tracking-tight">
              Make space for your next chapter.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your topics, goals, and weekly progress will have a home here.
              This is a first look; your study workspace is coming next.
            </p>
          </section>
        </div>

        <section id="how-it-works" aria-labelledby="approach-heading" className="mt-20 scroll-mt-8 border-t pt-10 sm:mt-24">
          <h2 id="approach-heading" className="mb-8 text-sm font-semibold text-muted-foreground">
            A simple rhythm for learning
          </h2>
          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <li key={title}>
                <div className="mb-4 flex items-center gap-3">
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t py-6 text-xs text-muted-foreground">
        Your pace. Your progress.
      </footer>
    </div>
  );
}
