import { notFound, redirect } from "next/navigation";
import { CardDetailModal } from "@/components/CardDetailModal";
import { getSupabaseCardBySlug, getUpperDeckSetData } from "@/lib/supabase-data";

export const revalidate = 60;

export async function generateStaticParams() {
  const { cards } = await getUpperDeckSetData();
  return cards.map((card) => ({ cardSlug: card.cardSlug }));
}

export default async function CardPage({ params }: { params: Promise<{ cardSlug: string }> }) {
  const { cardSlug } = await params;

  if (cardSlug === "4-gregg-jefferies") {
    redirect("/cards/9-gregg-jefferies");
  }

  const card = await getSupabaseCardBySlug(cardSlug);

  if (!card) {
    notFound();
  }

  return <CardDetailModal card={card} />;
}
