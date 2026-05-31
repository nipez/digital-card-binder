import { SubmitScanForm } from "@/components/SubmitScanForm";

export default function SubmitScanPage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-8">
      <section>
        <p className="text-sm font-bold uppercase text-archive-oxblood">Community scans</p>
        <h1 className="font-display text-5xl font-bold">Submit Scan</h1>
        <p className="mt-3 leading-7 text-archive-ink/70">
          Upload clean front or back scans for moderator review. The MVP form is wired for the intended fields and ready
          to connect to Supabase Storage.
        </p>
      </section>
      <SubmitScanForm />
    </main>
  );
}
