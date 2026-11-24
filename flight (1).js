// Netlify function (served at /api/flight via netlify.toml redirect)
const { lookupFlight } = require("../../lib/aero");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*", "Content-Type": "application/json; charset=utf-8" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ error: "method" }) };
  try {
    const { ident, date, dir } = event.queryStringParameters || {};
    const out = await lookupFlight({ ident, date, dir, key: process.env.AEROAPI_KEY });
    headers["Cache-Control"] = out.flight.source === "live" ? "public, max-age=0, s-maxage=300" : "public, max-age=0, s-maxage=43200";
    return { statusCode: 200, headers, body: JSON.stringify(out) };
  } catch (e) {
    headers["Cache-Control"] = "no-store";
    return { statusCode: e.status || 500, headers, body: JSON.stringify({ error: e.code || "server_error" }) };
  }
};
