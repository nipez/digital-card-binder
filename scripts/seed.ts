import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error("Set SUPABASE_DB_URL before running npm run seed.");
}

const sql = readFileSync(join(process.cwd(), "supabase", "seed", "1989_upper_deck_demo.sql"), "utf8");

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Seeded 30 demo cards for 1989 Upper Deck Baseball.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
