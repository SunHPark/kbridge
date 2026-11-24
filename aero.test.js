const assert = require("assert");
const { lookupFlight } = require("../lib/aero");
const mk = (status, body) => async (url) => ({ status, ok: status < 300, json: async () => body, _url: url });
(async () => {
  const now = Date.parse("2026-12-13T03:00:00Z");
  // live: KE82 JFK->ICN landing 2026-12-14 05:10 KST (= 12-13 20:10Z)
  let seen = [];
  const live = { flights: [{ ident: "KAL82", ident_iata: "KE82", operator_iata: "KE", flight_number: "82", status: "Scheduled",
    origin: { code_iata: "JFK", name: "John F Kennedy Intl" }, destination: { code_iata: "ICN", name: "Incheon Int'l" },
    scheduled_out: "2026-12-13T05:00:00Z", scheduled_in: "2026-12-13T20:10:00Z", estimated_in: "2026-12-13T20:25:00Z", terminal_destination: "2", baggage_claim: "14" }] };
  let r = await lookupFlight({ ident: "ke 82", date: "2026-12-14", dir: "arr", key: "x", now, fetchImpl: async u => { seen.push(u); return mk(200, live)(); } });
  assert.equal(r.flight.source, "live"); assert.equal(r.flight.dest.iata, "ICN"); assert.equal(r.flight.est_in, "2026-12-13T20:25:00Z");
  assert.ok(seen[0].includes("/flights/KE82?ident_type=designator"), seen[0]);
  // far future -> schedules
  seen = [];
  const sch = { scheduled: [{ ident: "KAL711", ident_iata: "KE711", origin: "RKPK", origin_iata: "PUS", destination: "RJAA", destination_iata: "NRT", scheduled_out: "2027-01-15T03:30:00Z", scheduled_in: "2027-01-15T05:40:00Z" }] };
  r = await lookupFlight({ ident: "KE711", date: "2027-01-15", dir: "dep", key: "x", now, fetchImpl: async u => { seen.push(u); return mk(200, sch)(); } });
  assert.equal(r.flight.source, "schedule"); assert.equal(r.flight.origin.iata, "PUS"); assert.equal(seen.length, 1); assert.ok(seen[0].includes("/schedules/") && seen[0].includes("airline=KE&flight_number=711"), seen[0]);
  // errors
  await assert.rejects(lookupFlight({ ident: "KE82", date: "2026-12-14", key: "" }), e => e.code === "not_configured");
  await assert.rejects(lookupFlight({ ident: "??", date: "2026-12-14", key: "x" }), e => e.code === "bad_ident");
  await assert.rejects(lookupFlight({ ident: "KE82", date: "2026-12-14", key: "x", now, fetchImpl: mk(200, { flights: [], scheduled: [] }) }), e => e.code === "not_found");
  await assert.rejects(lookupFlight({ ident: "KE82", date: "2026-12-14", key: "x", now, fetchImpl: mk(401, {}) }), e => e.code === "api_auth");
  console.log("all tests passed");
})().catch(e => { console.error(e); process.exit(1); });
