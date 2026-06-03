import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { getCurrentUser } from "@/lib/supabase-auth-server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-8">
      <section>
        <p className="text-sm font-bold uppercase text-archive-oxblood">Collector account</p>
        <h1 className="font-display text-5xl font-bold">Reset Password</h1>
        <p className="mt-3 leading-7 text-archive-ink/70">Choose a new password for your Binder Archive account.</p>
      </section>
      <ResetPasswordForm />
      <Link href="/account" className="text-sm font-bold text-archive-oxblood hover:text-archive-ink">
        Back to account
      </Link>
    </main>
  );
}
