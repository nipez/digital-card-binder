import { slugify } from "@/lib/utils";
import type { Card } from "@/types/binder";
import type { PlayerProfile } from "@/types/player";

const knownProfiles: Record<string, PlayerProfile> = {
  "ken-griffey-jr": {
    slug: "ken-griffey-jr",
    name: "Ken Griffey Jr.",
    displayName: "Ken Griffey Jr.",
    dek: "A generational center fielder, hobby icon, and the face of Upper Deck's rookie-card era.",
    positions: ["OF", "CF"],
    batsThrows: "Left / Left",
    born: "November 21, 1969",
    birthplace: "Donora, Pennsylvania",
    teams: ["Seattle Mariners", "Cincinnati Reds", "Chicago White Sox"],
    careerYears: "1989-2010",
    heroStat: "630 career home runs",
    bio: [
      "Ken Griffey Jr. became one of baseball's defining stars by pairing a graceful center-field game with one of the most recognizable swings in modern sports. His arrival with Seattle in 1989 also arrived at exactly the right moment for the card hobby: glossy photography, premium packaging, and a rookie card that felt instantly different.",
      "For Binder Archive, Griffey is the perfect first player profile. One card can tell the story of a set, but a player page can connect that card to the larger collecting trail across years, brands, inserts, parallels, and moments."
    ],
    trivia: [
      "He was elected to the National Baseball Hall of Fame in 2016.",
      "His 1989 Upper Deck rookie card is card #1 in the set.",
      "He finished his major league career with 630 home runs.",
      "He and Ken Griffey Sr. famously appeared in the same Mariners lineup."
    ],
    timeline: [
      { year: "1987", label: "Drafted", detail: "Selected first overall by the Seattle Mariners." },
      { year: "1989", label: "Rookie season", detail: "Debuted in the majors and anchored the 1989 Upper Deck checklist." },
      { year: "1997", label: "MVP", detail: "Won the American League Most Valuable Player Award." },
      { year: "2016", label: "Hall of Fame", detail: "Inducted into Cooperstown." }
    ],
    collectingNotes: [
      "Start with the 1989 Upper Deck #1 rookie, then branch into flagship Topps, Donruss, Fleer, Score, and later Upper Deck issues.",
      "A future archive view should separate base cards, inserts, parallels, autographs, graded copies, and personal collection status.",
      "The player page can become the collector's map: by year, set, brand, team, scan status, and ownership."
    ]
  }
};

export function getPlayerSlug(playerName: string) {
  return slugify(playerName);
}

export function getPlayerCards(cards: Card[], playerSlug: string) {
  return cards.filter((card) => getPlayerSlug(card.playerName) === playerSlug);
}

export function getPlayerProfile(cards: Card[], playerSlug: string): PlayerProfile | null {
  const profile = knownProfiles[playerSlug];

  if (profile) {
    return profile;
  }

  const playerCards = getPlayerCards(cards, playerSlug);
  const firstCard = playerCards[0];

  if (!firstCard) {
    return null;
  }

  const teams = Array.from(new Set(playerCards.map((card) => card.team)));
  const positions = Array.from(new Set(playerCards.map((card) => card.position).filter(Boolean)));

  return {
    slug: playerSlug,
    name: firstCard.playerName,
    displayName: firstCard.playerName,
    dek: `A growing archive page for ${firstCard.playerName}, ready to connect every card, scan, and collection note over time.`,
    positions,
    teams,
    bio: [
      `${firstCard.playerName}'s Binder Archive profile is ready for a richer biography, career context, and collector notes. For now, this page gathers every card currently connected to the player in the archive.`
    ],
    trivia: ["This is a starter profile. Add verified career facts, memorable moments, and card-hobby notes as the archive grows."],
    timeline: [{ year: "Archive", label: "Profile started", detail: "The first linked card has been added to Binder Archive." }],
    collectingNotes: [
      "Future versions can group this player's cards by year, brand, team, scan completion, and ownership status.",
      "Use this page as the permanent URL for every card connected to this player."
    ]
  };
}
