import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

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
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const cardSlug = String(formData.get("cardSlug") ?? "");
  const side = String(formData.get("side") ?? "");
  const file = formData.get("file");

  if (!cardSlug || !allowedSides.has(side)) {
    return NextResponse.json({ error: "Choose a valid card and side." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
  }

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, slug")
    .eq("slug", cardSlug)
    .single<{ id: string; slug: string }>();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const storagePath = `1989-upper-deck-baseball/${card.slug}-${side}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("card-scans").upload(storagePath, file, {
    cacheControl: "31536000",
    contentType: file.type,
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
      side,
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

  revalidatePath("/sets/1989-upper-deck-baseball");
  revalidatePath(`/cards/${card.slug}`);

  return NextResponse.json({ cardSlug: card.slug, side, imageUrl, storagePath });
}
