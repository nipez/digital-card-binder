import Link from "next/link";
import { ArrowLeft, Award, BookOpen, CalendarDays, Library, Lightbulb, Medal, Search, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { FlipCard } from "@/components/FlipCard";
import { getPlayerCards, getPlayerProfile, getPlayerSlug } from "@/lib/player-profiles";
import { getUpperDeckSetData } from "@/lib/supabase-data";
import type { Card } from "@/types/binder";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const { cards } = await getUpperDeckSetData();
  return Array.from(new Set(cards.map((card) => getPlayerSlug(card.playerName)))).map((playerSlug) => ({ playerSlug }));
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ playerSlug: string }> }) {
  const { playerSlug } = await params;
  const { cards } = await getUpperDeckSetData();
  const profile = getPlayerProfile(cards, playerSlug);
  const playerCards = getPlayerCards(cards, playerSlug);

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(181,138,67,0.18),transparent_32%),linear-gradient(90deg,rgba(110,47,43,0.08)_0_1px,transparent_1px_100%),linear-gradient(rgba(47,107,79,0.07)_0_1px,transparent_1px_100%),#f7efe0] bg-[length:auto,42px_42px,42px_42px,auto]">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
        <Link href="/sets/1989-upper-deck-baseball" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-archive-oxblood">
          <ArrowLeft className="h-4 w-4" />
          Back to binder
        </Link>

        <section className="overflow-hidden rounded-lg border border-white/74 bg-white/66 shadow-card backdrop-blur">
          <div className="grid items-center gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-7">
            <div>
              <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-archive-oxblood/18 bg-archive-oxblood/10 px-3 py-1 text-xs font-black uppercase text-archive-oxblood">
                <Sparkles className="h-4 w-4" />
                Player archive
              </p>
              <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">{profile.displayName}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-archive-ink/72">{profile.dek}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.heroStat ? <HeroBadge icon={<Award className="h-4 w-4" />} label={profile.heroStat} /> : null}
                {profile.careerYears ? <HeroBadge icon={<CalendarDays className="h-4 w-4" />} label={profile.careerYears} /> : null}
                {profile.positions.length > 0 ? <HeroBadge icon={<Medal className="h-4 w-4" />} label={profile.positions.join(" / ")} /> : null}
                <HeroBadge icon={<Library className="h-4 w-4" />} label={`${playerCards.length} archive card${playerCards.length === 1 ? "" : "s"}`} />
              </div>
            </div>
            <HeroCard cards={playerCards} />
          </div>
        </section>

        <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid content-start gap-5">
            <ProfilePanel icon={<BookOpen className="h-5 w-5" />} title="Bio">
              <div className="grid gap-4 text-base leading-8 text-archive-ink/72">
                {profile.bio.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </ProfilePanel>

            <ProfilePanel icon={<Library className="h-5 w-5" />} title="Cards In This Archive">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {playerCards.map((card) => (
                  <PlayerCardTile key={card.id} card={card} />
                ))}
              </div>
            </ProfilePanel>

            {profile.knownCards ? <KnownCardsPanel knownCards={profile.knownCards} /> : null}
          </div>

          <aside className="grid content-start gap-5">
            <ProfilePanel icon={<Lightbulb className="h-5 w-5" />} title="Did You Know">
              <ul className="grid gap-3 text-sm leading-6 text-archive-ink/72">
                {profile.trivia.map((fact) => (
                  <li key={fact} className="rounded-md border border-archive-ink/10 bg-archive-paper/58 p-3 font-semibold">
                    {fact}
                  </li>
                ))}
              </ul>
            </ProfilePanel>

            <ProfilePanel icon={<CalendarDays className="h-5 w-5" />} title="Timeline">
              <div className="grid gap-3">
                {profile.timeline.map((item) => (
                  <div key={`${item.year}-${item.label}`} className="grid grid-cols-[64px_1fr] gap-3">
                    <span className="font-display text-xl font-bold text-archive-oxblood">{item.year}</span>
                    <span>
                      <span className="block font-bold">{item.label}</span>
                      <span className="block text-sm leading-6 text-archive-ink/62">{item.detail}</span>
                    </span>
                  </div>
                ))}
              </div>
            </ProfilePanel>

            <ProfilePanel icon={<Sparkles className="h-5 w-5" />} title="Collector Notes">
              <ul className="grid gap-3 text-sm leading-6 text-archive-ink/72">
                {profile.collectingNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </ProfilePanel>
          </aside>
        </section>
      </div>
    </main>
  );
}

