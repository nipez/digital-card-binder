import type { Card, ScanSubmission, SetSummary } from "@/types/binder";
import { slugify } from "@/lib/utils";

export const upperDeck1989Set: SetSummary = {
  id: "1989-upper-deck-baseball",
  name: "1989 Upper Deck Baseball",
  slug: "1989-upper-deck-baseball",
  year: 1989,
  manufacturer: "Upper Deck",
  totalCards: 800,
  description:
    "A premium late-eighties baseball landmark with crisp photography, hologram flair, and a rookie card that changed the hobby."
};

const rawCards = [
  ["1", "Ken Griffey Jr.", "Seattle Mariners", "OF", true, true],
  ["2", "Luis Medina", "Cleveland Indians", "OF", true, false],
  ["3", "Tony Chance", "Pittsburgh Pirates", "OF", true, false],
  ["4", "David Otto", "Oakland Athletics", "P", true, false],
  ["5", "Sandy Alomar Jr.", "San Diego Padres", "C", true, false],
  ["6", "Rolando Roomes", "Cincinnati Reds", "OF", true, false],
  ["7", "David West", "New York Mets", "P", true, false],
  ["8", "Cris Carpenter", "St. Louis Cardinals", "P", true, false],
  ["9", "Gregg Jefferies", "New York Mets", "IF", true, false],
  ["10", "Doug Dascenzo", "Chicago Cubs", "OF", true, false],
  ["11", "Ron Jones", "Philadelphia Phillies", "OF", true, false],
  ["12", "Luis de los Santos", "Kansas City Royals", "IF", true, false],
  ["13", "Gary Sheffield", "Milwaukee Brewers", "SS", true, false],
  ["14", "Mike Harkey", "Chicago Cubs", "P", true, false],
  ["15", "Lance Blankenship", "Oakland Athletics", "IF", true, false],
  ["16", "William Brennan", "Los Angeles Dodgers", "P", true, false],
  ["17", "John Smoltz", "Atlanta Braves", "P", true, true],
  ["18", "Ramon Martinez", "Los Angeles Dodgers", "P", true, false],
  ["19", "Mark Lemke", "Atlanta Braves", "2B", true, false],
  ["20", "Juan Bell", "Baltimore Orioles", "SS", true, false],
  ["21", "Rey Palacios", "Kansas City Royals", "C", true, false],
  ["22", "Felix Jose", "Oakland Athletics", "OF", true, false],
  ["23", "Van Snider", "Cincinnati Reds", "OF", true, false],
  ["24", "Dante Bichette", "California Angels", "OF", true, false],
  ["25", "Randy Johnson", "Montreal Expos", "P", true, true],
  ["26", "Carlos Quintana", "Boston Red Sox", "1B", true, false],
  ["27", "Star Rookies Checklist", "Checklist", "CL", false, false],
  ["214", "Darrin Jackson", "Chicago Cubs", "OF", false, false],
  ["273", "Craig Biggio", "Houston Astros", "C", true, true],
  ["471", "Roberto Alomar", "San Diego Padres", "2B", true, true]
] as const;

export const demoCards: Card[] = rawCards.map(([number, playerName, team, position, isRookie, isHallOfFamer]) => {
  const teamSlug = slugify(team);
  const cardSlug = `${number}-${slugify(playerName)}`;
  const hasFront = Number(number) % 4 !== 0;
  const hasBack = Number(number) % 5 !== 0;
  const isGriffey = Number(number) === 1;
  const isDarrinJackson = playerName === "Darrin Jackson";
  const isRobertoAlomar = playerName === "Roberto Alomar";

  return {
    id: cardSlug,
    setId: upperDeck1989Set.id,
    number: Number(number),
    playerName,
    team,
    teamSlug,
    cardSlug,
    position,
    isRookie,
    isHallOfFamer,
    notes:
      Number(number) === 1
        ? "Demo entry for the iconic rookie card slot. Bring your own approved scans."
        : "Demo checklist data for MVP browsing and filtering.",
    images: [
      {
        side: "front",
        status: hasFront || isGriffey || isDarrinJackson || isRobertoAlomar ? "approved" : "missing",
        imageUrl: isGriffey
          ? "/scans/1989-upper-deck-baseball/1-ken-griffey-jr-front.webp"
          : isDarrinJackson
            ? "/scans/1989-upper-deck-baseball/2-darrin-jackson-front.webp"
            : isRobertoAlomar
              ? "/scans/1989-upper-deck-baseball/3-roberto-alomar-front.webp"
          : hasFront
            ? `/placeholders/demo-front.svg?card=${number}`
            : "/placeholders/front-needed.svg"
      },
      {
        side: "back",
        status: hasBack || isGriffey || isDarrinJackson || isRobertoAlomar ? "approved" : "missing",
        imageUrl: isGriffey
          ? "/scans/1989-upper-deck-baseball/1-ken-griffey-jr-back.webp"
          : isDarrinJackson
            ? "/scans/1989-upper-deck-baseball/2-darrin-jackson-back.webp"
            : isRobertoAlomar
              ? "/scans/1989-upper-deck-baseball/3-roberto-alomar-back.webp"
          : hasBack
            ? `/placeholders/demo-back.svg?card=${number}`
            : "/placeholders/back-needed.svg"
      }
    ]
  };
});

export const demoSubmissions: ScanSubmission[] = [
  {
    id: "sub-001",
    cardName: "Ken Griffey Jr. #1",
    side: "front",
    contributor: "local.demo@example.com",
    status: "pending",
    submittedAt: "2026-05-29T16:20:00.000Z",
    imageUrl: "/placeholders/demo-front.svg?card=1"
  },
  {
    id: "sub-002",
    cardName: "Craig Biggio #9",
    side: "back",
    contributor: "collector@example.com",
    status: "pending",
    submittedAt: "2026-05-28T13:10:00.000Z",
    imageUrl: "/placeholders/demo-back.svg?card=9"
  }
];

export function getCardBySlug(cardSlug: string) {
  return demoCards.find((card) => card.cardSlug === cardSlug);
}

export function getTeamCards(teamSlug: string) {
  return demoCards.filter((card) => card.teamSlug === teamSlug);
}

export function getTeams() {
  return Array.from(new Map(demoCards.map((card) => [card.teamSlug, card.team])).entries()).map(([slug, name]) => ({
    slug,
    name,
    count: demoCards.filter((card) => card.teamSlug === slug).length
  }));
}

export function hasMissingScan(card: Card) {
  return card.images.some((image) => image.status === "missing");
}
