import { NextResponse } from "next/server";
import { createAdminSupabaseClient, getAdminSupabaseConfigStatus } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const allowedSides = new Set(["front", "back"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
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

  const formData = await request.formData();
  const cardSlug = String(formData.get("cardSlug") ?? "").trim();
  const side = String(formData.get("side") ?? "").trim();
  const contributorEmail = String(formData.get("contributorEmail") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const file = formData.get("file");

  if (!cardSlug) {
    return NextResponse.json({ error: "Choose a valid card." }, { status: 400 });
  }

  if (!allowedSides.has(side)) {
    return NextResponse.json({ error: "Choose front or back." }, { status: 400 });
  }

  if (!isValidEmail(contributorEmail)) {
    return NextResponse.json({ error: "Enter a valid contributor email." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image file to submit." }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "Image files must be 10 MB or smaller." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Upload JPG, PNG, or WebP images only." }, { status: 400 });
  }

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, slug")
    .eq("slug", cardSlug)
    .single<{ id: string; slug: string }>();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found in Supabase." }, { status: 404 });
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const storagePath = `submissions/${card.slug}/${side}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("card-scans").upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from("card-scans").getPublicUrl(storagePath);
  const imageUrl = publicUrlData.publicUrl;
  const { data: submission, error: submissionError } = await supabase
    .from("scan_submissions")
    .insert({
      card_id: card.id,
      side,
      contributor_email: contributorEmail,
      storage_path: storagePath,
      image_url: imageUrl,
      status: "pending",
      notes: notes || null
    })
    .select("id, status")
    .single<{ id: string; status: "pending" }>();

  if (submissionError || !submission) {
    await supabase.storage.from("card-scans").remove([storagePath]);
    return NextResponse.json({ error: submissionError?.message ?? "Could not create scan submission." }, { status: 500 });
  }

  return NextResponse.json({
    submission: {
      id: submission.id,
      cardSlug: card.slug,
      side,
      status: submission.status,
      imageUrl
    }
  });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
