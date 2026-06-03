"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isLoggingOut}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-archive-ink/10 bg-white/70 px-3 text-sm font-bold text-archive-ink shadow-sm transition hover:text-archive-oxblood disabled:opacity-55"
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}
