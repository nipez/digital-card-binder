import { demoCards, getCardBySlug, getTeamCards, getTeams, upperDeck1989Set } from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/utils";
import type { Card, CardImage, SetSummary } from "@/types/binder";

type CardRow = {
  id: string;
  set_id: string;
  card_number: number;
  slug: string;
  player_name: string;
  team: string;
  team_slug: string;
  position: string | null;
  is_rookie: boolean;
  is_hall_of_famer: boolean;
  notes: string | null;
  card_images: {
    side: "front" | "back";
    image_url: string | null;
    status: "approved" | "missing" | "pending" | "rejected";
  }[];
};

type SetRow = {
  id: string;
  slug: string;
  name: string;
  year: number;
  manufacturer: string;
  total_cards: number;
  description: string | null;
};

export async function getUpperDeckSetData(): Promise<{ set: SetSummary; cards: Card[]; source: "supabase" | "demo" }> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { set: upperDeck1989Set, cards: demoCards, source: "demo" };
  }

  const { data: setRow, error: setError } = await supabase
    .from("sets")
    .select("id, slug, name, year, manufacturer, total_cards, description")
    .eq("slug", "1989-upper-deck-baseball")
    .single<SetRow>();

  if (setError || !setRow) {
    return { set: upperDeck1989Set, cards: demoCards, source: "demo" };
  }

  const { data: cardRows, error: cardsError } = await supabase
    .from("cards")
    .select(
      "id, set_id, card_number, slug, player_name, team, team_slug, position, is_rookie, is_hall_of_famer, notes, card_images(side, image_url, status)"
    )
    .eq("set_id", setRow.id)
    .order("card_number", { ascending: true })
    .returns<CardRow[]>();

  if (cardsError || !cardRows) {
    return { set: upperDeck1989Set, cards: demoCards, source: "demo" };
  }

  return {
    set: mapSet(setRow),
    cards: cardRows.map(mapCard),
    source: "supabase"
  };
}

export async function getSupabaseTeams() {
  const { cards, source } = await getUpperDeckSetData();

  if (source === "demo") {
    return getTeams();
  }

  return buildTeams(cards);
}

export async function getSupabaseTeamCards(teamSlug: string) {
  const { cards, source } = await getUpperDeckSetData();

  if (source === "demo") {
    return getTeamCards(teamSlug);
  }

  return cards.filter((card) => card.teamSlug === teamSlug);
}

export async function getSupabaseCardBySlug(cardSlug: string) {
  const { cards, source } = await getUpperDeckSetData();

  if (source === "demo") {
    return getCardBySlug(cardSlug);
  }

  return cards.find((card) => card.cardSlug === cardSlug);
}

export async function getSupabaseAnyCardBySlug(cardSlug: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return getCardBySlug(cardSlug);
  }

  const { data: cardRow, error: cardError } = await supabase
    .from("cards")
    .select(
      "id, set_id, card_number, slug, player_name, team, team_slug, position, is_rookie, is_hall_of_famer, notes, card_images(side, image_url, status)"
    )
    .eq("slug", cardSlug)
    .single<CardRow>();

  if (cardError || !cardRow) {
    return null;
  }

  const { data: setRow } = await supabase
    .from("sets")
    .select("id, slug, name, year, manufacturer, total_cards, description")
    .eq("id", cardRow.set_id)
    .single<SetRow>();

  const card = mapCard(cardRow);

  if (!setRow || setRow.slug === upperDeck1989Set.slug) {
    return card;
  }

  return {
    ...card,
    setName: setRow.name,
    year: String(setRow.year),
    numberLabel: `#${card.number}`,
    returnHref: `/players/${slugify(card.playerName)}`,
    returnLabel: `Back to ${card.playerName}`
  };
}

export function buildTeams(cards: Card[]) {
  return Array.from(new Map(cards.map((card) => [card.teamSlug, card.team])).entries()).map(([slug, name]) => ({
    slug,
    name,
    count: cards.filter((card) => card.teamSlug === slug).length
  }));
}

function mapSet(row: SetRow): SetSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    year: row.year,
    manufacturer: row.manufacturer,
    totalCards: row.total_cards,
    description: row.description ?? ""
  };
}

function mapCard(row: CardRow): Card {
  const images = row.card_images.map<CardImage>((image) => ({
    side: image.side,
    imageUrl: image.image_url,
    status: image.status === "rejected" ? "pending" : image.status
  }));

  return {
    id: row.id,
    setId: row.set_id,
    number: row.card_number,
    playerName: row.player_name,
    team: row.team,
    teamSlug: row.team_slug,
    cardSlug: row.slug,
    position: row.position ?? "",
    isRookie: row.is_rookie,
    isHallOfFamer: row.is_hall_of_famer,
    notes: row.notes ?? undefined,
    images
  };
}
