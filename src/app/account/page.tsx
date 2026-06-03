import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Heart, ImagePlus, Shield, Star, CheckCircle2 } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/supabase-auth-server";
import type { CollectionAction } from "@/types/binder";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const collectionCounts = await getCollectionCounts(user.id);
  const quickLinks = [
    { href: "/my-collection", icon: BookOpen, label: "My Collection" },
    { href: "/", icon: BookOpen, label: "Archive" },
    { href: "/submit-scan", icon: ImagePlus, label: "Submit Scan" },
    { href: "/admin", icon: Shield, label: "Admin" }
  ];

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8">
      <section className="rounded-lg border border-white/74 bg-white/66 p-6 shadow-card backdrop-blur">
        <p className="text-sm font-bold uppercase text-archive-oxblood">My Account</p>
        <h1 className="mt-2 font-display text-5xl font-bold">Collector Home</h1>
        <p className="mt-3 text-lg font-semibold text-archive-ink/70">{user.email}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <AccountStat icon={<CheckCircle2 className="h-5 w-5" />} label="In collection" value={collectionCounts.have} />
          <AccountStat icon={<Heart className="h-5 w-5" />} label="Want" value={collectionCounts.want} />
          <AccountStat icon={<Star className="h-5 w-5" />} label="Favorites" value={collectionCounts.favorite} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/my-collection"
            className="inline-flex h-10 items-center rounded-md bg-archive-oxblood px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
          >
            View my collection
          </Link>
          <LogoutButton />
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href} className="rounded-lg border border-white/74 bg-white/60 p-4 font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
              <Icon className="mb-3 h-5 w-5 text-archive-oxblood" />
              {link.label}
            </Link>
          );
        })}
      </section>
    </main>
  );
}

async function getCollectionCounts(userId: string) {
  const supabase = createAdminSupabaseClient();
  const emptyCounts: Record<CollectionAction, number> = {
    favorite: 0,
    have: 0,
    want: 0
  };

  if (!supabase) {
    return emptyCounts;
  }

  const { data } = await supabase.from("user_collections").select("state").eq("user_id", userId).returns<{ state: CollectionAction }[]>();

  return (data ?? []).reduce(
    (counts, row) => ({
      ...counts,
      [row.state]: counts[row.state] + 1
    }),
    emptyCounts
  );
}

function AccountStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-lg border border-archive-ink/10 bg-white/64 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-archive-oxblood">
        {icon}
        <p className="text-xs font-black uppercase">{label}</p>
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </article>
  );
}
