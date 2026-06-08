import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import sharp from "sharp";

process.on("uncaughtException", handleFatalError);
process.on("unhandledRejection", handleFatalError);

const DEFAULT_SET = {
  name: "1989 Upper Deck Baseball",
  slug: "1989-upper-deck-baseball",
  cardCount: 800
};

const IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i;
const SIDE_VALUES = ["front", "back"];

loadEnvFile(".env.local");
loadEnvFile(".env");

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const set = {
  name: args.set ?? args.setName ?? DEFAULT_SET.name,
  slug: args.setSlug ?? slugify(args.set ?? args.setName ?? DEFAULT_SET.name)
};
const provider = args.provider ?? detectProvider();
const maxCards = toPositiveInteger(args.maxCards ?? args.limit, Number.POSITIVE_INFINITY);
const maxResults = toPositiveInteger(args.maxResults, 10);
const delayMs = toPositiveInteger(args.delayMs, 750);
const outputPath = args.output ?? join("scripts", "web-scraped-scan-candidates.json");
const download = Boolean(args.download);
const confirmRights = Boolean(args.confirmRights);
const cards = await loadCards(args.cards, {
  count: toPositiveInteger(args.cardCount, DEFAULT_SET.cardCount),
  maxCards
});

if (download && !confirmRights) {
  throw new Error("Refusing to download images without --confirm-rights. Review source permissions first.");
}

if (!provider) {
  throw new Error(`No search provider configured.

Set one of these in .env.local:
  BRAVE_SEARCH_API_KEY=...
  SERPAPI_API_KEY=...
  BING_SEARCH_API_KEY=...

Then run this again:
  npm run scrape-card-set-images -- --provider brave --max-cards 25`);
}

const searchClient = createSearchClient(provider, { delayMs });
const candidates = [];

console.log(`Searching ${cards.length} card(s) from ${set.name} with ${provider}.`);

for (const card of cards) {
  for (const side of SIDE_VALUES) {
    const query = buildQuery({ setName: set.name, card, side });
    const results = await searchClient.searchImages(query, maxResults);

    for (const result of results) {
      const sourceUrl = result.imageUrl;
      if (!sourceUrl || !IMAGE_EXTENSIONS.test(sourceUrl)) continue;

      candidates.push({
        setSlug: set.slug,
        cardNumber: card.number,
        cardSlug: card.slug,
        playerName: card.playerName ?? null,
        side,
        sourceUrl,
        sourcePageUrl: result.pageUrl ?? null,
        sourceName: result.sourceName ?? provider,
        searchQuery: query,
        rightsConfirmed: false,
        confidence: scoreResult({ result, card, side, setName: set.name }),
        notes: "Search result candidate only. Review source permissions, image quality, and front/back match before ingesting."
      });
    }
  }
}

