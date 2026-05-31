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
  ["2", "Darrin Jackson", "Chicago Cubs", "OF", false, false],
  ["3", "Roberto Alomar", "San Diego Padres", "2B", true, true],
  ["4", "Gregg Jefferies", "New York Mets", "IF", true, false],
  ["5", "Sandy Alomar Jr.", "San Diego Padres", "C", true, false],
  ["6", "Gary Sheffield", "Milwaukee Brewers", "SS", true, false],
  ["7", "Jim Abbott", "California Angels", "P", true, false],
  ["8", "Randy Johnson", "Montreal Expos", "P", true, true],
  ["9", "Craig Biggio", "Houston Astros", "C", true, true],
  ["10", "John Smoltz", "Atlanta Braves", "P", true, true],
  ["11", "Tom Glavine", "Atlanta Braves", "P", false, true],
  ["12", "Nolan Ryan", "Texas Rangers", "P", false, true],
  ["13", "Cal Ripken Jr.", "Baltimore Orioles", "SS", false, true],
  ["14", "Tony Gwynn", "San Diego Padres", "OF", false, true],
  ["15", "Ozzie Smith", "St. Louis Cardinals", "SS", false, true],
  ["16", "Rickey Henderson", "New York Yankees", "OF", false, true],
  ["17", "Wade Boggs", "Boston Red Sox", "3B", false, true],
  ["18", "Kirby Puckett", "Minnesota Twins", "OF", false, true],
  ["19", "Mark McGwire", "Oakland Athletics", "1B", false, false],
  ["20", "Don Mattingly", "New York Yankees", "1B", false, false],
  ["21", "Will Clark", "San Francisco Giants", "1B", false, false],
  ["22", "Bo Jackson", "Kansas City Royals", "OF", false, false],
  ["23", "Barry Larkin", "Cincinnati Reds", "SS", false, true],
  ["24", "Robin Yount", "Milwaukee Brewers", "OF", false, true],
  ["25", "Paul Molitor", "Milwaukee Brewers", "3B", false, true],
  ["26", "Andre Dawson", "Chicago Cubs", "OF", false, true],
  ["27", "Eddie Murray", "Los Angeles Dodgers", "1B", false, true],
  ["28", "George Brett", "Kansas City Royals", "3B", false, true],
  ["29", "Roger Clemens", "Boston Red Sox", "P", false, false],
  ["30", "Jose Canseco", "Oakland Athletics", "OF", false, false]
] as const;

export const demoCards: Card[] = rawCards.map(([number, playerName, team, position, isRookie, isHallOfFamer]) => {
  const teamSlug = slugify(team);
  const cardSlug = `${number}-${slugify(playerName)}`;
  const hasFront = Number(number) % 4 !== 0;
  const hasBack = Number(number) % 5 !== 0;
  const isGriffey = Number(number) === 1;
  const isDarrinJackson = Number(number) === 2;
  const isRobertoAlomar = Number(number) === 3;

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
