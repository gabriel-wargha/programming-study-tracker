import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPortfolioView } from "@/features/portfolio/components/public-portfolio-view";
import { getPublicPortfolioForRequest } from "@/features/portfolio/queries";

export async function generateMetadata({ params }: PageProps<"/u/[slug]">): Promise<Metadata> {
  const portfolio = await getPublicPortfolioForRequest((await params).slug);
  return portfolio
    ? { title: `${portfolio.displayName ?? "Programming portfolio"} · Portfolio`, description: portfolio.headline ?? undefined }
    : { title: "Page not found", robots: { index: false } };
}

// Public by design: this page has no user check, and reads only through getPublicPortfolio.
export default async function PublicPortfolioPage({ params }: PageProps<"/u/[slug]">) {
  const portfolio = await getPublicPortfolioForRequest((await params).slug);
  if (!portfolio) notFound();
  return <PublicPortfolioView portfolio={portfolio} />;
}
