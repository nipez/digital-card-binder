import { NextResponse } from "next/server";
import { fleer1986BasketballSet, getFleer1986BasketballCardBySlug } from "@/lib/fleer-basketball-data";
import { getKnownPlayerCardBySlug } from "@/lib/player-profiles";
import { createAdminSupabaseClient, getAdminSupabaseConfigStatus } from "@/lib/supabase-admin";
import { slugify } from "@/lib/utils";
import type { Card } from "@/types/binder";

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
  const submittedFiles = getSubmittedFiles(formData, side, file);

  if (!cardSlug) {
    return NextResponse.json({ error: "Choose a valid card." }, { status: 400 });
  }

  if (!isValidEmail(contributorEmail)) {
    return NextResponse.json({ error: "Enter a valid contributor email." }, { status: 400 });
  }

  if (!submittedFiles.length) {
    return NextResponse.json({ error: "Choose at least one image file to submit." }, { status: 400 });
  }

  for (const submittedFile of submittedFiles) {
    if (submittedFile.file.size > maxFileSize) {
      return NextResponse.json({ error: "Image files must be 10 MB or smaller." }, { status: 400 });
    }

    if (!allowedTypes.has(submittedFile.file.type)) {
      return NextResponse.json({ error: "Upload JPG, PNG, or WebP images only." }, { status: 400 });
    }
  }

  const prototypeCard = getKnownPlayerCardBySlug(cardSlug) ?? getFleer1986BasketballCardBySlug(cardSlug);
  let { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, slug")
    .eq("slug", cardSlug)
    .single<{ id: string; slug: string }>();

  if (cardError || !card) {
    if (!prototypeCard?.setName || !prototypeCard.year) {
      return NextResponse.json({ error: "Card not found in Supabase." }, { status: 404 });
    }

    const createdCard = await createKnownCard(supabase, prototypeCard);

    if ("error" in createdCard) {
      return NextResponse.json({ error: createdCard.error }, { status: 500 });
    }

    card = createdCard.card;
    cardError = null;
  }

  const removeUploadedFiles = async (paths: string[]) => {
    if (paths.length) {
      await supabase.storage.from("card-scans").remove(paths);
    }
  };

  const uploadedFiles: { imageUrl: string; side: "front" | "back"; storagePath: string }[] = [];

  for (const submittedFile of submittedFiles) {
    const extension = getExtension(submittedFile.file);
    const storagePath = `submissions/${card.slug}/${submittedFile.side}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("card-scans").upload(storagePath, submittedFile.file, {
      cacheControl: "3600",
      contentType: submittedFile.file.type,
      upsert: false
    });

    if (uploadError) {
      await removeUploadedFiles(uploadedFiles.map((uploadedFile) => uploadedFile.storagePath));
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("card-scans").getPublicUrl(storagePath);
    uploadedFiles.push({
      imageUrl: publicUrlData.publicUrl,
      side: submittedFile.side,
      storagePath
    });
  }

  const { data: submissions, error: submissionError } = await supabase
    .from("scan_submissions")
    .insert(uploadedFiles.map((uploadedFile) => ({
      card_id: card.id,
      side: uploadedFile.side,
      contributor_email: contributorEmail,
      storage_path: uploadedFile.storagePath,
      image_url: uploadedFile.imageUrl,
      status: "pending",
      notes: notes || null
    })))
    .select("id, side, status, image_url")
    .returns<{ id: string; side: "front" | "back"; status: "pending"; image_url: string }[]>();

  if (submissionError || !submissions?.length) {
    await removeUploadedFiles(uploadedFiles.map((uploadedFile) => uploadedFile.storagePath));
    return NextResponse.json({ error: submissionError?.message ?? "Could not create scan submission." }, { status: 500 });
  }

  return NextResponse.json({
    submissions: submissions.map((submission) => ({
      id: submission.id,
      cardSlug: card.slug,
      side: submission.side,
      status: submission.status,
      imageUrl: submission.image_url
    }))
  });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getSubmittedFiles(formData: FormData, side: string, legacyFile: FormDataEntryValue | null) {
  const files: { file: File; side: "front" | "back" }[] = [];
  const frontFile = formData.get("frontFile");
  const backFile = formData.get("backFile");

  if (frontFile instanceof File && frontFile.size > 0) {
    files.push({ file: frontFile, side: "front" });
  }

  if (backFile instanceof File && backFile.size > 0) {
    files.push({ file: backFile, side: "back" });
  }

  if (!files.length && legacyFile instanceof File && legacyFile.size > 0 && allowedSides.has(side)) {
    files.push({ file: legacyFile, side: side as "front" | "back" });
  }

  return files;
}

function getExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  return "webp";
}

async function createKnownCard(supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>, card: Card) {
  const isFleerBasketball = card.setId === fleer1986BasketballSet.id;
  const setSlug = isFleerBasketball ? fleer1986BasketballSet.slug : slugify(`${card.year}-${card.setName}`);
  const { data: setRow, error: setError } = await supabase
    .from("sets")
    .upsert(
      {
        slug: setSlug,
        name: card.setName,
        year: Number(card.year),
        manufacturer: isFleerBasketball ? fleer1986BasketballSet.manufacturer : getManufacturerName(card.setName ?? ""),
        total_cards: isFleerBasketball ? fleer1986BasketballSet.totalCards : 1,
        description: isFleerBasketball ? fleer1986BasketballSet.description : `Prototype archive set record for ${card.playerName} scan submissions.`
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
    .single<{ id: string; slug: string }>();

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

function getManufacturerName(setName: string) {
  if (setName.includes("Upper Deck")) {
    return "Upper Deck";
  }

  if (setName.includes("Bowman")) {
    return "Bowman";
  }

  return setName.split(" ")[0] ?? setName;
}
