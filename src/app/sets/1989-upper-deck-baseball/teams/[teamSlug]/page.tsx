import { notFound } from "next/navigation";
import { SetBinderClient } from "@/components/SetBinderClient";
import { demoCards, getTeamCards, getTeams, upperDeck1989Set } from "@/lib/demo-data";

export function generateStaticParams() {
  return getTeams().map((team) => ({ teamSlug: team.slug }));
}

export default async function TeamBinderPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const cards = getTeamCards(teamSlug);
  const team = getTeams().find((item) => item.slug === teamSlug);

  if (!team) {
    notFound();
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
      <section className="rounded-lg border border-archive-ink/10 bg-white/54 p-6 shadow-sm">
        <p className="text-sm font-bold uppercase text-archive-oxblood">{upperDeck1989Set.name}</p>
        <h1 className="font-display text-5xl font-bold">{team.name}</h1>
        <p className="mt-2 text-archive-ink/68">{cards.length} demo cards in this team binder.</p>
      </section>
      <SetBinderClient cards={demoCards} teams={getTeams()} initialFilters={{ team: teamSlug }} />
    </main>
  );
}
