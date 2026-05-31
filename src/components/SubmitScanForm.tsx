"use client";

import { Upload } from "lucide-react";
import { demoCards } from "@/lib/demo-data";

export function SubmitScanForm() {
  return (
    <form className="grid gap-4 rounded-lg border border-archive-ink/10 bg-white/66 p-6 shadow-card">
      <label className="grid gap-2 text-sm font-bold">
        Card
        <select className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal">
          {demoCards.map((card) => (
            <option key={card.id} value={card.id}>
              #{card.number} {card.playerName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Side
        <select className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal">
          <option value="front">Front</option>
          <option value="back">Back</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Contributor email
        <input type="email" placeholder="collector@example.com" className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal" />
      </label>
      <label className="grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-archive-oxblood/40 bg-archive-paper/70 p-6 text-center text-sm font-bold text-archive-oxblood">
        <Upload className="mb-2 h-7 w-7" />
        Upload a front or back scan
        <input type="file" accept="image/*" className="sr-only" />
      </label>
      <button type="button" className="h-11 rounded-md bg-archive-oxblood px-4 font-bold text-white">
        Submit for moderation
      </button>
    </form>
  );
}
