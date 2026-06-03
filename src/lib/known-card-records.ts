import { fleer1986BasketballSet, getFleer1986BasketballCardBySlug } from "@/lib/fleer-basketball-data";
import { demoCards, getCardBySlug, upperDeck1989Set } from "@/lib/demo-data";
import { getKnownPlayerCardBySlug } from "@/lib/player-profiles";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { slugify } from "@/lib/utils";
import type { Card, SetSummary } from "@/types/binder";

type AdminSupabaseClient = NonNullable<ReturnType<typeof createAdminSupabaseClient>>;
type CardRecord = { id: string; slug: string };

export function getKnownCardBySlug(cardSlug: string) {
  return getKnownPlayerCardBySlug(cardSlug) ?? getFleer1986BasketballCardBySlug(cardSlug) ?? getCardBySlug(cardSlug);
}

export async function findOrCreateKnownCard(supabase: AdminSupabaseClient, cardSlug: string) {
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, slug")
    .eq("slug", cardSlug)
    .single<CardRecord>();

  if (!cardError && card) {
    return { card };
  }

  const prototypeCard = getKnownCardBySlug(cardSlug);

  if (!prototypeCard) {
    return { error: "Card not found in Supabase." };
  }

  return createKnownCard(supabase, prototypeCard);
}

async function createKnownCard(supabase: AdminSupabaseClient, card: Card) {
  const set = getSetForCard(card);

  if (!set) {
    return { error: "Card set metadata is missing." };
  }

  const { data: setRow, error: setError } = await supabase
    .from("sets")
    .upsert(
      {
        slug: set.slug,
        name: set.name,
        year: set.year,
        manufacturer: set.manufacturer,
        total_cards: set.totalCards,
        description: set.description
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single<{ id: string }>();

  if (setError || !setRow) {
    return { error: setError?.message ?? "Could not create card set." };
  }

  const { data: createdCard, error: createCardError } = await supabase
    .from("cards")
    .upsert(
      {
        set_id: setRow.id,
        card_number: card.number,
        slug: card.cardSlug,
        player_name: card.playerName,
        team: card.team,
        team_slug: card.teamSlug,
        position: card.position,
        is_rookie: card.isRookie,
        is_hall_of_famer: card.isHallOfFamer,
        notes: card.notes
      },
      { onConflict: "slug" }
    )
    .select("id, slug")
    .single<CardRecord>();

  if (createCardError || !createdCard) {
    return { error: createCardError?.message ?? "Could not create card." };
  }

  const { error: missingImagesError } = await supabase.from("card_images").upsert(
    [
      { card_id: createdCard.id, side: "front", image_url: null, status: "missing" },
      { card_id: createdCard.id, side: "back", image_url: null, status: "missing" }
    ],
    { onConflict: "card_id,side" }
  );

  if (missingImagesError) {
    return { error: missingImagesError.message };
  }

  return { card: createdCard };
}

function getSetForCard(card: Card): SetSummary | null {
  if (card.setId === fleer1986BasketballSet.id) {
    return fleer1986BasketballSet;
  }

  if (card.setId === upperDeck1989Set.id || demoCards.some((demoCard) => demoCard.cardSlug === card.cardSlug)) {
    return upperDeck1989Set;
  }

  if (!card.setName || !card.year) {
    return null;
  }

  return {
    id: slugify(`${card.year}-${card.setName}`),
    slug: slugify(`${card.year}-${card.setName}`),
    name: card.setName,
    year: Number(card.year),
    manufacturer: getManufacturerName(card.setName),
    totalCards: 1,
    description: `Prototype archive set record for ${card.playerName}.`
  };
}

function getManufacturerName(setName: string) {
  if (setName.includes("Upper Deck")) {
    return "Upper Deck";
  }

  if (setName.includes("Bowman")) {
    return "Bowman";
  }

  return setName.split(" ")[0] ?? setName;
}
