import { notFound, redirect } from "next/navigation";
import { CardDetailModal } from "@/components/CardDetailModal";
import { getKnownPlayerCardBySlug, getKnownPlayerCards } from "@/lib/player-profiles";
import { getSupabaseCardBySlug, getUpperDeckSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const { cards } = await getUpperDeckSetData();
  const knownCards = getKnownPlayerCards("ken-griffey-jr");
  return [...cards.map((card) => ({ cardSlug: card.cardSlug })), ...knownCards.map((card) => ({ cardSlug: card.slug }))];
}

export default async function CardPage({ params }: { params: Promise<{ cardSlug: string }> }) {
  const { cardSlug } = await params;

  if (cardSlug === "4-gregg-jefferies") {
    redirect("/cards/9-gregg-jefferies");
  }

  const card = (await getSupabaseCardBySlug(cardSlug)) ?? getKnownPlayerCardBySlug(cardSlug);

  if (!card) {
    notFound();
  }

  return <CardDetailModal card={card} />;
}
