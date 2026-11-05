#!/usr/bin/env node
// Serveur MCP (stdio) : expose l'espace conseiller ProjetLocatif à Claude.
// Lecture seule : aucun outil ne modifie de données sur la plateforme.
import fs from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DATA_DIR, loadConfig } from "./config.js";
import { Session } from "./session.js";
import { Repository } from "./repository.js";
import { applyFilters, toCsv } from "./normalize.js";

const cfg = loadConfig();
const session = new Session(cfg, { headless: process.env.PL_HEADLESS !== "false" });
const repo = new Repository(session);

const server = new McpServer({ name: "projetlocatif", version: "0.1.0" });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };

const ok = (data) => ({
  content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
});
const fail = (e) => ({ isError: true, content: [{ type: "text", text: `Erreur : ${e.message}` }] });
const safe = (fn) => async (args) => {
  try {
    return await fn(args);
  } catch (e) {
    return fail(e);
  }
};

const filtresBiens = {
  query: z.string().optional().describe("Recherche plein texte (ex: 'T2', 'colocation', 'LMNP')"),
  ville: z.string().optional().describe("Ville ou début de code postal (ex: 'Lille', '59')"),
  prix_min: z.number().optional(),
  prix_max: z.number().optional().describe("Prix max en euros"),
  rendement_min: z.number().optional().describe("Rendement brut minimum en % (ex: 7)"),
  surface_min: z.number().optional().describe("Surface minimum en m²"),
  statut: z.string().optional().describe("Ex: 'disponible', 'option', 'vendu'"),
  tri: z.string().optional().describe("champ:asc|desc, ex 'rendement:desc' ou 'prix:asc'"),
  limit: z.number().int().min(1).max(500).optional().describe("Défaut 50"),
  refresh: z.boolean().optional().describe("Ignorer le cache de 5 min"),
};

server.registerTool(
  "pl_statut",
  {
    title: "Statut de la connexion ProjetLocatif",
    description: "Vérifie que le connecteur est bien connecté à l'espace conseiller ProjetLocatif.",
    annotations: READ_ONLY,
  },
  safe(async () => {
    await session.run(() => session.ensureLoggedIn());
    return ok({ connecte: true, plateforme: cfg.baseUrl, ressources: Object.keys(cfg.resources || {}) });
  })
);

server.registerTool(
  "pl_rechercher_biens",
  {
    title: "Rechercher des biens",
    description:
      "Liste les biens disponibles sur ProjetLocatif avec filtres (ville, budget, rendement, surface, statut) et tri. " +
      "À utiliser pour matcher un investisseur avec des biens ou faire une veille.",
    inputSchema: filtresBiens,
    annotations: READ_ONLY,
  },
  safe(async ({ refresh, ...f }) => {
    const all = await repo.list("biens", { refresh });
    const res = applyFilters(all, f);
    return ok({ total_plateforme: all.length, resultats: res.length, biens: res });
  })
);

server.registerTool(
  "pl_detail_bien",
  {
    title: "Détail d'un bien",
    description: "Renvoie la fiche complète d'un bien (toutes les données brutes disponibles).",
    inputSchema: { id: z.string().describe("Identifiant du bien") },
    annotations: READ_ONLY,
  },
  safe(async ({ id }) => ok(await repo.get("biens", id)))
);

server.registerTool(
  "pl_lister_dossiers",
  {
    title: "Lister mes dossiers clients",
    description:
      "Liste tes dossiers investisseurs (client, bien, étape, budget, commission). Filtre par texte ou étape.",
    inputSchema: {
      query: z.string().optional().describe("Nom du client, ville, bien…"),
      statut: z.string().optional().describe("Étape : 'compromis', 'financement', 'travaux'…"),
      tri: z.string().optional(),
      limit: z.number().int().min(1).max(500).optional(),
      refresh: z.boolean().optional(),
    },
    annotations: READ_ONLY,
  },
  safe(async ({ refresh, ...f }) => {
    const all = await repo.list("dossiers", { refresh });
    const res = applyFilters(all, f);
    return ok({ total: all.length, resultats: res.length, dossiers: res });
  })
);

server.registerTool(
  "pl_detail_dossier",
  {
    title: "Détail d'un dossier",
    description: "Renvoie le détail complet d'un dossier client.",
    inputSchema: { id: z.string() },
    annotations: READ_ONLY,
  },
  safe(async ({ id }) => ok(await repo.get("dossiers", id)))
);

server.registerTool(
  "pl_exporter",
  {
    title: "Exporter biens ou dossiers",
    description:
      "Exporte biens ou dossiers filtrés : écrit un CSV (séparateur ;) dans ~/.projetlocatif-mcp/exports et " +
      "renvoie les lignes en tableau (en-têtes + valeurs) prêtes à être collées dans Google Sheets.",
    inputSchema: {
      ressource: z.enum(["biens", "dossiers"]),
      ...filtresBiens,
    },
    annotations: { ...READ_ONLY, readOnlyHint: false, destructiveHint: false },
  },
  safe(async ({ ressource, refresh, ...f }) => {
    const all = await repo.list(ressource, { refresh });
    const res = applyFilters(all, { limit: 500, ...f });
    const dir = path.join(DATA_DIR, "exports");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${ressource}-${new Date().toISOString().slice(0, 19).replace(/:/g, "")}.csv`);
    fs.writeFileSync(file, "﻿" + toCsv(res), "utf8");
    const cols = [...new Set(res.flatMap((i) => Object.keys(i)))];
    const rows = [cols, ...res.map((i) => cols.map((c) => (typeof i[c] === "object" ? JSON.stringify(i[c]) : i[c] ?? "")))];
    return ok({ fichier: file, lignes: res.length, valeurs: rows });
  })
);

server.registerTool(
  "pl_lire_page",
  {
    title: "Lire une page de l'espace conseiller",
    description:
      "Ouvre n'importe quelle page de l'espace conseiller (chemin relatif, ex '/actualites') et renvoie son texte visible. " +
      "Utile pour ce qui n'est pas encore cartographié (actus réseau, documents, grilles de commission…).",
    inputSchema: { chemin: z.string().describe("Chemin relatif, ex '/biens/123'") },
    annotations: READ_ONLY,
  },
  safe(async ({ chemin }) => ok(await session.pageText(chemin)))
);

server.registerTool(
  "pl_appel_api",
  {
    title: "Appel GET brut à l'API interne",
    description:
      "GET en lecture seule sur un endpoint JSON interne de la plateforme (repéré via `npm run discover`). " +
      "Réponse tronquée à 30 000 caractères.",
    inputSchema: { chemin: z.string().describe("Ex '/api/v1/programmes?page=1'") },
    annotations: READ_ONLY,
  },
  safe(async ({ chemin }) => ok(JSON.stringify(await session.apiGet(chemin), null, 2).slice(0, 30000)))
);

const shutdown = async () => {
  await session.close().catch(() => {});
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.stdin.on("close", shutdown);

await server.connect(new StdioServerTransport());
console.error("[projetlocatif] serveur MCP prêt");
