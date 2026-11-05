// Fausse plateforme ProjetLocatif pour les tests (login cookie + API JSON + tableau HTML).
import http from "node:http";

const BIENS = [
  { id: 1, title: "T2 hyper-centre", city: "Lille", zipCode: "59000", surface: 42, price: 145000, grossYield: 7.4, status: "disponible" },
  { id: 2, title: "Immeuble 4 lots", city: "Roubaix", zipCode: "59100", surface: 160, price: 320000, grossYield: 9.1, status: "disponible" },
  { id: 3, title: "Studio étudiant", city: "Lyon", zipCode: "69007", surface: 19, price: 98000, grossYield: 5.2, status: "vendu" },
];
const DOSSIERS = [
  { id: "D1", client: { fullName: "Jean Test" }, property: { title: "T2 hyper-centre", city: "Lille" }, step: "compromis", budget: 180000, commission: 9000 },
];

export function start(port = 0) {
  const srv = http.createServer((req, res) => {
    const authed = (req.headers.cookie || "").includes("sid=ok");
    const url = new URL(req.url, "http://x");
    const html = (b) => { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(`<html><body>${b}</body></html>`); };
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
      if (url.pathname === "/api/biens") return json({ data: BIENS, total: BIENS.length });
      const m = url.pathname.match(/^\/api\/biens\/(\d+)$/);
      if (m) return json({ data: { ...BIENS.find((b) => b.id == m[1]), notaire: "Me X", dpe: "C" } });
      if (url.pathname === "/api/dossiers") return json({ data: DOSSIERS });
      return json({ error: "nf" }, 404);
    }
    if (!authed) return html(`<a href="/login">Se connecter</a>`);
    if (url.pathname === "/dossiers-table") return html(`<a href="/logout">Déconnexion</a><table><thead><tr><th>Client</th><th>Étape</th></tr></thead><tbody><tr><td>Jean Test</td><td>compromis</td></tr></tbody></table>`);
    return html(`<a href="/logout">Déconnexion</a><h1>Espace conseiller</h1><p>Bienvenue Nicolas</p>`);
  });
  return new Promise((r) => srv.listen(port, "127.0.0.1", () => r(srv)));
}