const uniqueCandidates = dedupeCandidates(candidates).sort(compareCandidates);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(uniqueCandidates, null, 2)}\n`, "utf8");

console.log(`Found ${uniqueCandidates.length} candidate image(s).`);
console.log(`Wrote ${outputPath}.`);

if (download) {
  const downloaded = await downloadCandidates({ set, candidates: uniqueCandidates, delayMs });
  console.log(`Downloaded ${downloaded.length} image(s) to public/scans/${set.slug}.`);
}

async function loadCards(cardsPath, { count, maxCards }) {
  if (!cardsPath) {
    return Array.from({ length: Math.min(count, maxCards) }, (_, index) => {
      const number = String(index + 1);
      return {
        number,
        playerName: null,
        slug: `${number}-card`
      };
    });
  }

  const absolutePath = resolve(process.cwd(), cardsPath);
  const extension = extname(absolutePath).toLowerCase();
  const text = await readFile(absolutePath, "utf8");
  const rows = extension === ".json" ? parseJsonCards(text) : parseCsvCards(text);

  return rows.slice(0, maxCards).map((row) => {
    const number = String(row.number ?? row.cardNumber ?? row.card_number ?? "").trim();
    const playerName = String(row.playerName ?? row.player_name ?? row.name ?? "").trim() || null;
    if (!number) {
      throw new Error(`Checklist row is missing a card number in ${cardsPath}.`);
    }

    return {
      number,
      playerName,
      slug: row.slug ? String(row.slug) : `${number}-${slugify(playerName ?? "card")}`
    };
  });
}

function parseJsonCards(text) {
  const value = JSON.parse(text);
  if (!Array.isArray(value)) {
    throw new Error("Checklist JSON must be an array of cards.");
  }
  return value;
}

function parseCsvCards(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function buildQuery({ setName, card, side }) {
  const namePart = card.playerName ? ` "${card.playerName}"` : "";
  return `"${setName}" "#${card.number}"${namePart} baseball card ${side}`;
}

function detectProvider() {
  if (process.env.BRAVE_SEARCH_API_KEY) return "brave";
  if (process.env.SERPAPI_API_KEY) return "serpapi";
  if (process.env.BING_SEARCH_API_KEY) return "bing";
  return null;
}

function createSearchClient(provider, { delayMs }) {
  let lastRequestAt = 0;

  return {
    async searchImages(query, maxResults) {
      const response = await request(provider, query, maxResults);
      await waitForRateLimit();
      return response;
    }
  };

  async function request(providerName, query, maxResults) {
    if (providerName === "brave") {
      return searchBrave(query, maxResults);
    }
    if (providerName === "serpapi") {
      return searchSerpApi(query, maxResults);
    }
    if (providerName === "bing") {
      return searchBing(query, maxResults);
    }
    throw new Error(`Unknown provider "${providerName}". Use brave, serpapi, or bing.`);
  }

  async function waitForRateLimit() {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < delayMs) {
      await sleep(delayMs - elapsed);
    }
    lastRequestAt = Date.now();
  }
}

async function searchBrave(query, maxResults) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) throw new Error("Set BRAVE_SEARCH_API_KEY in .env.local.");

  const url = new URL("https://api.search.brave.com/res/v1/images/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(maxResults, 100)));
  url.searchParams.set("safesearch", "moderate");

  const json = await fetchJson(url, {
    headers: {
      "accept": "application/json",
      "x-subscription-token": apiKey
    }
  });

  return (json.results ?? []).map((item) => ({
    imageUrl: item.properties?.url ?? item.thumbnail?.src,
    pageUrl: item.url,
    sourceName: item.source ?? hostnameFor(item.url),
    title: item.title,
    width: item.properties?.width,
    height: item.properties?.height
  }));
}

async function searchSerpApi(query, maxResults) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error("Set SERPAPI_API_KEY in .env.local.");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", String(Math.min(maxResults, 100)));
  url.searchParams.set("safe", "active");

  const json = await fetchJson(url);

  return (json.images_results ?? []).map((item) => ({
    imageUrl: item.original ?? item.thumbnail,
    pageUrl: item.link,
    sourceName: item.source ?? hostnameFor(item.link),
    title: item.title,
    width: item.original_width,
    height: item.original_height
  }));
}

async function searchBing(query, maxResults) {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) throw new Error("Set BING_SEARCH_API_KEY in .env.local.");

  const url = new URL("https://api.bing.microsoft.com/v7.0/images/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(maxResults, 150)));
  url.searchParams.set("safeSearch", "Moderate");

  const json = await fetchJson(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey
    }
  });

  return (json.value ?? []).map((item) => ({
    imageUrl: item.contentUrl,
    pageUrl: item.hostPageUrl,
    sourceName: item.hostPageDomainFriendlyName ?? hostnameFor(item.hostPageUrl),
    title: item.name,
    width: item.width,
    height: item.height
  }));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 240)}`);
  }

  return JSON.parse(body);
}

async function downloadCandidates({ set, candidates, delayMs }) {
  const outputRoot = join(process.cwd(), "public", "scans", set.slug);
  const manifestPath = join(process.cwd(), "scripts", "web-scraped-approved-scans.json");
  const sqlPath = join(process.cwd(), "supabase", "seed", "web_scraped_scan_updates.sql");
  const approvedManifest = [];
  const sqlStatements = [];
  let lastDownloadAt = 0;

  await mkdir(outputRoot, { recursive: true });

  for (const candidate of candidates) {
    const elapsed = Date.now() - lastDownloadAt;
    if (elapsed < delayMs) {
      await sleep(delayMs - elapsed);
    }
    lastDownloadAt = Date.now();

    const response = await fetch(candidate.sourceUrl, {
      headers: {
        "user-agent": "Binder Archive search image downloader"
      }
    });

    if (!response.ok) {
      console.warn(`Skipping ${candidate.sourceUrl}: ${response.status} ${response.statusText}`);
      continue;
    }

    const imageBytes = Buffer.from(await response.arrayBuffer());
    const outputName = `${candidate.cardSlug}-${candidate.side}.webp`;
    const outputFile = join(outputRoot, outputName);

    await sharp(imageBytes)
      .rotate()
      .resize(750, 1050, { fit: "fill" })
      .sharpen({ sigma: 0.5 })
      .webp({ quality: 88 })
      .toFile(outputFile);

    const imageUrl = `/scans/${set.slug}/${outputName}`;
    approvedManifest.push({
      cardSlug: candidate.cardSlug,
      side: candidate.side,
      sourceUrl: candidate.sourceUrl,
      sourceName: candidate.sourceName,
      sourcePageUrl: candidate.sourcePageUrl,
      rightsConfirmed: true
    });
    sqlStatements.push(sqlForCardImage(candidate.cardSlug, candidate.side, imageUrl));
  }

  await writeFile(manifestPath, `${JSON.stringify(approvedManifest, null, 2)}\n`, "utf8");
  await writeFile(sqlPath, `${sqlStatements.join("\n\n")}\n`, "utf8");
  console.log(`Wrote ${basename(manifestPath)} and ${basename(sqlPath)}.`);

  return approvedManifest;
}

