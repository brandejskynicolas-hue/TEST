import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { start } from "./mock-server.js";

let srv, client, tmp;
const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  assert.ok(!r.isError, r.content[0].text);
  return JSON.parse(r.content[0].text);
};

before(async () => {
  srv = await start();
  const base = `http://127.0.0.1:${srv.address().port}`;
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plmcp-"));
  const cfg = JSON.parse(fs.readFileSync(new URL("../config.example.json", import.meta.url)));
  cfg.baseUrl = base;
  cfg.resources.biens.apiPath = "/api/biens";
  cfg.resources.biens.detailApiPath = "/api/biens/{id}";
  cfg.resources.dossiers.mode = "dom";
  cfg.resources.dossiers.pagePath = "/dossiers-table";
  fs.writeFileSync(path.join(tmp, "config.json"), JSON.stringify(cfg));
  client = new Client({ name: "test", version: "0" });
  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: [new URL("../src/index.js", import.meta.url).pathname],
    env: { ...process.env, PL_CONFIG: path.join(tmp, "config.json"), PL_DATA_DIR: tmp, PL_EMAIL: "nico@test.fr", PL_PASSWORD: "secret" },
    stderr: "ignore",
  }));
});
after(async () => { await client?.close(); srv?.close(); });

test("expose les outils", async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ["pl_appel_api", "pl_detail_bien", "pl_detail_dossier", "pl_exporter", "pl_lire_page", "pl_lister_dossiers", "pl_rechercher_biens", "pl_statut"]);
});
test("connexion automatique", async () => {
  assert.equal((await call("pl_statut")).connecte, true);
});
test("recherche biens filtrée et triée", async () => {
  const r = await call("pl_rechercher_biens", { ville: "59", rendement_min: 7, tri: "rendement:desc" });
  assert.equal(r.total_plateforme, 3);
  assert.deepEqual(r.biens.map((b) => b.ville), ["Roubaix", "Lille"]);
});
test("détail bien avec données brutes", async () => {
  const r = await call("pl_detail_bien", { id: "2" });
  assert.equal(r.prix, 320000);
  assert.equal(r._brut.dpe, "C");
});
test("dossiers en mode tableau HTML", async () => {
  const r = await call("pl_lister_dossiers", { query: "jean" });
  assert.equal(r.dossiers[0]["Étape"], "compromis");
});
test("export CSV + valeurs Sheets", async () => {
  const r = await call("pl_exporter", { ressource: "biens", statut: "disponible" });
  assert.equal(r.lignes, 2);
  assert.ok(fs.readFileSync(r.fichier, "utf8").includes("Roubaix"));
  assert.equal(r.valeurs[0][0], "id");
});
test("lecture page brute", async () => {
  const r = await call("pl_lire_page", { chemin: "/" });
  assert.match(r.text, /Bienvenue Nicolas/);
});
