import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DATA_DIR =
  process.env.PL_DATA_DIR || path.join(os.homedir(), ".projetlocatif-mcp");
export const PROFILE_DIR = path.join(DATA_DIR, "browser-profile");

export function loadConfig() {
  const file = process.env.PL_CONFIG || path.join(ROOT, "config.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      `Config introuvable (${file}). Copie config.example.json en config.json et renseigne baseUrl.`
    );
  }
  const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
  if (process.env.PL_BASE_URL) cfg.baseUrl = process.env.PL_BASE_URL;
  if (!cfg.baseUrl || cfg.baseUrl.includes("A_COMPLETER")) {
    throw new Error("baseUrl n'est pas renseigné dans config.json (ou via PL_BASE_URL).");
  }
  cfg.baseUrl = cfg.baseUrl.replace(/\/+$/, "");
  return cfg;
}

export function absUrl(cfg, p) {
  if (!p) return cfg.baseUrl;
  if (/^https?:\/\//.test(p)) return p;
  return cfg.baseUrl + (p.startsWith("/") ? p : "/" + p);
}
