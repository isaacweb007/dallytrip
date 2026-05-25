// =========================================================
// GET /api/tp/search?type=flights|hotels|cars|activities&...
//
// Unified Travelpayouts proxy — dispatches to the right backend
// and returns a normalized shape so the frontend can stay simple.
//
// Examples:
//   /api/tp/search?type=flights&from=ICN&to=DAD&date=2026-07-15
//   /api/tp/search?type=hotels&city=Da+Nang&checkin=2026-07-15&checkout=2026-07-17
//   /api/tp/search?type=cars&city=Da+Nang&pickup=2026-07-15&dropoff=2026-07-17
//   /api/tp/search?type=activities&city=Da+Nang
// =========================================================
import { json, corsPreflight } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const type = (url.searchParams.get('type') || 'flights').toLowerCase();

  // Forward to the dedicated endpoint so we don't duplicate logic
  const allowed = { flights: 1, hotels: 1, cars: 1, activities: 1 };
  if (!allowed[type]) {
    return json({ error: 'Unknown type', allowed: Object.keys(allowed) }, 400);
  }

  // Strip "type" then forward the rest of the query string
  const forwardParams = new URLSearchParams(url.searchParams);
  forwardParams.delete('type');

  const proxyUrl = new URL(`/api/${type}/search`, url.origin);
  proxyUrl.search = forwardParams.toString();

  const r = await fetch(proxyUrl.toString(), {
    headers: { 'X-DallyTrip-Proxy': '1' },
  });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'X-DallyTrip-Type': type,
    },
  });
}
