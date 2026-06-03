import { AdminCardImageUploader } from "@/components/AdminCardImageUploader";
import { fleer1986BasketballCards } from "@/lib/fleer-basketball-data";
import { getKnownPlayerCardPrototypes } from "@/lib/player-profiles";
import { getUpperDeckSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export default async function AdminCardImageUploaderPage({
  searchParams
}: {
  searchParams: Promise<{ cardSlug?: string }>;
}) {
  const [{ cardSlug }, { cards }] = await Promise.all([searchParams, getUpperDeckSetData()]);
  const uploadCards = [...cards, ...fleer1986BasketballCards];
  const knownPlayerCards = getKnownPlayerCardPrototypes().filter((knownCard) => !uploadCards.some((card) => card.cardSlug === knownCard.cardSlug));

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <AdminCardImageUploader cards={[...uploadCards, ...knownPlayerCards]} initialCardSlug={cardSlug} />
    </main>
  );
}
