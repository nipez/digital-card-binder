"use client";

import { KeyRound, Loader2, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Mode = "forgot" | "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCooldown, setResetCooldown] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!resetCooldown) {
      return;
    }

    const timer = window.setTimeout(() => setResetCooldown((current) => Math.max(current - 1, 0)), 1000);

    return () => window.clearTimeout(timer);
  }, [resetCooldown]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase Auth is not configured.");
      return;
    }

    setStatus("loading");
    setMessage(mode === "login" ? "Signing in..." : mode === "signup" ? "Creating account..." : "Sending reset email...");

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      });

      if (error) {
        setStatus("error");
        setMessage(getFriendlyAuthError(error.message));
        setResetCooldown(60);
        return;
      }

      setStatus("success");
      setMessage("Password reset email sent. Check your inbox for the reset link.");
      setResetCooldown(60);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`
        }
      });

      if (error) {
        setStatus("error");
        setMessage(getFriendlyAuthError(error.message));
        return;
      }

      setStatus("success");

      if (!data.session) {
        setMessage("Account created. Check your email to confirm your address before signing in.");
        return;
      }

      setMessage("Signed in.");
      router.push("/account");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setMessage(getFriendlyAuthError(error.message));
      return;
    }

    setStatus("success");
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
      {mode === "forgot" ? (
        <p className="rounded-md border border-archive-ink/10 bg-archive-paper/70 p-3 text-sm font-semibold text-archive-ink/70">
          Enter your account email and we will send a password reset link.
        </p>
      ) : null}
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
      {mode !== "forgot" ? (
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
      ) : null}
      <button
        type="submit"
        disabled={status === "loading" || (mode === "forgot" && resetCooldown > 0)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-archive-oxblood px-4 font-bold text-white disabled:opacity-55"
      >
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? <LogIn className="h-4 w-4" /> : mode === "signup" ? <UserPlus className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
        {mode === "login" ? "Log in" : mode === "signup" ? "Create account" : resetCooldown > 0 ? `Try again in ${resetCooldown}s` : "Send reset link"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}
        className="justify-self-start text-sm font-bold text-archive-oxblood hover:text-archive-ink"
      >
        {mode === "forgot" ? "Back to log in" : "Forgot password?"}
      </button>
      {message ? (
        <p className={`rounded-md border p-3 text-sm font-bold ${status === "error" ? "border-archive-oxblood/30 bg-archive-oxblood/10 text-archive-oxblood" : "border-archive-field/25 bg-archive-field/10 text-archive-field"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit")) {
    return "Too many auth emails were requested. Wait a minute, then try again.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "That email and password do not match. Try again or reset your password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email address before logging in.";
  }

  return message;
}
