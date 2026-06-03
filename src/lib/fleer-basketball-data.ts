import type { Card, SetSummary } from "@/types/binder";
import { slugify } from "@/lib/utils";

export const fleer1986BasketballSet: SetSummary = {
  id: "1986-fleer-basketball",
  name: "1986-87 Fleer Basketball",
  slug: "1986-fleer-basketball",
  year: 1986,
  manufacturer: "Fleer",
  totalCards: 132,
  description:
    "A hobby landmark built around Michael Jordan's #57 rookie card and a deep class of Hall of Fame rookies from basketball's modern card revival."
};

const keyCards = [
  ["1", "Kareem Abdul-Jabbar", "Los Angeles Lakers", "C", false, true, "Veteran legend at the front of one of basketball's most important checklists."],
  ["7", "Charles Barkley", "Philadelphia 76ers", "PF", true, true, "Major rookie card from the set's loaded Hall of Fame rookie class."],
  ["9", "Larry Bird", "Boston Celtics", "SF", false, true, "Celtics superstar anchor from the heart of the 1980s NBA."],
  ["26", "Clyde Drexler", "Portland Trail Blazers", "SG", true, true, "Rookie card for one of the defining guards of the era."],
  ["27", "Joe Dumars", "Detroit Pistons", "SG", true, true, "Rookie card for the future Finals MVP and Pistons great."],
  ["31", "Julius Erving", "Philadelphia 76ers", "SF", false, true, "Late-career Doctor J card in the set that revived mainstream basketball cards."],
  ["32", "Patrick Ewing", "New York Knicks", "C", true, true, "Rookie card for the Knicks franchise center and 1985 first overall pick."],
  ["53", "Magic Johnson", "Los Angeles Lakers", "PG", false, true, "Showtime centerpiece and one of the set's essential veteran stars."],
  ["57", "Michael Jordan", "Chicago Bulls", "SG", true, true, "The iconic Michael Jordan rookie card and the centerpiece of the 1986-87 Fleer basketball set."],
  ["68", "Karl Malone", "Utah Jazz", "PF", true, true, "Rookie card for one of the NBA's all-time scoring leaders."],
  ["77", "Chris Mullin", "Golden State Warriors", "SF", true, true, "Rookie card for the smooth-shooting Warriors Hall of Famer."],
  ["82", "Hakeem Olajuwon", "Houston Rockets", "C", true, true, "Rookie card for the future two-time champion and elite two-way center."],
  ["109", "Isiah Thomas", "Detroit Pistons", "PG", true, true, "Rookie card for the Bad Boys floor general and Pistons icon."],
  ["121", "Dominique Wilkins", "Atlanta Hawks", "SF", true, true, "Rookie card for the Human Highlight Film."],
  ["131", "James Worthy", "Los Angeles Lakers", "SF", true, true, "Rookie card for Big Game James from the Showtime Lakers."],
  ["132", "Checklist", "Checklist", "CL", false, false, "The set checklist card for the 132-card base release."]
] as const;

export const fleer1986BasketballCards: Card[] = keyCards.map(([number, playerName, team, position, isRookie, isHallOfFamer, notes]) => {
  const cardSlug = `${number}-${slugify(playerName)}`;

  return {
    id: cardSlug,
    setId: fleer1986BasketballSet.id,
    number: Number(number),
    numberLabel: `#${number}`,
    setName: fleer1986BasketballSet.name,
    year: String(fleer1986BasketballSet.year),
    returnHref: `/sets/${fleer1986BasketballSet.slug}`,
    returnLabel: "Back to 1986 Fleer",
    playerName,
    team,
    teamSlug: slugify(team),
    cardSlug,
    position,
    isRookie,
    isHallOfFamer,
    notes,
    images: [
      {
        side: "front",
        status: "missing",
        imageUrl: "/placeholders/front-needed.svg"
      },
      {
        side: "back",
        status: "missing",
        imageUrl: "/placeholders/back-needed.svg"
      }
    ]
  };
});

export function getFleer1986BasketballCardBySlug(cardSlug: string) {
  return fleer1986BasketballCards.find((card) => card.cardSlug === cardSlug);
}
