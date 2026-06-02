import { AdminCardImageUploader } from "@/components/AdminCardImageUploader";
import { getKnownPlayerCardPrototypes } from "@/lib/player-profiles";
import { getUpperDeckSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export default async function AdminCardImageUploaderPage({
  searchParams
}: {
  searchParams: Promise<{ cardSlug?: string }>;
}) {
  const [{ cardSlug }, { cards }] = await Promise.all([searchParams, getUpperDeckSetData()]);
  const knownPlayerCards = getKnownPlayerCardPrototypes().filter((knownCard) => !cards.some((card) => card.cardSlug === knownCard.cardSlug));

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <AdminCardImageUploader cards={[...cards, ...knownPlayerCards]} initialCardSlug={cardSlug} />
    </main>
  );
}
