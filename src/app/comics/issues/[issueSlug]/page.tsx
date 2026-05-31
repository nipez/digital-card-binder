import Link from "next/link";
import { ArrowLeft, BadgeCheck, BookOpen, Calendar, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { ComicActions, ComicFlip } from "@/components/ComicArchiveClient";
import { demoComicIssues, getComicIssueBySlug } from "@/lib/comic-demo-data";

export function generateStaticParams() {
  return demoComicIssues.map((issue) => ({ issueSlug: issue.issueSlug }));
}

export default async function ComicIssuePage({ params }: { params: Promise<{ issueSlug: string }> }) {
  const { issueSlug } = await params;
  const issue = getComicIssueBySlug(issueSlug);

  if (!issue) {
    notFound();
  }

  const coverScan = issue.images.find((image) => image.side === "cover");
  const backScan = issue.images.find((image) => image.side === "back");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,65,49,0.14),transparent_30%),linear-gradient(90deg,rgba(20,24,31,0.08)_0_1px,transparent_1px_100%),linear-gradient(rgba(20,24,31,0.07)_0_1px,transparent_1px_100%),#f3ead8] bg-[length:auto,36px_36px,36px_36px,auto]">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10">
        <Link href="/comics" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-archive-oxblood">
          <ArrowLeft className="h-4 w-4" />
          Back to comic library
        </Link>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-lg border border-white/72 bg-white/62 p-5 shadow-card backdrop-blur">
            <ComicFlip issue={issue} large />
          </div>

          <article className="rounded-lg border border-white/72 bg-white/66 p-6 shadow-card backdrop-blur">
            <p className="text-sm font-black uppercase tracking-wide text-archive-oxblood">
              {issue.publisher} • {issue.series} #{issue.issueNumber}
            </p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-tight">{issue.title}</h1>
            <p className="mt-3 text-lg font-bold text-archive-ink/72">{issue.collection}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {issue.keyIssue ? (
                <span className="inline-flex items-center gap-2 rounded-md border border-archive-oxblood/24 bg-white/70 px-3 py-2 text-sm font-bold text-archive-oxblood">
                  <Star className="h-4 w-4" />
                  Key issue
                </span>
              ) : null}
              {issue.signed ? (
                <span className="inline-flex items-center gap-2 rounded-md border border-archive-oxblood/24 bg-white/70 px-3 py-2 text-sm font-bold text-archive-oxblood">
                  <BadgeCheck className="h-4 w-4" />
                  Signed
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-md border border-archive-ink/10 bg-white/70 px-3 py-2 text-sm font-bold">
                <Calendar className="h-4 w-4" />
                {issue.coverDate}
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-archive-ink/10 bg-white/70 px-3 py-2 text-sm font-bold">
                <BookOpen className="h-4 w-4" />
                Grade {issue.grade}
              </span>
            </div>

            <p className="mt-7 max-w-3xl text-base leading-7 text-archive-ink/72">{issue.notes}</p>

            <div className="mt-8 border-t border-archive-ink/10 pt-6">
              <h2 className="font-display text-2xl font-bold">Collection</h2>
              <div className="mt-3">
                <ComicActions />
              </div>
            </div>

            <div className="mt-8 grid gap-3 border-t border-archive-ink/10 pt-6 md:grid-cols-2">
              <ScanPanel label="Cover" status={coverScan?.status ?? "missing"} />
              <ScanPanel label="Back cover" status={backScan?.status ?? "missing"} />
            </div>

            <dl className="mt-8 grid gap-3 border-t border-archive-ink/10 pt-6 text-sm md:grid-cols-3">
              <Detail label="Creators" value={issue.creators.join(", ")} />
              <Detail label="Stored in" value={issue.box} />
              <Detail label="Year" value={String(issue.year)} />
            </dl>
          </article>
        </section>
      </div>
    </main>
  );
}

function ScanPanel({ label, status }: { label: string; status: string }) {
  return (
    <div className="rounded-lg border border-archive-ink/10 bg-white/48 p-4">
      <p className="font-bold">{label}</p>
      <p className="text-sm capitalize text-archive-ink/64">{status === "missing" ? "Scan needed" : `${status} demo scan`}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-bold uppercase text-archive-ink/48">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
