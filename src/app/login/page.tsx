import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/supabase-auth-server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/account");
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-8">
      <section>
        <p className="text-sm font-bold uppercase text-archive-oxblood">Collector account</p>
        <h1 className="font-display text-5xl font-bold">Log In</h1>
        <p className="mt-3 leading-7 text-archive-ink/70">
          Save cards to your collection, mark wants, and keep favorite cards close as the archive grows.
        </p>
      </section>
      <AuthForm />
      <Link href="/sets/1986-fleer-basketball" className="text-sm font-bold text-archive-oxblood hover:text-archive-ink">
        Back to the binder
      </Link>
    </main>
  );
}
