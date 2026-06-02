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
    ],
    knownCards: {
      totalLabel: "7,108 TCDB-listed cards",
      sourceName: "Trading Card Database",
      sourceUrl: "https://www.tcdb.com/Person.cfm/pid/1494/Ken-Griffey-Jr.",
      note:
        "The full Griffey checklist is too large for a hand-built prototype. This section starts with a curated key-card list and gives us the structure for importing the full player checklist later.",
      keyCards: [
        {
          year: "1989",
          setName: "Upper Deck Baseball",
          cardNumber: "#1",
          team: "Seattle Mariners",
          category: "Rookie card",
          note: "The signature card of Upper Deck's debut baseball release and the anchor card for this archive."
        },
        {
          year: "1989",
          setName: "Bowman Baseball",
          cardNumber: "#220",
          team: "Seattle Mariners",
          category: "Rookie card",
          note: "Oversized Bowman rookie-era card with classic late-1980s checklist appeal."
        },
        {
          year: "1989",
          setName: "Donruss Baseball",
          cardNumber: "#33",
          team: "Seattle Mariners",
          category: "Rookie card",
          note: "One of the core mainstream Griffey rookie cards collectors usually group together."
        },
        {
          year: "1989",
          setName: "Fleer Baseball",
          cardNumber: "#548",
          team: "Seattle Mariners",
          category: "Rookie card",
          note: "Another essential mass-market rookie from Griffey's first hobby year."
        },
        {
          year: "1989",
          setName: "Score Traded Baseball",
          cardNumber: "#100T",
          team: "Seattle Mariners",
          category: "Rookie card",
          note: "A key traded-set rookie that often sits beside Upper Deck in starter Griffey runs."
        },
        {
          year: "1989",
          setName: "Topps Traded Baseball",
          cardNumber: "#41T",
          team: "Seattle Mariners",
          category: "Rookie card",
          note: "Topps' traded-set Griffey rookie and a foundational card for brand-by-brand collecting."
        },
        {
          year: "1990",
          setName: "Topps Baseball",
          cardNumber: "#336",
          team: "Seattle Mariners",
          category: "Second-year",
          note: "A nostalgic early-career flagship card from the junk-wax peak."
        },
        {
          year: "1990",
          setName: "Upper Deck Baseball",
          cardNumber: "#156",
          team: "Seattle Mariners",
          category: "Second-year",
          note: "An early Upper Deck follow-up that pairs naturally with the 1989 rookie."
        },
        {
          year: "1993",
          setName: "SP Baseball",
          cardNumber: "#4",
          team: "Seattle Mariners",
          category: "Premium era",
          note: "Part of Upper Deck's premium SP line as the hobby moved into foil, gloss, and chase design."
        },
        {
          year: "1994",
          setName: "Upper Deck Baseball",
          cardNumber: "#53",
          team: "Seattle Mariners",
          category: "Iconic photo",
          note: "Known for the fence-climb image, a great example of why image-led browsing matters."
        },
        {
          year: "1997",
          setName: "Bowman's Best Atomic Refractor",
          cardNumber: "varies",
          team: "Seattle Mariners",
          category: "Parallel",
          note: "A useful future category example for premium parallels and refractor-style variants."
        },
        {
          year: "1998",
          setName: "Donruss Crusade",
          cardNumber: "varies",
          team: "Seattle Mariners",
          category: "Insert",
          note: "A legendary late-1990s insert family and a natural showcase target for player pages."
        }
      ]
    }
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
