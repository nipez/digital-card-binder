import { ApprovedScanIngester } from "@/components/ApprovedScanIngester";
import { getUpperDeckSetData } from "@/lib/supabase-data";

export default async function ApprovedScanIngesterPage() {
  const { cards } = await getUpperDeckSetData();
  const cardOptions = cards.map((card) => ({
    slug: card.cardSlug,
    label: `#${card.number} ${card.playerName}`
  }));

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
      <section>
        <p className="text-sm font-bold uppercase text-archive-oxblood">Admin</p>
        <h1 className="font-display text-5xl font-bold">Approved Scan Ingester</h1>
        <p className="mt-3 max-w-3xl leading-7 text-archive-ink/70">
          Prepare owned, licensed, or permissioned scans with a simple card picker, upload field, and crop preview.
        </p>
      </section>
      <ApprovedScanIngester cards={cardOptions} />
    </main>
  );
}
