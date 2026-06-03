import { notFound } from "next/navigation";
import { SetBinderClient } from "@/components/SetBinderClient";
import { buildTeams, getSupabaseTeams, getUpperDeckSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const teams = await getSupabaseTeams();
  return teams.map((team) => ({ teamSlug: team.slug }));
}

export default async function TeamBinderPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const { cards, set } = await getUpperDeckSetData();
  const teams = buildTeams(cards);
  const teamCards = cards.filter((card) => card.teamSlug === teamSlug);
  const team = teams.find((item) => item.slug === teamSlug);

  if (!team) {
    notFound();
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
      <section className="rounded-lg border border-archive-ink/10 bg-white/54 p-6 shadow-sm">
        <p className="text-sm font-bold uppercase text-archive-oxblood">{set.name}</p>
        <h1 className="font-display text-5xl font-bold">{team.name}</h1>
        <p className="mt-2 text-archive-ink/68">{teamCards.length} cards in this team binder.</p>
      </section>
      <SetBinderClient cards={cards} teams={teams} totalCards={set.totalCards} initialFilters={{ team: teamSlug }} />
    </main>
  );
}
