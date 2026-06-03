import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { fleer1986BasketballSet, getFleer1986BasketballCardBySlug } from "@/lib/fleer-basketball-data";
import { getKnownPlayerCardBySlug } from "@/lib/player-profiles";
import { createAdminSupabaseClient, getAdminSupabaseConfigStatus } from "@/lib/supabase-admin";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const allowedSides = new Set(["front", "back"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const token = request.headers.get("x-admin-upload-token") ?? "";
  const expectedToken = process.env.ADMIN_UPLOAD_TOKEN;

  if (!expectedToken) {
    return NextResponse.json({ error: "ADMIN_UPLOAD_TOKEN is not configured." }, { status: 500 });
  }

  if (token !== expectedToken) {
    return NextResponse.json({ error: "Invalid admin upload token." }, { status: 401 });
  }

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
  const cardSlug = String(formData.get("cardSlug") ?? "");
  const legacySide = String(formData.get("side") ?? "");
  const legacyFile = formData.get("file");
  const uploads = [
    { side: "front", file: formData.get("frontFile") },
    { side: "back", file: formData.get("backFile") }
  ].filter((upload) => upload.file instanceof File && upload.file.size > 0);

  if (uploads.length === 0 && legacyFile instanceof File && legacyFile.size > 0 && allowedSides.has(legacySide)) {
    uploads.push({ side: legacySide, file: legacyFile });
  }

  if (!cardSlug) {
    return NextResponse.json({ error: "Choose a valid card." }, { status: 400 });
  }

  if (uploads.length === 0) {
    return NextResponse.json({ error: "Choose at least one front or back image file." }, { status: 400 });
  }

  const invalidUpload = uploads.find((upload) => !(upload.file instanceof File) || !allowedTypes.has(upload.file.type));

  if (invalidUpload) {
    return NextResponse.json({ error: "Upload JPG, PNG, or WebP images only." }, { status: 400 });
  }

  const prototypeCard = getKnownPlayerCardBySlug(cardSlug) ?? getFleer1986BasketballCardBySlug(cardSlug);
  let { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, slug")
    .eq("slug", cardSlug)
    .single<{ id: string; slug: string }>();

  if (cardError || !card) {
    if (!prototypeCard?.setName || !prototypeCard.year) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const setSlug = slugify(`${prototypeCard.year}-${prototypeCard.setName}`);
    const manufacturer = getManufacturerName(prototypeCard.setName);
    const isFleerBasketball = prototypeCard.setId === fleer1986BasketballSet.id;
    const { data: setRow, error: setError } = await supabase
      .from("sets")
      .upsert(
        {
          slug: setSlug,
          name: prototypeCard.setName,
          year: Number(prototypeCard.year),
          manufacturer,
          total_cards: isFleerBasketball ? fleer1986BasketballSet.totalCards : 1,
          description: isFleerBasketball
            ? fleer1986BasketballSet.description
            : `Prototype archive set record for ${prototypeCard.playerName} card uploads.`
        },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single<{ id: string; slug: string }>();

    if (setError || !setRow) {
      return NextResponse.json({ error: setError?.message ?? "Could not create card set." }, { status: 500 });
    }

    const { data: createdCard, error: createCardError } = await supabase
      .from("cards")
      .upsert(
        {
          set_id: setRow.id,
          card_number: prototypeCard.number,
          slug: prototypeCard.cardSlug,
          player_name: prototypeCard.playerName,
          team: prototypeCard.team,
          team_slug: prototypeCard.teamSlug,
          position: prototypeCard.position,
          is_rookie: prototypeCard.isRookie,
          is_hall_of_famer: prototypeCard.isHallOfFamer,
          notes: prototypeCard.notes
        },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single<{ id: string; slug: string }>();

    if (createCardError || !createdCard) {
      return NextResponse.json({ error: createCardError?.message ?? "Could not create card." }, { status: 500 });
    }

    const { error: missingImagesError } = await supabase.from("card_images").upsert(
      [
        { card_id: createdCard.id, side: "front", image_url: null, status: "missing" },
        { card_id: createdCard.id, side: "back", image_url: null, status: "missing" }
      ],
      { onConflict: "card_id,side" }
    );

    if (missingImagesError) {
      return NextResponse.json({ error: missingImagesError.message }, { status: 500 });
    }

    card = createdCard;
    cardError = null;
  }

  const savedImages = [];

  for (const upload of uploads) {
    if (!(upload.file instanceof File)) {
      continue;
    }

    const extension = upload.file.type === "image/png" ? "png" : upload.file.type === "image/jpeg" ? "jpg" : "webp";
    const storagePath = `${getStorageFolder(cardSlug, prototypeCard?.setId)}/${card.slug}-${upload.side}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("card-scans").upload(storagePath, upload.file, {
      cacheControl: "31536000",
      contentType: upload.file.type,
      upsert: false
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("card-scans").getPublicUrl(storagePath);
    const imageUrl = publicUrlData.publicUrl;

    const { error: imageError } = await supabase.from("card_images").upsert(
      {
        card_id: card.id,
        side: upload.side,
        image_url: imageUrl,
        storage_path: storagePath,
        status: "approved",
        approved_at: new Date().toISOString()
      },
      { onConflict: "card_id,side" }
    );

    if (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 500 });
    }

    savedImages.push({ side: upload.side, imageUrl, storagePath });
  }

  revalidatePath("/sets/1989-upper-deck-baseball");
  revalidatePath(`/sets/${fleer1986BasketballSet.slug}`);
  revalidatePath(`/cards/${card.slug}`);

  if (prototypeCard?.setId !== fleer1986BasketballSet.id) {
    revalidatePath("/players/ken-griffey-jr");
  }

  return NextResponse.json({ cardSlug: card.slug, images: savedImages });
}

function getStorageFolder(cardSlug: string, setId?: string) {
  if (setId === fleer1986BasketballSet.id) {
    return fleer1986BasketballSet.slug;
  }

  return cardSlug.match(/^[0-9]{1,3}-/) ? "1989-upper-deck-baseball" : "player-universe";
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
