import { ApprovedScanIngester } from "@/components/ApprovedScanIngester";

export default function ApprovedScanIngesterPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
      <section>
        <p className="text-sm font-bold uppercase text-archive-oxblood">Admin</p>
        <h1 className="font-display text-5xl font-bold">Approved Scan Ingester</h1>
        <p className="mt-3 max-w-3xl leading-7 text-archive-ink/70">
          Build a manifest for image URLs you have permission to use, then run the local ingest command to crop and
          prepare scan assets.
        </p>
      </section>
      <ApprovedScanIngester />
    </main>
  );
}
