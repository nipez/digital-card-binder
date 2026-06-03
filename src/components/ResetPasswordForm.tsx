"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase Auth is not configured.");
      return;
    }

    setStatus("loading");
    setMessage("Updating password...");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Password updated.");
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-archive-ink/10 bg-white/66 p-6 shadow-card">
      <label className="grid gap-2 text-sm font-bold">
        New password
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
          minLength={6}
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Confirm password
        <input
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
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
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Update password
      </button>
      {message ? (
        <p className={`rounded-md border p-3 text-sm font-bold ${status === "error" ? "border-archive-oxblood/30 bg-archive-oxblood/10 text-archive-oxblood" : "border-archive-field/25 bg-archive-field/10 text-archive-field"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
