// Transforme les objets bruts renvoyés par la plateforme en objets normalisés
// (champs FR stables), puis applique les filtres côté connecteur.

export function getPath(obj, dotted) {
  if (obj == null || !dotted) return undefined;
  return dotted.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function extractItems(payload, itemsPath) {
  const v = itemsPath ? getPath(payload, itemsPath) : payload;
  if (Array.isArray(v)) return v;
  if (Array.isArray(payload)) return payload;
  // Formats courants : {items:[]}, {results:[]}, {data:{items:[]}}, hydra:member
  for (const k of ["items", "results", "data", "hydra:member", "rows", "records"]) {
    const c = getPath(payload, k);
    if (Array.isArray(c)) return c;
    if (c && typeof c === "object") {
      const inner = extractItems(c, null);
      if (inner.length) return inner;
    }
  }
  return [];
}

export function normalize(raw, fieldMap) {
  if (!fieldMap || !Object.keys(fieldMap).length) return raw;
  const out = {};
  for (const [k, src] of Object.entries(fieldMap)) {
    const v = getPath(raw, src);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export function toNumber(v) {
  if (v == null || v === "") return NaN;
  if (typeof v === "number") return v;
  // "185 000 €", "5,8 %", "1 200,50"
  const s = String(v).replace(/[\s €%]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Filtres génériques : texte, min/max numériques sur champs normalisés. */
export function applyFilters(items, f = {}) {
  let res = items;
  if (f.query) {
    const q = norm(f.query);
    res = res.filter((it) => norm(JSON.stringify(it)).includes(q));
  }
  if (f.ville) {
    const v = norm(f.ville);
    res = res.filter((it) => norm(it.ville).includes(v) || norm(it.codePostal).startsWith(v));
  }
  if (f.statut) {
    const s = norm(f.statut);
    res = res.filter((it) => norm(it.statut ?? it.etape).includes(s));
  }
  const num = (field, min, max) => {
    if (min != null) res = res.filter((it) => toNumber(it[field]) >= min);
    if (max != null) res = res.filter((it) => toNumber(it[field]) <= max);
  };
  num("prix", f.prix_min, f.prix_max);
  num("rendement", f.rendement_min, null);
  num("surface", f.surface_min, null);

  if (f.tri) {
    const [field, dir] = f.tri.split(":");
    const sign = dir === "desc" ? -1 : 1;
    res = [...res].sort((a, b) => {
      const na = toNumber(a[field]);
      const nb = toNumber(b[field]);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return (na - nb) * sign;
      return String(a[field] ?? "").localeCompare(String(b[field] ?? "")) * sign;
    });
  }
  return res.slice(0, f.limit ?? 50);
}

export function toCsv(items) {
  if (!items.length) return "";
  const cols = [...new Set(items.flatMap((i) => Object.keys(i)))];
  const esc = (v) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(";"), ...items.map((i) => cols.map((c) => esc(i[c])).join(";"))].join("\n");
}
