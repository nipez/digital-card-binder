import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient, getAdminSupabaseConfigStatus } from "@/lib/supabase-admin";

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

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, slug")
    .eq("slug", cardSlug)
    .single<{ id: string; slug: string }>();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const savedImages = [];

  for (const upload of uploads) {
    if (!(upload.file instanceof File)) {
      continue;
    }

    const extension = upload.file.type === "image/png" ? "png" : upload.file.type === "image/jpeg" ? "jpg" : "webp";
    const storagePath = `1989-upper-deck-baseball/${card.slug}-${upload.side}-${Date.now()}.${extension}`;
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
  revalidatePath(`/cards/${card.slug}`);

  return NextResponse.json({ cardSlug: card.slug, images: savedImages });
}
