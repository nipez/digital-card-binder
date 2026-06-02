import { ModerationQueue } from "@/components/ModerationQueue";

export const dynamic = "force-dynamic";

export default function AdminModerationPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <section>
        <p className="text-sm font-bold uppercase text-archive-oxblood">Admin</p>
        <h1 className="font-display text-5xl font-bold">Moderation Queue</h1>
        <p className="mt-3 leading-7 text-archive-ink/70">
          Review pending scan submissions before they become approved card images.
        </p>
      </section>
      <ModerationQueue />
    </main>
  );
}