function scoreResult({ result, card, side, setName }) {
  const haystack = `${result.title ?? ""} ${result.imageUrl ?? ""} ${result.pageUrl ?? ""}`.toLowerCase();
  let score = 0.3;
  if (haystack.includes(side)) score += 0.2;
  if (haystack.includes(String(card.number).toLowerCase())) score += 0.15;
  if (card.playerName && haystack.includes(card.playerName.toLowerCase())) score += 0.2;
  if (haystack.includes(setName.toLowerCase().replace(" baseball", ""))) score += 0.1;
  if (result.width && result.height && result.height > result.width) score += 0.05;
  return Math.min(1, Number(score.toFixed(2)));
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const unique = [];
  for (const candidate of candidates) {
    const key = [candidate.cardSlug, candidate.side, candidate.sourceUrl].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }
  return unique;
}

function compareCandidates(a, b) {
  return compareCardNumbers(a.cardNumber, b.cardNumber)
    || String(a.side).localeCompare(String(b.side))
    || Number(b.confidence) - Number(a.confidence)
    || String(a.sourceUrl).localeCompare(String(b.sourceUrl));
}

function compareCardNumbers(a, b) {
  const aNumber = Number.parseInt(String(a), 10);
  const bNumber = Number.parseInt(String(b), 10);
  return aNumber - bNumber || String(a).localeCompare(String(b));
}

function sqlForCardImage(cardSlug, side, imageUrl) {
  return `with target_card as (
  select id from public.cards where slug = '${escapeSql(cardSlug)}'
)
update public.card_images
set image_url = '${escapeSql(imageUrl)}',
  status = 'approved',
  updated_at = now()
where card_id = (select id from target_card)
  and side = '${escapeSql(side)}';`;
}

function loadEnvFile(filePath) {
  const absolutePath = resolve(process.cwd(), filePath);
  if (!existsSync(absolutePath)) return;

  const text = existsSync(absolutePath) ? requireFileText(absolutePath) : "";
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function requireFileText(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue != null) {
      parsed[key] = inlineValue;
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      parsed[key] = argv[index + 1];
      index += 1;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

function toPositiveInteger(value, fallback) {
  if (value == null) return fallback;
  const number = Number.parseInt(String(value), 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hostnameFor(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function escapeSql(value) {
  return String(value).replaceAll("'", "''");
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function handleFatalError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Set image scrape failed: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Usage:
  npm run scrape-card-set-images -- [options]

Examples:
  npm run scrape-card-set-images -- --provider brave --max-cards 25
  npm run scrape-card-set-images -- --provider serpapi --cards scripts/checklists/1989-upper-deck-baseball.csv
  npm run scrape-card-set-images -- --provider bing --card-count 800 --max-results 5

Setup:
  Add one search API key to .env.local:
    BRAVE_SEARCH_API_KEY=...
    SERPAPI_API_KEY=...
    BING_SEARCH_API_KEY=...

Options:
  --set                  Set name. Default: ${DEFAULT_SET.name}
  --set-slug             Local set slug. Default is derived from --set
  --cards                Optional JSON/CSV checklist with number, playerName, slug columns
  --card-count           Numbered cards to search when no checklist is provided. Default: ${DEFAULT_SET.cardCount}
  --provider             brave, serpapi, or bing. Default: auto-detect from env
  --max-cards, --limit   Stop after this many cards
  --max-results          Image results per card side. Default: 10
  --delay-ms             Delay between search requests. Default: 750
  --output               Candidate manifest path. Default: scripts/web-scraped-scan-candidates.json
  --download             Download and normalize candidates
  --confirm-rights       Required with --download; asserts you have permission to use the images
`);
}
