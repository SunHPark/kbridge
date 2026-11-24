// Vercel serverless function: GET /api/flight?ident=KE82&date=2026-12-14&dir=arr
const { lookupFlight } = require("../lib/aero");

module.exports = async (req, res) => {
  const allow = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).end(JSON.stringify({ error: "method" })); return; }
  try {
    const { ident, date, dir } = req.query || {};
    const out = await lookupFlight({ ident, date, dir, key: process.env.AEROAPI_KEY });
    res.setHeader("Cache-Control", out.flight.source === "live" ? "public, s-maxage=300, stale-while-revalidate=600" : "public, s-maxage=43200");
    res.status(200).end(JSON.stringify(out));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(e.status || 500).end(JSON.stringify({ error: e.code || "server_error" }));
  }
};
