import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { CompletionStats } from "@/components/CompletionStats";
import { SetHeader } from "@/components/SetHeader";
import { fleer1986BasketballSet } from "@/lib/fleer-basketball-data";
import { getUpperDeckSetData } from "@/lib/supabase-data";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/account`);
  }

  const { set, cards } = await getUpperDeckSetData();
  const archiveSections = [
    {
      count: `${set.totalCards} cards`,
      description: set.description,
      href: `/sets/${set.slug}`,
      title: set.name
    },
    {
      count: `${fleer1986BasketballSet.totalCards} cards`,
      description: fleer1986BasketballSet.description,
      href: `/sets/${fleer1986BasketballSet.slug}`,
      title: fleer1986BasketballSet.name
    },
    {
      count: "Comics prototype",
      description: "A longbox-style archive for key issues, shelves, covers, and collection grouping.",
      href: "/comics",
      title: "Comic Archive"
    }
  ];

  return (
    <main>
      <section className="border-b border-archive-ink/10 bg-[linear-gradient(135deg,rgba(110,47,43,0.94),rgba(47,107,79,0.88)),url('/placeholders/binder-texture.svg')] bg-cover text-white">
        <div className="mx-auto grid min-h-[520px] max-w-7xl content-center gap-8 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/12 px-3 py-1 text-sm">
              <Sparkles className="h-4 w-4" />
              Premium set archive MVP
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">Binder Archive</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/86">
              Browse the 1989 Upper Deck Baseball checklist like a careful nine-pocket binder: sleeve by sleeve,
              scan by scan, with collection actions ready for the cards you remember.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#archive-directory"
                className="inline-flex items-center gap-2 rounded-md bg-archive-brass px-5 py-3 font-bold text-archive-ink shadow-card transition hover:translate-y-[-1px]"
              >
                Browse archive <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/my-collection"
                className="inline-flex items-center gap-2 rounded-md border border-white/24 px-5 py-3 font-bold text-white transition hover:translate-y-[-1px]"
              >
                My collection <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="self-end rounded-lg border border-white/18 bg-white/12 p-4 shadow-card backdrop-blur">
            <SetHeader set={set} compact />
            <CompletionStats cards={cards} totalCards={set.totalCards} />
          </div>
        </div>
      </section>
      <section id="archive-directory" className="mx-auto grid max-w-7xl gap-5 px-5 py-10 md:grid-cols-3">
        {archiveSections.map((section) => (
          <Link key={section.href} href={section.href} className="rounded-lg border border-archive-ink/10 bg-white/55 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
            <BookOpen className="mb-4 h-6 w-6 text-archive-oxblood" />
            <h2 className="font-display text-2xl font-bold">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-archive-ink/72">{section.description}</p>
            <p className="mt-3 text-xs font-bold uppercase text-archive-oxblood">{section.count}</p>
          </Link>
        ))}
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 md:grid-cols-3">
        {["Nine-pocket browsing", "Scan-first collecting", "Moderation ready"].map((title, index) => (
          <article key={title} className="rounded-lg border border-archive-ink/10 bg-white/55 p-5 shadow-sm">
            <BookOpen className="mb-4 h-6 w-6 text-archive-oxblood" />
            <h2 className="font-display text-2xl font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-archive-ink/72">
              {index === 0
                ? "The set view uses binder sleeves with card-slot rhythm and quick filters."
                : index === 1
                  ? "Missing fronts and backs are visible, inviting clean community scan submissions."
                  : "Admin queues and event tables are included for approval workflows."}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
