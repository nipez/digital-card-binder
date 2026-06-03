"use client";

import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase Auth is not configured.");
      return;
    }

    setStatus("loading");
    setMessage(mode === "login" ? "Signing in..." : "Creating account...");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`
            }
          });

    if (result.error) {
      setStatus("error");
      setMessage(result.error.message);
      return;
    }

    setStatus("success");

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm your address before signing in.");
      return;
    }

    setMessage("Signed in.");
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-archive-ink/10 bg-white/66 p-6 shadow-card">
      <div className="grid grid-cols-2 gap-2 rounded-md bg-archive-ink/8 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`h-10 rounded-md text-sm font-bold ${mode === "login" ? "bg-white text-archive-oxblood shadow-sm" : "text-archive-ink/64"}`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`h-10 rounded-md text-sm font-bold ${mode === "signup" ? "bg-white text-archive-oxblood shadow-sm" : "text-archive-ink/64"}`}
        >
          Sign up
        </button>
      </div>
      <label className="grid gap-2 text-sm font-bold">
        Email
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Password
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={6}
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
          required
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-archive-oxblood px-4 font-bold text-white disabled:opacity-55"
      >
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {mode === "login" ? "Log in" : "Create account"}
      </button>
      {message ? (
        <p className={`rounded-md border p-3 text-sm font-bold ${status === "error" ? "border-archive-oxblood/30 bg-archive-oxblood/10 text-archive-oxblood" : "border-archive-field/25 bg-archive-field/10 text-archive-field"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
