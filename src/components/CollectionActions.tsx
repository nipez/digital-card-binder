"use client";

import { Check, Heart, History, Star } from "lucide-react";
import { useState } from "react";
import type { CollectionAction } from "@/types/binder";

const actions: { id: CollectionAction; label: string; icon: React.ReactNode }[] = [
  { id: "had", label: "I had this", icon: <History className="h-4 w-4" /> },
  { id: "have", label: "I have this", icon: <Check className="h-4 w-4" /> },
  { id: "want", label: "I want this", icon: <Heart className="h-4 w-4" /> },
  { id: "favorite", label: "Favorite", icon: <Star className="h-4 w-4" /> }
];

export function CollectionActions() {
  const [selected, setSelected] = useState<CollectionAction[]>([]);

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const active = selected.includes(action.id);
        return (
          <button
            key={action.id}
            type="button"
            onClick={() =>
              setSelected((current) =>
                current.includes(action.id) ? current.filter((item) => item !== action.id) : [...current, action.id]
              )
            }
            className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition ${
              active ? "border-archive-field bg-archive-field text-white" : "border-archive-ink/14 bg-white/70 text-archive-ink"
            }`}
          >
            {action.icon}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
