import { CompletionStats } from "@/components/CompletionStats";
import { SetBinderClient } from "@/components/SetBinderClient";
import { SetHeader } from "@/components/SetHeader";
import { demoCards, getTeams, upperDeck1989Set } from "@/lib/demo-data";

export default function SetPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
      <section className="grid gap-5 rounded-lg border border-archive-ink/10 bg-white/54 p-6 shadow-sm lg:grid-cols-[1fr_440px]">
        <SetHeader set={upperDeck1989Set} />
        <CompletionStats cards={demoCards} totalCards={upperDeck1989Set.totalCards} />
      </section>
      <SetBinderClient cards={demoCards} teams={getTeams()} />
    </main>
  );
}
