import { CompletionStats } from "@/components/CompletionStats";
import { SetBinderClient } from "@/components/SetBinderClient";
import { SetHeader } from "@/components/SetHeader";
import { SetPackaging } from "@/components/SetPackaging";
import { buildTeams, getUpperDeckSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export default async function SetPage() {
  const { set, cards, source } = await getUpperDeckSetData();

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:px-5 md:py-8">
      <section className="grid gap-5 rounded-lg border border-white/74 bg-white/62 p-5 shadow-card backdrop-blur lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:p-7">
        <div className="grid content-end gap-5">
          <SetHeader set={set} />
          <CompletionStats cards={cards} totalCards={set.totalCards} />
        </div>
        <div className="grid content-end gap-3">
          <p className="text-xs font-bold uppercase text-archive-oxblood">Original packaging reference</p>
          <SetPackaging />
        </div>
      </section>
      {source === "supabase" ? (
        <p className="w-fit rounded-md border border-archive-field/20 bg-archive-field/10 px-3 py-2 text-xs font-bold uppercase text-archive-field">
          Reading cards from Supabase.
        </p>
      ) : null}
      <SetBinderClient cards={cards} teams={buildTeams(cards)} />
    </main>
  );
}
