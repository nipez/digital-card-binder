import { SubmitScanForm } from "@/components/SubmitScanForm";
import { getFleerBasketballSetData, getUpperDeckSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export default async function SubmitScanPage({
  searchParams
}: {
  searchParams: Promise<{ set?: string }>;
}) {
  const { set: setSlug } = await searchParams;
  const { cards, set } = setSlug === "1986-fleer-basketball" ? await getFleerBasketballSetData() : await getUpperDeckSetData();

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-8">
      <section>
        <p className="text-sm font-bold uppercase text-archive-oxblood">Community scans</p>
        <h1 className="font-display text-5xl font-bold">Submit Scan</h1>
        <p className="mt-3 leading-7 text-archive-ink/70">
          Upload clean front or back scans for moderator review. Approved submissions help complete missing card images
          across the archive.
        </p>
        <p className="mt-2 text-sm font-bold text-archive-oxblood">{set.name}</p>
      </section>
      <SubmitScanForm cards={cards} />
    </main>
  );
}
