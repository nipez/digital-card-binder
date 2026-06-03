"use client";

import { Check, Heart, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CollectionAction } from "@/types/binder";

const actions: { id: CollectionAction; label: string; icon: React.ReactNode }[] = [
  { id: "have", label: "Add to my collection", icon: <Check className="h-4 w-4" /> },
  { id: "want", label: "Want", icon: <Heart className="h-4 w-4" /> },
  { id: "favorite", label: "Favorite", icon: <Star className="h-4 w-4" /> }
];

export function CollectionActions({ cardSlug }: { cardSlug: string }) {
  const [selected, setSelected] = useState<CollectionAction[]>([]);
  const [signedIn, setSignedIn] = useState(true);
  const [pendingAction, setPendingAction] = useState<CollectionAction | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadStates() {
      const response = await fetch(`/api/collection-actions?cardSlug=${encodeURIComponent(cardSlug)}`);
      const result = (await response.json()) as { error?: string; signedIn?: boolean; states?: CollectionAction[] };

      if (!isCurrent) {
        return;
      }

      if (response.ok) {
        setSelected(result.states ?? []);
        setSignedIn(result.signedIn ?? true);
      } else {
        setMessage(result.error ?? "Could not load collection state.");
      }
    }

    loadStates();

    return () => {
      isCurrent = false;
    };
  }, [cardSlug]);

  async function toggleAction(action: CollectionAction) {
    const active = selected.includes(action);
    setPendingAction(action);
    setMessage("");

    const response = await fetch("/api/collection-actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        active: !active,
        cardSlug,
        state: action
      })
    });
    const result = (await response.json()) as { error?: string; states?: CollectionAction[] };

    setPendingAction(null);

    if (!response.ok) {
      if (response.status === 401) {
        setSignedIn(false);
      }

      setMessage(result.error ?? "Could not save collection state.");
      return;
    }

    setSelected(result.states ?? []);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const active = selected.includes(action.id);
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => toggleAction(action.id)}
              disabled={pendingAction !== null}
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition disabled:opacity-55 ${
                active ? "border-archive-field bg-archive-field text-white" : "border-archive-ink/14 bg-white/70 text-archive-ink"
              }`}
            >
              {pendingAction === action.id ? <Loader2 className="h-4 w-4 animate-spin" /> : action.icon}
              {action.label}
            </button>
          );
        })}
      </div>
      {!signedIn ? (
        <p className="text-sm font-semibold text-archive-ink/64">
          <Link href="/login" className="font-bold text-archive-oxblood hover:text-archive-ink">
            Log in
          </Link>{" "}
          to save cards to your collection.
        </p>
      ) : null}
      {message ? <p className="text-sm font-bold text-archive-oxblood">{message}</p> : null}
    </div>
  );
}
