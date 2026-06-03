import { NextResponse } from "next/server";
import { findOrCreateKnownCard } from "@/lib/known-card-records";
import { createAdminSupabaseClient, getAdminSupabaseConfigStatus } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/supabase-auth-server";
import type { CollectionAction } from "@/types/binder";

const allowedStates = new Set<CollectionAction>(["have", "want", "favorite"]);

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ states: [], signedIn: false });
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return missingConfigResponse();
  }

  const cardSlug = new URL(request.url).searchParams.get("cardSlug") ?? "";
  const cardResult = await findOrCreateKnownCard(supabase, cardSlug);

  if ("error" in cardResult) {
    return NextResponse.json({ error: cardResult.error }, { status: 404 });
  }

  await ensureProfile(supabase, user.id, user.email);

  const { data, error } = await supabase
    .from("user_collections")
    .select("state")
    .eq("user_id", user.id)
    .eq("card_id", cardResult.card.id)
    .returns<{ state: CollectionAction }[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ states: (data ?? []).map((row) => row.state), signedIn: true });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to save cards to your collection." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return missingConfigResponse();
  }

  const body = (await request.json()) as { active?: boolean; cardSlug?: string; state?: CollectionAction };
  const cardSlug = body.cardSlug ?? "";
  const state = body.state;

  if (!state || !allowedStates.has(state)) {
    return NextResponse.json({ error: "Choose a valid collection action." }, { status: 400 });
  }

  const cardResult = await findOrCreateKnownCard(supabase, cardSlug);

  if ("error" in cardResult) {
    return NextResponse.json({ error: cardResult.error }, { status: 404 });
  }

  const profileError = await ensureProfile(supabase, user.id, user.email);

  if (profileError) {
    return NextResponse.json({ error: profileError }, { status: 500 });
  }

  if (body.active) {
    const { error } = await supabase.from("user_collections").upsert(
      {
        user_id: user.id,
        card_id: cardResult.card.id,
        state
      },
      { onConflict: "user_id,card_id,state" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("user_collections")
      .delete()
      .eq("user_id", user.id)
      .eq("card_id", cardResult.card.id)
      .eq("state", state);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data } = await supabase
    .from("user_collections")
    .select("state")
    .eq("user_id", user.id)
    .eq("card_id", cardResult.card.id)
    .returns<{ state: CollectionAction }[]>();

  return NextResponse.json({ states: (data ?? []).map((row) => row.state) });
}

async function ensureProfile(supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>, userId: string, email?: string | null) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: email?.split("@")[0] ?? null
    },
    { onConflict: "id" }
  );

  return error?.message ?? null;
}

function missingConfigResponse() {
  const config = getAdminSupabaseConfigStatus();

  return NextResponse.json(
    {
      error: `Supabase admin client is not configured. Missing ${[
        config.hasUrl ? null : "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL",
        config.hasAdminKey ? null : "SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_SERVICE_KEY, or SERVICE_ROLE_KEY"
      ]
        .filter(Boolean)
        .join(" and ")}.`
    },
    { status: 500 }
  );
}
