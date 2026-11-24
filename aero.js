// FlightAware AeroAPI v4 lookup — server-side only (API key never reaches the browser).
const BASE = "https://aeroapi.flightaware.com/aeroapi";
const H = 3600e3, D = 24 * H;

class HttpErr extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }

const norm = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const kstDate = iso => iso ? new Date(new Date(iso).getTime() + 9 * H).toISOString().slice(0, 10) : null;

function pickAirport(a, iata, name) {
  if (a && typeof a === "object") return { iata: a.code_iata || null, icao: a.code_icao || a.code || null, name: a.name || null, city: a.city || null, tz: a.timezone || null };
  return { iata: iata || null, icao: a || null, name: name || null, city: null, tz: null };
}

function mapLive(f) {
  return {
    source: "live",
    ident: f.ident_iata || f.ident, ident_icao: f.ident_icao || f.ident,
    airline: f.operator_iata || f.operator || null, number: f.flight_number || null,
    origin: pickAirport(f.origin), dest: pickAirport(f.destination),
    status: f.status || null, cancelled: !!f.cancelled, diverted: !!f.diverted, progress: f.progress_percent ?? null,
    sched_out: f.scheduled_out || null, est_out: f.estimated_out || null, act_out: f.actual_out || null,
    sched_in: f.scheduled_in || null, est_in: f.estimated_in || null, act_in: f.actual_in || null,
    dep_delay: f.departure_delay ?? null, arr_delay: f.arrival_delay ?? null,
    terminal_out: f.terminal_origin || null, gate_out: f.gate_origin || null,
    terminal_in: f.terminal_destination || null, gate_in: f.gate_destination || null, baggage: f.baggage_claim || null,
    aircraft: f.aircraft_type || null
  };
}

function mapSched(s) {
  return {
    source: "schedule",
    ident: s.ident_iata || s.ident, ident_icao: s.ident_icao || s.ident,
    airline: null, number: null,
    origin: pickAirport(s.origin_icao || s.origin, s.origin_iata), dest: pickAirport(s.destination_icao || s.destination, s.destination_iata),
    status: "Scheduled", cancelled: false, diverted: false, progress: null,
    sched_out: s.scheduled_out || null, est_out: null, act_out: null,
    sched_in: s.scheduled_in || null, est_in: null, act_in: null,
    dep_delay: null, arr_delay: null, terminal_out: null, gate_out: null, terminal_in: null, gate_in: null, baggage: null,
    aircraft: s.aircraft_type || null
  };
}

async function call(path, key, fetchImpl) {
  const r = await fetchImpl(BASE + path, { headers: { "x-apikey": key, accept: "application/json" } });
  if (r.status === 401 || r.status === 403) throw new HttpErr(502, "api_auth");
  if (r.status === 404) return null;
  if (r.status === 429) throw new HttpErr(429, "rate_limited");
  if (!r.ok) throw new HttpErr(502, "api_error_" + r.status);
  return r.json();
}

/**
 * ident: "KE82" / "KE 082" / "KAL82"; date: YYYY-MM-DD (Korea time); dir: "arr" (landing in Korea that day) | "dep" (taking off that day)
 */
async function lookupFlight({ ident, date, dir = "arr", key, now = Date.now(), fetchImpl = fetch }) {
  if (!key) throw new HttpErr(503, "not_configured");
  ident = norm(ident);
  const m = ident.match(/^([A-Z0-9]{2,3}?)(\d{1,4})([A-Z]?)$/);
  if (!m) throw new HttpErr(400, "bad_ident");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) throw new HttpErr(400, "bad_date");
  if (dir !== "arr" && dir !== "dep") throw new HttpErr(400, "bad_dir");

  const dayStart = new Date(date + "T00:00:00+09:00").getTime();
  // Arrivals on day D can depart the previous day; departures on day D can land the next day.
  const start = dir === "arr" ? dayStart - 20 * H : dayStart;
  const end = dir === "arr" ? dayStart + D : dayStart + D + 20 * H;
  const iso = t => new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z");
  const inDay = f => kstDate(dir === "arr" ? (f.est_in || f.sched_in) : (f.est_out || f.sched_out)) === date;

  let flights = [];
  const liveOk = start >= now - 10 * D + H && end <= now + 2 * D - H;
  if (liveOk) {
    const j = await call(`/flights/${encodeURIComponent(ident)}?ident_type=designator&start=${iso(start)}&end=${iso(end)}`, key, fetchImpl);
    flights = ((j && j.flights) || []).map(mapLive);
  }
  if (!flights.filter(inDay).length) {
    const airline = m[1], num = String(parseInt(m[2], 10));
    const j = await call(`/schedules/${iso(start)}/${iso(end)}?airline=${encodeURIComponent(airline)}&flight_number=${num}&max_pages=1`, key, fetchImpl);
    const sch = ((j && j.scheduled) || []).map(mapSched);
    flights = flights.concat(sch);
  }
  const hit = flights.filter(inDay);
  if (!hit.length) throw new HttpErr(404, "not_found");
  // Prefer live over schedule, then earliest.
  hit.sort((a, b) => (a.source === b.source ? 0 : a.source === "live" ? -1 : 1) || String(a.sched_out).localeCompare(String(b.sched_out)));
  return { flight: hit[0], others: hit.length - 1, fetched_at: new Date(now).toISOString() };
}

module.exports = { lookupFlight, HttpErr };
