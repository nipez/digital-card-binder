import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient, getAdminSupabaseConfigStatus } from "@/lib/supabase-admin";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

type ScanSubmissionRow = {
  id: string;
  card_id: string;
  side: "front" | "back";
  contributor_email: string | null;
  storage_path: string;
  image_url: string;
  status: "pending" | "approved" | "rejected" | "missing";
  notes: string | null;
  created_at: string;
};

type CardRow = {
  id: string;
  slug: string;
  card_number: number;
  player_name: string;
  team: string;
};

export async function GET(request: Request) {
  const setup = getAdminRequestSetup(request);

  if (setup.response) {
    return setup.response;
  }

  const { supabase } = setup;
  const { data: submissions, error: submissionsError } = await supabase
    .from("scan_submissions")
    .select("id, card_id, side, contributor_email, storage_path, image_url, status, notes, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<ScanSubmissionRow[]>();

  if (submissionsError || !submissions) {
    return NextResponse.json({ error: submissionsError?.message ?? "Could not load submissions." }, { status: 500 });
  }

  const cardIds = Array.from(new Set(submissions.map((submission) => submission.card_id)));
  const { data: cards, error: cardsError } = cardIds.length
    ? await supabase.from("cards").select("id, slug, card_number, player_name, team").in("id", cardIds).returns<CardRow[]>()
    : { data: [] as CardRow[], error: null };

  if (cardsError || !cards) {
    return NextResponse.json({ error: cardsError?.message ?? "Could not load cards." }, { status: 500 });
  }

  const cardsById = new Map(cards.map((card) => [card.id, card]));

  return NextResponse.json({
    submissions: submissions.map((submission) => {
      const card = cardsById.get(submission.card_id);

      return {
        id: submission.id,
        cardSlug: card?.slug ?? "",
        cardName: card ? `#${card.card_number} ${card.player_name}` : "Unknown card",
        cardNumber: card?.card_number ?? 0,
        team: card?.team ?? "Unknown team",
        side: submission.side,
        contributor: submission.contributor_email ?? "Unknown contributor",
        status: "pending",
        submittedAt: submission.created_at,
        imageUrl: submission.image_url,
        notes: submission.notes
      };
    })
  });
}

export async function PATCH(request: Request) {
  const setup = getAdminRequestSetup(request);

  if (setup.response) {
    return setup.response;
  }

  const { supabase } = setup;
  const body = (await request.json()) as { submissionId?: string; action?: string };
  const submissionId = body.submissionId?.trim() ?? "";
  const action = body.action === "approve" || body.action === "reject" ? body.action : "";

  if (!submissionId || !action) {
    return NextResponse.json({ error: "Choose a valid moderation action." }, { status: 400 });
  }

  const { data: submission, error: submissionError } = await supabase
    .from("scan_submissions")
    .select("id, card_id, side, storage_path, image_url, status")
    .eq("id", submissionId)
    .single<Pick<ScanSubmissionRow, "id" | "card_id" | "side" | "storage_path" | "image_url" | "status">>();

  if (submissionError || !submission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json({ error: "Submission has already been moderated." }, { status: 409 });
  }

  const nextStatus = action === "approve" ? "approved" : "rejected";
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, slug, player_name")
    .eq("id", submission.card_id)
    .single<Pick<CardRow, "id" | "slug" | "player_name">>();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  if (action === "approve") {
    const { error: imageError } = await supabase.from("card_images").upsert(
      {
        card_id: submission.card_id,
        side: submission.side,
        image_url: submission.image_url,
        storage_path: submission.storage_path,
        status: "approved",
        approved_at: new Date().toISOString()
      },
      { onConflict: "card_id,side" }
    );

    if (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await supabase.from("scan_submissions").update({ status: nextStatus }).eq("id", submission.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: eventError } = await supabase.from("moderation_events").insert({
    scan_submission_id: submission.id,
    decision: nextStatus
  });

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  revalidatePath("/sets/1989-upper-deck-baseball");
  revalidatePath(`/cards/${card.slug}`);
  revalidatePath(`/players/${slugify(card.player_name)}`);

  return NextResponse.json({
    submission: {
      id: submission.id,
      status: nextStatus
    }
  });
}

function getAdminRequestSetup(request: Request) {
  const token = request.headers.get("x-admin-upload-token") ?? "";
  const expectedToken = process.env.ADMIN_UPLOAD_TOKEN;

  if (!expectedToken) {
    return {
      response: NextResponse.json({ error: "ADMIN_UPLOAD_TOKEN is not configured." }, { status: 500 }),
      supabase: null as never
    };
  }

  if (token !== expectedToken) {
    return {
      response: NextResponse.json({ error: "Invalid admin upload token." }, { status: 401 }),
      supabase: null as never
    };
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    const config = getAdminSupabaseConfigStatus();

    return {
      response: NextResponse.json(
        {
          error: `Supabase admin client is not configured. Missing ${[
            config.hasUrl ? null : "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL",
            config.hasAdminKey ? null : "SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_SERVICE_KEY, or SERVICE_ROLE_KEY"
          ]
            .filter(Boolean)
            .join(" and ")}.`
        },
        { status: 500 }
      ),
      supabase: null as never
    };
  }

  return { response: null, supabase };
}
