import Image from "next/image";
import Link from "next/link";
import { CompletionStats } from "@/components/CompletionStats";
import { SetBinderClient } from "@/components/SetBinderClient";
import { SetHeader } from "@/components/SetHeader";
import { buildTeams, getFleerBasketballSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export default async function FleerBasketballSetPage() {
  const { set, cards } = await getFleerBasketballSetData();
  const iconicCard = cards.find((card) => card.cardSlug === "57-michael-jordan") ?? cards.find((card) => card.number === 57);
  const iconicFrontImage = iconicCard?.images.find((image) => image.side === "front")?.imageUrl ?? "/placeholders/front-needed.svg";

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:px-5 md:py-8">
      <section className="grid gap-5 rounded-lg border border-white/74 bg-white/62 p-5 shadow-card backdrop-blur lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:p-7">
        <div className="grid content-end gap-5">
          <SetHeader set={set} />
          <CompletionStats cards={cards} totalCards={set.totalCards} />
        </div>
        <Link
          href={iconicCard ? `/cards/${iconicCard.cardSlug}` : "/cards/57-michael-jordan"}
          className="grid min-h-[320px] items-center gap-6 rounded-lg border border-archive-ink/10 bg-archive-ink p-6 text-white transition hover:-translate-y-0.5 hover:shadow-card md:grid-cols-[minmax(180px,0.72fr)_minmax(0,1fr)] lg:min-h-[360px] lg:p-8"
        >
          <span className="relative block aspect-[2.5/3.5] w-full max-w-64 justify-self-center overflow-hidden rounded-md border border-white/18 bg-black/28 shadow-card">
            <Image
              src={iconicFrontImage}
              alt="#57 Michael Jordan front scan"
              fill
              priority
              className="object-contain"
              sizes="(min-width: 1024px) 256px, (min-width: 768px) 34vw, 62vw"
            />
          </span>
          <span className="grid max-w-md content-center gap-3 justify-self-center md:justify-self-start">
            <span className="text-xs font-bold uppercase text-archive-brass">Iconic card</span>
            <span className="font-display text-4xl font-bold leading-tight lg:text-5xl">#57 Michael Jordan</span>
            <span className="leading-7 text-white/78">
              The Jordan rookie anchors this starter checklist alongside Barkley, Ewing, Malone, Olajuwon, Drexler,
              Wilkins, and other Hall of Fame names.
            </span>
          </span>
        </Link>
      </section>
      <SetBinderClient cards={cards} teams={buildTeams(cards)} totalCards={set.totalCards} submitHref="/submit-scan?set=1986-fleer-basketball" />
    </main>
  );
}
