import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { WeeklyReviewView } from "@/features/review/components/weekly-review";
import { getWeeklyReview } from "@/features/review/queries";
import { resolveReviewWeek } from "@/features/review/week";
import { requireScope } from "@/lib/auth/scope";
import { getOwnerCalendar } from "@/lib/dates/owner-today";
import { formatWeekRange } from "@/lib/dates/weeks";

export const metadata: Metadata = { title: "Weekly review · Programming Study Tracker" };

export default async function ReviewPage({ searchParams }: PageProps<"/review">) {
  const scope = await requireScope();
  const { today, timeZone } = await getOwnerCalendar();
  const week = resolveReviewWeek((await searchParams).week, today);
  const review = await getWeeklyReview(scope, week, timeZone);

  return (
    <>
      <PageHeader
        title="Weekly review"
        description={<p>{week.isCurrent ? "This week: " : "Week of "}<time dateTime={week.start} className="font-medium text-foreground tabular-nums">{formatWeekRange(week.start)}</time></p>}
        actions={
          <nav aria-label="Choose a week" className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/review?week=${week.previous}`}><ChevronLeft aria-hidden="true" />Earlier week</Link>
            </Button>
            {week.next && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/review?week=${week.next}`}>Later week<ChevronRight aria-hidden="true" /></Link>
              </Button>
            )}
            {!week.isCurrent && <Button asChild variant="ghost" size="sm"><Link href="/review">This week</Link></Button>}
          </nav>
        }
      />
      <WeeklyReviewView review={review} />
    </>
  );
}
