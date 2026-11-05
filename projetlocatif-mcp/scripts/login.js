#!/usr/bin/env node
// Ouvre un navigateur visible pour te connecter à la main (captcha / 2FA OK).
// La session est stockée dans ~/.projetlocatif-mcp et réutilisée par le connecteur.
import { chromium } from "playwright";
import fs from "node:fs";
import { PROFILE_DIR, loadConfig, absUrl } from "../src/config.js";

const cfg = loadConfig();
fs.mkdirSync(PROFILE_DIR, { recursive: true });
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, locale: "fr-FR" });
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto(absUrl(cfg, cfg.loginPath), { waitUntil: "domcontentloaded" });
console.log("➡  Connecte-toi dans la fenêtre, puis FERME le navigateur. La session sera sauvegardée.");
await new Promise((r) => ctx.on("close", r));
console.log("✅ Session enregistrée dans", PROFILE_DIR);