function KnownCardsPanel({ knownCards }: { knownCards: NonNullable<ReturnType<typeof getPlayerProfile>>["knownCards"] }) {
  if (!knownCards) {
    return null;
  }

  return (
    <ProfilePanel icon={<Search className="h-5 w-5" />} title="Known Card Universe">
      <div className="grid gap-4">
        <div className="rounded-lg border border-archive-field/15 bg-archive-field/8 p-4">
          <p className="text-xs font-black uppercase text-archive-field">Estimated checklist scale</p>
          <p className="mt-1 font-display text-3xl font-bold">{knownCards.totalLabel}</p>
          <p className="mt-3 text-sm leading-6 text-archive-ink/68">{knownCards.note}</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-archive-ink/10 bg-white/48">
          <div className="grid grid-cols-[70px_minmax(0,1fr)_92px] gap-3 border-b border-archive-ink/10 px-3 py-2 text-xs font-black uppercase text-archive-ink/48 sm:grid-cols-[70px_minmax(0,1fr)_110px_120px]">
            <span>Year</span>
            <span>Card</span>
            <span>Type</span>
            <span className="hidden sm:block">Team</span>
          </div>
          <div className="divide-y divide-archive-ink/10">
            {knownCards.keyCards.map((card) => (
              <article key={`${card.year}-${card.setName}-${card.cardNumber}`} className="grid grid-cols-[70px_minmax(0,1fr)_92px] gap-3 px-3 py-3 sm:grid-cols-[70px_minmax(0,1fr)_110px_120px]">
                <span className="font-display text-xl font-bold text-archive-oxblood">{card.year}</span>
                <span>
                  <span className="block font-bold">
                    {card.setName} <span className="text-archive-ink/48">{card.cardNumber}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-archive-ink/62">{card.note}</span>
                </span>
                <span className="text-sm font-bold text-archive-ink/72">{card.category}</span>
                <span className="hidden text-sm font-semibold text-archive-ink/54 sm:block">{card.team ?? "Multiple"}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </ProfilePanel>
  );
}

function HeroCard({ cards }: { cards: Card[] }) {
  const card = cards[0];

  if (!card) {
    return (
      <div className="grid aspect-[2.5/3.5] place-items-center rounded-lg border border-dashed border-archive-ink/18 bg-white/40 p-6 text-center font-bold text-archive-ink/52">
        No cards linked yet.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[220px] sm:max-w-[250px] lg:max-w-[260px]">
      <FlipCard card={card} large />
      <Link href={`/cards/${card.cardSlug}`} className="mt-3 block text-center text-sm font-bold text-archive-oxblood hover:underline">
        View card #{card.number}
      </Link>
    </div>
  );
}

function PlayerCardTile({ card }: { card: Card }) {
  const front = card.images.find((image) => image.side === "front");
  const back = card.images.find((image) => image.side === "back");

  return (
    <Link href={`/cards/${card.cardSlug}`} className="rounded-lg border border-archive-ink/10 bg-white/58 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <p className="text-xs font-black uppercase text-archive-oxblood">1989 Upper Deck Baseball</p>
      <h3 className="mt-1 font-display text-2xl font-bold">#{card.number}</h3>
      <p className="mt-1 text-sm font-semibold text-archive-ink/62">
        {card.team} • {card.position}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold uppercase">
        <span className={`rounded-md px-2 py-1 ${front?.status === "missing" ? "bg-archive-oxblood/10 text-archive-oxblood" : "bg-archive-field/10 text-archive-field"}`}>
          Front {front?.status ?? "missing"}
        </span>
        <span className={`rounded-md px-2 py-1 ${back?.status === "missing" ? "bg-archive-oxblood/10 text-archive-oxblood" : "bg-archive-field/10 text-archive-field"}`}>
          Back {back?.status ?? "missing"}
        </span>
      </div>
    </Link>
  );
}

function ProfilePanel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="self-start rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
      <h2 className="mb-4 flex items-center gap-2 font-display text-3xl font-bold">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-archive-oxblood/10 text-archive-oxblood">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function HeroBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-archive-ink/10 bg-white/62 px-3 py-2 text-sm font-bold text-archive-ink">
      {icon}
      {label}
    </span>
  );
}
