import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Star, CheckCircle2 } from "lucide-react";
import { MyCollectionClient, type MyCollectionCard } from "@/components/MyCollectionClient";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/supabase-auth-server";
import type { CollectionAction } from "@/types/binder";

export const dynamic = "force-dynamic";

type CollectionRow = {
  card_id: string;
  state: CollectionAction;
};

type CardRow = {
  id: string;
  set_id: string;
  card_number: number;
  slug: string;
  player_name: string;
  team: string;
  card_images: {
    image_url: string | null;
    side: "front" | "back";
    status: "approved" | "missing" | "pending" | "rejected";
  }[];
};

type SetRow = {
  id: string;
  name: string;
  slug: string;
  year: number;
};

export default async function MyCollectionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="font-display text-5xl font-bold">My Collection</h1>
        <p className="mt-3 rounded-md border border-archive-oxblood/25 bg-archive-oxblood/10 p-4 font-bold text-archive-oxblood">
          Supabase admin access is not configured, so collection cards cannot be loaded yet.
        </p>
      </main>
    );
  }

  const { data: collectionRows } = await supabase
    .from("user_collections")
    .select("card_id, state")
    .eq("user_id", user.id)
    .returns<CollectionRow[]>();
  const cardIds = Array.from(new Set((collectionRows ?? []).map((row) => row.card_id)));

  const { data: cardRows } = cardIds.length
    ? await supabase
        .from("cards")
        .select("id, set_id, card_number, slug, player_name, team, card_images(side, image_url, status)")
        .in("id", cardIds)
        .order("card_number", { ascending: true })
        .returns<CardRow[]>()
    : { data: [] };
  const setIds = Array.from(new Set((cardRows ?? []).map((card) => card.set_id)));
  const { data: setRows } = setIds.length
    ? await supabase.from("sets").select("id, name, slug, year").in("id", setIds).returns<SetRow[]>()
    : { data: [] };
  const setsById = new Map((setRows ?? []).map((set) => [set.id, set]));
  const statesByCardId = new Map<string, CollectionAction[]>();

  for (const row of collectionRows ?? []) {
    statesByCardId.set(row.card_id, [...(statesByCardId.get(row.card_id) ?? []), row.state]);
  }

  const cards: MyCollectionCard[] = (cardRows ?? []).map((card) => {
    const set = setsById.get(card.set_id);

    return {
      cardNumber: card.card_number,
      frontImage: card.card_images.find((image) => image.side === "front" && image.status === "approved")?.image_url,
      id: card.id,
      playerName: card.player_name,
      setName: set?.name,
      setYear: set?.year,
      slug: card.slug,
      states: statesByCardId.get(card.id) ?? [],
      team: card.team
    };
  });
  const ownedCards = cards.filter((card) => card.states.includes("have"));
  const wantedCards = cards.filter((card) => card.states.includes("want"));
  const favoriteCards = cards.filter((card) => card.states.includes("favorite"));

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-archive-oxblood">Collector binder</p>
          <h1 className="font-display text-5xl font-bold">My Collection</h1>
          <p className="mt-3 leading-7 text-archive-ink/70">Cards you have, want, or keep close across the archive.</p>
        </div>
        <Link href="/account" className="inline-flex h-10 items-center rounded-md border border-archive-ink/10 bg-white/70 px-3 text-sm font-bold shadow-sm">
          Account
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="In collection" value={ownedCards.length} />
        <SummaryCard icon={<Heart className="h-5 w-5" />} label="Want" value={wantedCards.length} />
        <SummaryCard icon={<Star className="h-5 w-5" />} label="Favorites" value={favoriteCards.length} />
      </section>

      {cards.length ? (
        <MyCollectionClient cards={cards} />
      ) : (
        <section className="rounded-lg border border-white/74 bg-white/64 p-6 shadow-sm">
          <h2 className="font-display text-3xl font-bold">No cards saved yet</h2>
          <p className="mt-2 text-archive-ink/70">Open a card and choose Add to my collection, Want, or Favorite.</p>
          <Link href="/sets/1986-fleer-basketball" className="mt-4 inline-flex h-10 items-center rounded-md bg-archive-oxblood px-4 text-sm font-bold text-white">
            Browse 1986 Fleer
          </Link>
        </section>
      )}
    </main>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-lg border border-white/74 bg-white/64 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-archive-oxblood">
        {icon}
        <p className="text-sm font-bold uppercase">{label}</p>
      </div>
      <p className="mt-3 font-display text-4xl font-bold">{value}</p>
    </article>
  );
}
