#!/usr/bin/env node
// MODE DÉCOUVERTE — l'astuce pour ne pas scraper du HTML fragile :
// tu navigues normalement (liste des biens, fiches, dossiers…) et le script
// enregistre tous les appels JSON que fait le site en coulisse.
//
// Sorties (dans ~/.projetlocatif-mcp/discovery/) :
//   - endpoints-schema.json : URL + STRUCTURE des réponses (noms de champs, types,
//     AUCUNE valeur) → c'est ce fichier que tu peux m'envoyer sans fuite de données clients.
//   - raw/ : réponses complètes, à garder pour toi (données personnelles).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, PROFILE_DIR, loadConfig, absUrl } from "../src/config.js";

const cfg = loadConfig();
const outDir = path.join(DATA_DIR, "discovery");
const rawDir = path.join(outDir, "raw");
fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(PROFILE_DIR, { recursive: true });

const host = new URL(cfg.baseUrl).hostname.split(".").slice(-2).join(".");

/** Squelette d'un JSON : garde les clés et les types, jamais les valeurs. */
function schema(v, depth = 0) {
  if (depth > 6) return "…";
  if (Array.isArray(v)) return v.length ? [schema(v[0], depth + 1), `(${v.length} éléments)`] : [];
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, schema(x, depth + 1)]));
  }
  return v === null ? "null" : typeof v;
}

const SENSITIVE = /^(authorization|cookie|x-csrf|x-xsrf|x-auth)/i;
const endpoints = new Map();
let n = 0;

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, locale: "fr-FR" });
ctx.on("response", async (res) => {
  try {
    const url = new URL(res.url());
    if (!url.hostname.endsWith(host)) return;
    const type = res.headers()["content-type"] || "";
    if (!type.includes("json")) return;
    const req = res.request();
    const body = await res.json().catch(() => null);
    if (body == null) return;

    const key = `${req.method()} ${url.pathname}`;
    const usesBearer = Object.keys(req.headers()).some((h) => h.toLowerCase() === "authorization");
    endpoints.set(key, {
      method: req.method(),
      path: url.pathname,
      exempleQuery: url.search,
      status: res.status(),
      authBearer: usesBearer,
      headersUtiles: Object.keys(req.headers()).filter((h) => !SENSITIVE.test(h) && h.startsWith("x-")),
      schema: schema(body),
    });
    fs.writeFileSync(path.join(rawDir, `${String(++n).padStart(4, "0")}.json`), JSON.stringify({ url: url.href, body }, null, 2));
    fs.writeFileSync(path.join(outDir, "endpoints-schema.json"), JSON.stringify([...endpoints.values()], null, 2));
    console.log("📡", key);
  } catch {}
});

const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto(absUrl(cfg, "/"), { waitUntil: "domcontentloaded" });

// Repère aussi un éventuel token stocké côté navigateur (nom de la clé uniquement).
setTimeout(async () => {
  try {
    const keys = await page.evaluate(() => Object.keys(localStorage));
    const candidates = keys.filter((k) => /token|auth|jwt|session/i.test(k));
    if (candidates.length) console.log("🔑 Clés localStorage candidates pour auth.bearerFromLocalStorage :", candidates);
  } catch {}
}, 15000);

console.log(`
➡  Navigue dans l'espace conseiller : liste des biens, filtres, 2-3 fiches,
   liste des dossiers, 1-2 dossiers. Puis FERME le navigateur.
`);
await new Promise((r) => ctx.on("close", r));
console.log(`✅ ${endpoints.size} endpoints trouvés → ${path.join(outDir, "endpoints-schema.json")}`);
