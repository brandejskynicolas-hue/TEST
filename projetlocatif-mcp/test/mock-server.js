// Fausse plateforme ProjetLocatif (Laravel-like) pour les tests :
// login cookie + CSRF, POST /api/*/search paginé, GET détail, tableau HTML.
import http from "node:http";

const PROPERTIES = [
  { id: 1, type: "appartement", ville: "Lille", code_postal: "59000", departement: "59", surface: 42, prix: 145000, rentabilite_brute: 7.4, rentabilite_nette: 5.9, status: "disponible" },
  { id: 2, type: "immeuble", ville: "Roubaix", code_postal: "59100", departement: "59", surface: 160, prix: 320000, rentabilite_brute: 9.1, rentabilite_nette: 7.2, status: "disponible" },
  { id: 3, type: "studio", ville: "Lyon", code_postal: "69007", departement: "69", surface: 19, prix: 98000, rentabilite_brute: 5.2, rentabilite_nette: 4.1, status: "vendu" },
];
const PROSPECTS = [
  { id: 10, nom_complet: "Jean Test", status: "en_cours", ville_code_postal: "Lille 59000", created_at: "2026-01-02" },
  { id: 11, nom_complet: "Marie Invest", status: "en_attente", ville_code_postal: "Paris 75011", created_at: "2026-02-15" },
];

const page = (arr, p = 1, per = 2) => {
  const start = (p - 1) * per;
  const data = arr.slice(start, start + per);
  return { data, current_page: p, last_page: Math.max(1, Math.ceil(arr.length / per)), total: arr.length };
};

export function start(port = 0) {
  const srv = http.createServer((req, res) => {
    const authed = (req.headers.cookie || "").includes("sid=ok");
    const url = new URL(req.url, "http://x");
    const html = (b) => { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(`<html><head><meta name="csrf-token" content="tok123"></head><body>${b}</body></html>`); };
    const json = (o, s = 200) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };

    if (url.pathname === "/login" && req.method === "POST") {
      let body = ""; req.on("data", (c) => (body += c));
      req.on("end", () => {
        const p = new URLSearchParams(body);
        if (p.get("email") === "nico@test.fr" && p.get("password") === "secret") {
          res.writeHead(302, { "set-cookie": "sid=ok; Path=/", location: "/" }); res.end();
        } else { res.writeHead(302, { location: "/login" }); res.end(); }
      });
      return;
    }
    if (url.pathname === "/login") return html(`<form method="post" action="/login"><input type="email" name="email"><input type="password" name="password"><button type="submit">OK</button></form>`);

    if (url.pathname.startsWith("/api/")) {
      if (!authed) return json({ error: "unauthorized" }, 401);
      if (req.method === "POST") {
        let body = ""; req.on("data", (c) => (body += c));
        return req.on("end", () => {
          const f = body ? JSON.parse(body) : {};
          if (url.pathname === "/api/properties/search") {
            let items = PROPERTIES;
            if (f.status?.length) items = items.filter((x) => f.status.includes(x.status));
            return json(page(items, f.page || 1));
          }
          if (url.pathname === "/api/prospects/search") return json(page(PROSPECTS, f.page || 1));
          return json({ error: "nf" }, 404);
        });
      }
      let m;
      if ((m = url.pathname.match(/^\/api\/properties\/(\d+)$/)))
        return json({ data: { ...PROPERTIES.find((b) => b.id == m[1]), dpe: "C", notaire: "Me X" } });
      if ((m = url.pathname.match(/^\/api\/prospects\/(\d+)$/)))
        return json({ data: { ...PROSPECTS.find((b) => b.id == m[1]), telephone: "0600000000" } });
      return json({ error: "nf" }, 404);
    }

    if (!authed) return html(`<a href="/login">Se connecter</a>`);
    return html(`<a href="/logout">Déconnexion</a><h1>Espace conseiller</h1><p>Bienvenue Nicolas</p>`);
  });
  return new Promise((r) => srv.listen(port, "127.0.0.1", () => r(srv)));
}
