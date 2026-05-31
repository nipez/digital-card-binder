import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";

const [, , manifestPath = "scripts/approved-scan-manifest.example.json"] = process.argv;
const outputRoot = join(process.cwd(), "public", "scans", "1989-upper-deck-baseball");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (!Array.isArray(manifest)) {
  throw new Error("Manifest must be a JSON array.");
}

await mkdir(outputRoot, { recursive: true });

const sqlStatements = [];

for (const item of manifest) {
  validateItem(item);

  const response = await fetch(item.sourceUrl, {
    headers: {
      "user-agent": "Binder Archive approved scan ingester"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${item.sourceUrl}: ${response.status} ${response.statusText}`);
  }

  const sourceBytes = Buffer.from(await response.arrayBuffer());
  const outputName = `${item.cardSlug}-${item.side}.webp`;
  const outputPath = join(outputRoot, outputName);

  let image = sharp(sourceBytes).rotate();

  if (item.crop) {
    image = image.extract({
      left: Number(item.crop.left),
      top: Number(item.crop.top),
      width: Number(item.crop.width),
      height: Number(item.crop.height)
    });
  }

  await image.resize(750, 1050, { fit: "fill" }).sharpen({ sigma: 0.5 }).webp({ quality: 88 }).toFile(outputPath);

  const imageUrl = `/scans/1989-upper-deck-baseball/${outputName}`;
  sqlStatements.push(sqlForCardImage(item.cardSlug, item.side, imageUrl));
  console.log(`Saved ${imageUrl} from ${item.sourceName}`);
}

if (sqlStatements.length > 0) {
  const sqlPath = join(process.cwd(), "supabase", "seed", "approved_scan_updates.sql");
  await writeFile(sqlPath, `${sqlStatements.join("\n\n")}\n`, "utf8");
  console.log(`Wrote ${basename(sqlPath)} with ${sqlStatements.length} update statements.`);
}

function validateItem(item) {
  const required = ["cardSlug", "side", "sourceUrl", "sourceName"];
  for (const key of required) {
    if (!item[key]) {
      throw new Error(`Manifest item is missing ${key}.`);
    }
  }

  if (!["front", "back"].includes(item.side)) {
    throw new Error(`Invalid side for ${item.cardSlug}: ${item.side}`);
  }

  if (item.rightsConfirmed !== true) {
    throw new Error(`${item.cardSlug} ${item.side} must set rightsConfirmed to true.`);
  }

  if (item.crop) {
    for (const key of ["left", "top", "width", "height"]) {
      if (!Number.isFinite(Number(item.crop[key]))) {
        throw new Error(`Invalid crop.${key} for ${item.cardSlug} ${item.side}.`);
      }
    }
  }
}

function sqlForCardImage(cardSlug, side, imageUrl) {
  const escapedSlug = escapeSql(cardSlug);
  const escapedSide = escapeSql(side);
  const escapedImageUrl = escapeSql(imageUrl);

  return `with target_card as (
  select id from public.cards where slug = '${escapedSlug}'
)
update public.card_images
set image_url = '${escapedImageUrl}',
  status = 'approved',
  updated_at = now()
where card_id = (select id from target_card)
  and side = '${escapedSide}';`;
}

function escapeSql(value) {
  return String(value).replaceAll("'", "''");
}
