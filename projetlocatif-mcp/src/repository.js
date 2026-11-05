// Accès "métier" aux ressources (biens, prospects) quel que soit le mode (api / dom).
import { extractItems, normalize } from "./normalize.js";

const CACHE_TTL_MS = Number(process.env.PL_CACHE_TTL_MS ?? 5 * 60 * 1000);

export class Repository {
  constructor(session) {
    this.session = session;
    this.cache = new Map();
  }

  resource(name) {
    const r = this.session.cfg.resources?.[name];
    if (!r) throw new Error(`Ressource "${name}" absente de config.json`);
    return r;
  }

  async list(name, { refresh = false, filters = {} } = {}) {
    // Le cache ne s'applique qu'aux listes complètes (sans filtre serveur).
    const hasServerFilters = Object.keys(filters).length > 0;
    const hit = this.cache.get(name);
    if (!refresh && !hasServerFilters && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.items;

    const r = this.resource(name);
    let items;
    if (r.mode === "dom") {
      items = await this.session.domTable(r.pagePath, r.dom);
    } else if (r.mode === "search") {
      // Liste Laravel paginée : POST /…/search, on parcourt les pages.
      const maxPages = Number(process.env.PL_MAX_PAGES ?? 20);
      items = [];
      let page = 1;
      while (page <= maxPages) {
        const body = { ...(r.defaultFilters || {}), ...filters, page };
        const payload = await this.session.apiPost(r.searchPath, body);
        const batch = extractItems(payload, r.itemsPath);
        items.push(...batch.map((raw) => normalize(raw, r.fieldMap)));
        const last = payload?.last_page ?? payload?.meta?.last_page;
        const cur = payload?.current_page ?? payload?.meta?.current_page ?? page;
        if (!batch.length || (last && cur >= last) || batch.length === 0) break;
        page = cur + 1;
      }
    } else {
      const payload = await this.session.apiGet(r.apiPath);
      items = extractItems(payload, r.itemsPath).map((raw) => normalize(raw, r.fieldMap));
    }
    if (!hasServerFilters) this.cache.set(name, { at: Date.now(), items });
    return items;
  }

  async get(name, id) {
    const r = this.resource(name);
    if (r.mode !== "dom" && r.detailApiPath) {
      const raw = await this.session.apiGet(r.detailApiPath.replace("{id}", encodeURIComponent(id)));
      // On renvoie le normalisé + le brut complet (toutes les infos du bien/prospect).
      const obj = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
      return { ...normalize(obj, r.fieldMap), _brut: obj };
    }
    const p = (r.detailPagePath || "").replace("{id}", encodeURIComponent(id));
    return this.session.pageText(p);
  }
}
