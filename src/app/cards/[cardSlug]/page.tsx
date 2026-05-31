import { notFound } from "next/navigation";
import { CardDetailModal } from "@/components/CardDetailModal";
import { demoCards, getCardBySlug } from "@/lib/demo-data";

export function generateStaticParams() {
  return demoCards.map((card) => ({ cardSlug: card.cardSlug }));
}

export default async function CardPage({ params }: { params: Promise<{ cardSlug: string }> }) {
  const { cardSlug } = await params;
  const card = getCardBySlug(cardSlug);

  if (!card) {
    notFound();
  }

  return <CardDetailModal card={card} />;
}
