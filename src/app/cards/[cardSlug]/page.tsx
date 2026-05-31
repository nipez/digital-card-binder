import { notFound } from "next/navigation";
import { CardDetailModal } from "@/components/CardDetailModal";
import { getSupabaseCardBySlug, getUpperDeckSetData } from "@/lib/supabase-data";

export const revalidate = 60;

export async function generateStaticParams() {
  const { cards } = await getUpperDeckSetData();
  return cards.map((card) => ({ cardSlug: card.cardSlug }));
}

export default async function CardPage({ params }: { params: Promise<{ cardSlug: string }> }) {
  const { cardSlug } = await params;
  const card = await getSupabaseCardBySlug(cardSlug);

  if (!card) {
    notFound();
  }

  return <CardDetailModal card={card} />;
}
