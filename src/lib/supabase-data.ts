import { demoCards, getCardBySlug, getTeamCards, getTeams, upperDeck1989Set } from "@/lib/demo-data";
import { fleer1986BasketballCards, fleer1986BasketballSet } from "@/lib/fleer-basketball-data";
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

const fleer1986BasketballSlugs = new Set([
  fleer1986BasketballSet.slug,
  "1986-1986-87-fleer-basketball",
  "1986-87-fleer-basketball"
]);

export async function getUpperDeckSetData(): Promise<{ set: SetSummary; cards: Card[]; source: "supabase" | "demo" }> {
  return getSupabaseSetData(upperDeck1989Set.slug, upperDeck1989Set, demoCards);
}

export async function getFleerBasketballSetData(): Promise<{ set: SetSummary; cards: Card[]; source: "supabase" | "demo" }> {
  const result = await getSupabaseSetData(
    [fleer1986BasketballSet.slug, "1986-1986-87-fleer-basketball", "1986-87-fleer-basketball"],
    fleer1986BasketballSet,
    fleer1986BasketballCards
  );

  if (result.source === "demo") {
    return result;
  }

  const cardsBySlug = new Map(result.cards.map((card) => [card.cardSlug, card]));

  return {
    ...result,
    cards: fleer1986BasketballCards.map((demoCard) => {
      const uploadedCard = cardsBySlug.get(demoCard.cardSlug);

      return uploadedCard
        ? {
            ...demoCard,
            id: uploadedCard.id,
            images: uploadedCard.images
          }
        : demoCard;
    })
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

  return withSetMetadata(card, setRow ?? undefined);
}

export async function getSupabaseCardsByPlayerSlug(playerSlug: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return demoCards.filter((card) => slugify(card.playerName) === playerSlug);
  }

  const { data: cardRows, error: cardsError } = await supabase
    .from("cards")
    .select(
      "id, set_id, card_number, slug, player_name, team, team_slug, position, is_rookie, is_hall_of_famer, notes, card_images(side, image_url, status)"
    )
    .order("card_number", { ascending: true })
    .returns<CardRow[]>();

  if (cardsError || !cardRows) {
    return demoCards.filter((card) => slugify(card.playerName) === playerSlug);
  }

  const playerRows = cardRows.filter((card) => slugify(card.player_name) === playerSlug);
  const setIds = Array.from(new Set(playerRows.map((card) => card.set_id)));

  if (setIds.length === 0) {
    return [];
  }

  const { data: setRows } = await supabase
    .from("sets")
    .select("id, slug, name, year, manufacturer, total_cards, description")
    .in("id", setIds)
    .returns<SetRow[]>();
  const setsById = new Map((setRows ?? []).map((set) => [set.id, set]));

  return playerRows.map((row) => withSetMetadata(mapCard(row), setsById.get(row.set_id)));
}

export function buildTeams(cards: Card[]) {
  return Array.from(new Map(cards.map((card) => [card.teamSlug, card.team])).entries()).map(([slug, name]) => ({
    slug,
    name,
    count: cards.filter((card) => card.teamSlug === slug).length
  }));
}

async function getSupabaseSetData(
  setSlug: string | string[],
  fallbackSet: SetSummary,
  fallbackCards: Card[]
): Promise<{ set: SetSummary; cards: Card[]; source: "supabase" | "demo" }> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { set: fallbackSet, cards: fallbackCards, source: "demo" };
  }

  const setSlugs = Array.isArray(setSlug) ? setSlug : [setSlug];
  const { data: setRows, error: setError } = await supabase
    .from("sets")
    .select("id, slug, name, year, manufacturer, total_cards, description")
    .in("slug", setSlugs)
    .returns<SetRow[]>();

  if (setError || !setRows?.length) {
    return { set: fallbackSet, cards: fallbackCards, source: "demo" };
  }

  const setRowsBySlug = new Map(setRows.map((row) => [row.slug, row]));
  const setRow = setSlugs.map((slug) => setRowsBySlug.get(slug)).find(Boolean) ?? setRows[0];
  const setIds = setRows.map((row) => row.id);
  const { data: cardRows, error: cardsError } = await supabase
    .from("cards")
    .select(
      "id, set_id, card_number, slug, player_name, team, team_slug, position, is_rookie, is_hall_of_famer, notes, card_images(side, image_url, status)"
    )
    .in("set_id", setIds)
    .order("card_number", { ascending: true })
    .returns<CardRow[]>();

  if (cardsError || !cardRows) {
    return { set: fallbackSet, cards: fallbackCards, source: "demo" };
  }

  return {
    set: mapSet(setRow),
    cards: cardRows.map(mapCard),
    source: "supabase"
  };
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

function withSetMetadata(card: Card, setRow?: SetRow): Card {
  if (!setRow || setRow.slug === upperDeck1989Set.slug) {
    return {
      ...card,
      setName: upperDeck1989Set.name,
      year: String(upperDeck1989Set.year),
      numberLabel: `#${card.number}`
    };
  }

  const isFleer1986Basketball = fleer1986BasketballSlugs.has(setRow.slug);

  return {
    ...card,
    setName: setRow.name,
    year: String(setRow.year),
    numberLabel: `#${card.number}`,
    returnHref: isFleer1986Basketball ? `/sets/${fleer1986BasketballSet.slug}` : `/sets/${setRow.slug}`,
    returnLabel: isFleer1986Basketball ? "Back to 1986 Fleer" : `Back to ${setRow.name}`
  };
}
