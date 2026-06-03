import Link from "next/link";
import { ClipboardCheck, ImagePlus, PackageCheck } from "lucide-react";

const adminTools = [
  {
    description: "Review pending community scan submissions before they become approved card images.",
    href: "/admin/moderation",
    icon: ClipboardCheck,
    title: "Moderation queue"
  },
  {
    description: "Upload cleaned front and back card images directly into Supabase Storage.",
    href: "/admin/card-image-uploader",
    icon: ImagePlus,
    title: "Card image upload"
  },
  {
    description: "Ingest approved scans from the review queue into the archive workflow.",
    href: "/admin/approved-scan-ingester",
    icon: PackageCheck,
    title: "Approved scan ingest"
  }
];

export default function AdminPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <section>
        <p className="text-sm font-bold uppercase text-archive-oxblood">Admin</p>
        <h1 className="font-display text-5xl font-bold">Archive Tools</h1>
        <p className="mt-3 max-w-3xl leading-7 text-archive-ink/70">
          Review scans, upload approved card images, and keep the collection archive moving from one place.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {adminTools.map((tool) => {
          const Icon = tool.icon;

          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-lg border border-white/74 bg-white/64 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <Icon className="mb-4 h-6 w-6 text-archive-oxblood" />
              <h2 className="font-display text-2xl font-bold">{tool.title}</h2>
              <p className="mt-2 text-sm leading-6 text-archive-ink/70">{tool.description}</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
