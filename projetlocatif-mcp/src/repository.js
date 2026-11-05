// Accès "métier" aux ressources (biens, dossiers) quel que soit le mode (api / dom).
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

  async list(name, { refresh = false } = {}) {
    const hit = this.cache.get(name);
    if (!refresh && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.items;

    const r = this.resource(name);
    let items;
    if (r.mode === "dom") {
      items = await this.session.domTable(r.pagePath, r.dom);
    } else {
      const payload = await this.session.apiGet(r.apiPath);
      items = extractItems(payload, r.itemsPath).map((raw) => normalize(raw, r.fieldMap));
    }
    this.cache.set(name, { at: Date.now(), items });
    return items;
  }

  async get(name, id) {
    const r = this.resource(name);
    if (r.mode !== "dom" && r.detailApiPath) {
      const raw = await this.session.apiGet(r.detailApiPath.replace("{id}", encodeURIComponent(id)));
      // On renvoie le normalisé + le brut complet (toutes les infos du bien/dossier).
      const obj = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
      return { ...normalize(obj, r.fieldMap), _brut: obj };
    }
    const p = (r.detailPagePath || "").replace("{id}", encodeURIComponent(id));
    return this.session.pageText(p);
  }
}
