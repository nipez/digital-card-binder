import { AdminCardImageUploader } from "@/components/AdminCardImageUploader";
import { getUpperDeckSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export default async function AdminCardImageUploaderPage({
  searchParams
}: {
  searchParams: Promise<{ cardSlug?: string }>;
}) {
  const [{ cardSlug }, { cards }] = await Promise.all([searchParams, getUpperDeckSetData()]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <AdminCardImageUploader cards={cards} initialCardSlug={cardSlug} />
    </main>
  );
}
