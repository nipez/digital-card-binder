import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/supabase-auth-server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-5 py-8">
      <section className="rounded-lg border border-white/74 bg-white/66 p-6 shadow-card backdrop-blur">
        <p className="text-sm font-bold uppercase text-archive-oxblood">My Account</p>
        <h1 className="mt-2 font-display text-5xl font-bold">Collector Home</h1>
        <p className="mt-3 text-lg font-semibold text-archive-ink/70">{user.email}</p>
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
    </main>
  );
}
