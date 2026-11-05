// Session navigateur persistante (Playwright) : se connecte avec tes identifiants,
// garde les cookies dans ~/.projetlocatif-mcp, et réutilise la session pour
// appeler les endpoints internes (JSON) ou lire les pages.
import fs from "node:fs";
import { chromium } from "playwright";
import { PROFILE_DIR, absUrl } from "./config.js";

const log = (...a) => console.error("[projetlocatif]", ...a); // stdout réservé au protocole MCP

export class Session {
  constructor(cfg, { headless = true } = {}) {
    this.cfg = cfg;
    this.headless = headless;
    this.context = null;
    this.page = null;
    this.loggedIn = false;
    this._queue = Promise.resolve();
  }

  /** Sérialise les accès (une seule page partagée). */
  run(fn) {
    const next = this._queue.then(fn, fn);
    this._queue = next.catch(() => {});
    return next;
  }

  async open() {
    if (this.context) return;
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
    const launch = { headless: this.headless, locale: "fr-FR" };
    if (process.env.PL_CHROMIUM_PATH) launch.executablePath = process.env.PL_CHROMIUM_PATH;
    this.context = await chromium.launchPersistentContext(PROFILE_DIR, launch);
    this.page = this.context.pages()[0] || (await this.context.newPage());
  }

  async close() {
    await this.context?.close();
    this.context = null;
    this.page = null;
    this.loggedIn = false;
  }

  async isLoggedIn() {
    const { selectors } = this.cfg;
    try {
      await this.page.waitForSelector(selectors.loggedInMarker, { timeout: 4000 });
      return true;
    } catch {
      return false;
    }
  }

  async ensureLoggedIn({ force = false } = {}) {
    await this.open();
    if (this.loggedIn && !force) return;
    const { selectors, loginPath } = this.cfg;

    await this.page.goto(absUrl(this.cfg, "/"), { waitUntil: "domcontentloaded" });
    if (!force && (await this.isLoggedIn())) {
      this.loggedIn = true;
      return;
    }

    const email = process.env.PL_EMAIL;
    const password = process.env.PL_PASSWORD;
    if (!email || !password) {
      throw new Error(
        "Session expirée et PL_EMAIL / PL_PASSWORD absents. Lance `npm run login` pour te reconnecter."
      );
    }
    log("connexion…");
    await this.page.goto(absUrl(this.cfg, loginPath), { waitUntil: "domcontentloaded" });
    await this.page.fill(selectors.email, email);
    await this.page.fill(selectors.password, password);
    await Promise.all([
      this.page.waitForLoadState("networkidle").catch(() => {}),
      this.page.click(selectors.submit),
    ]);
    try {
      await this.page.waitForSelector(selectors.loggedInMarker, { timeout: 20000 });
    } catch {
      throw new Error(
        "Connexion non confirmée (captcha, double authentification ou sélecteurs à ajuster). " +
          "Lance `npm run login` pour te connecter à la main une fois : la session sera réutilisée."
      );
    }
    this.loggedIn = true;
    log("connecté");
  }

  async authHeaders() {
    const key = this.cfg.auth?.bearerFromLocalStorage;
    if (!key) return {};
    const raw = await this.page.evaluate((k) => localStorage.getItem(k), key);
    if (!raw) return {};
    let token = raw;
    try {
      const parsed = JSON.parse(raw);
      token = typeof parsed === "string" ? parsed : parsed.token || parsed.access_token || raw;
    } catch {}
    return { Authorization: `Bearer ${token}` };
  }

  /** GET JSON sur un endpoint interne avec les cookies de session. */
  apiGet(path) {
    return this.run(async () => {
      await this.ensureLoggedIn();
      const doGet = async () =>
        this.context.request.get(absUrl(this.cfg, path), {
          headers: { Accept: "application/json", ...(await this.authHeaders()) },
        });
      let res = await doGet();
      if (res.status() === 401 || res.status() === 403) {
        await this.ensureLoggedIn({ force: true });
        res = await doGet();
      }
      if (!res.ok()) throw new Error(`HTTP ${res.status()} sur ${path}`);
      const type = res.headers()["content-type"] || "";
      if (!type.includes("json")) {
        throw new Error(`${path} ne renvoie pas du JSON (${type}). Vérifie apiPath ou passe mode:"dom".`);
      }
      return res.json();
    });
  }

  /** Lit un tableau HTML : renvoie une liste d'objets {entête: valeur, _lien}. */
  domTable(pagePath, dom) {
    return this.run(async () => {
      await this.ensureLoggedIn();
      await this.page.goto(absUrl(this.cfg, pagePath), { waitUntil: "networkidle" });
      await this.page.waitForSelector(dom.row, { timeout: 15000 });
      return this.page.evaluate(({ row, header, detailLink }) => {
        const heads = [...document.querySelectorAll(header)].map((h, i) =>
          (h.innerText || "").trim() || `col${i + 1}`
        );
        return [...document.querySelectorAll(row)].map((tr) => {
          const cells = [...tr.querySelectorAll("td, [role=cell]")];
          const o = {};
          cells.forEach((c, i) => (o[heads[i] || `col${i + 1}`] = (c.innerText || "").trim()));
          const a = tr.querySelector(detailLink);
          if (a) o._lien = a.href;
          return o;
        });
      }, dom);
    });
  }

  /** Texte visible d'une page (fallback universel). */
  pageText(pagePath, maxChars = 20000) {
    return this.run(async () => {
      await this.ensureLoggedIn();
      await this.page.goto(absUrl(this.cfg, pagePath), { waitUntil: "networkidle" });
      const text = await this.page.evaluate(() => document.body.innerText);
      return { url: this.page.url(), text: text.slice(0, maxChars) };
    });
  }
}
