#!/usr/bin/env node
/**
 * Apply a SQL file (or inline query) to one of the two Supabase projects via
 * the Management API.
 *
 * Usage:
 *   node scripts/apply-sql.mjs --project app|ledger --file supabase/migrations/x.sql
 *   node scripts/apply-sql.mjs --project ledger --query "SELECT 1"
 *
 * Project refs are derived from .env.local:
 *   app    → NEXT_PUBLIC_SUPABASE_URL
 *   ledger → SUPABASE_URL
 * Auth: SUPABASE_ACCESS_TOKEN (Management API personal access token).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=("?)(.*)\2\s*$/);
    if (match) env[match[1]] = match[3];
  }
  return env;
}

function refFromUrl(url) {
  const match = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!match) throw new Error(`Cannot derive project ref from URL: ${url}`);
  return match[1];
}

const args = process.argv.slice(2);
function argValue(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

const project = argValue("--project");
const file = argValue("--file");
const inlineQuery = argValue("--query");

if (!project || (!file && !inlineQuery)) {
  console.error(
    "Usage: node scripts/apply-sql.mjs --project app|ledger (--file path.sql | --query \"SQL\")"
  );
  process.exit(1);
}

const env = parseEnv(resolve(root, ".env.local"));
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("SUPABASE_ACCESS_TOKEN missing from .env.local");

const ref =
  project === "app"
    ? refFromUrl(env.NEXT_PUBLIC_SUPABASE_URL)
    : project === "ledger"
      ? refFromUrl(env.SUPABASE_URL)
      : (() => {
          throw new Error(`Unknown project: ${project}`);
        })();

const query = inlineQuery ?? readFileSync(resolve(root, file), "utf8");

const response = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  }
);

const body = await response.text();
if (!response.ok) {
  console.error(`FAILED (${response.status}) on project '${project}' [${ref}]`);
  console.error(body);
  process.exit(1);
}

console.log(`OK on project '${project}' [${ref}]`);
try {
  const parsed = JSON.parse(body);
  console.log(JSON.stringify(parsed, null, 2).slice(0, 4000));
} catch {
  console.log(body.slice(0, 4000));
}
