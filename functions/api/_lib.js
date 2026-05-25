// =========================================================
// Shared helpers for DallyTrip Pages Functions
// =========================================================

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
  });

export const corsPreflight = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });

// Default marker (Travelpayouts) — overridable via env TRAVELPAYOUTS_MARKER
export const DEFAULT_MARKER = '532633';

// Append affiliate marker to any partner URL
export const withMarker = (url, marker) => {
  const m = marker || DEFAULT_MARKER;
  const u = new URL(url);
  if (!u.searchParams.has('marker')) u.searchParams.set('marker', m);
  return u.toString();
};

// Standard "no key configured" fallback so the frontend still works
export const fallback = (category, params) =>
  json(
    {
      provider: 'mock',
      note:
        'No API key configured yet. Add TRAVELPAYOUTS_TOKEN (+ TRAVELPAYOUTS_MARKER) ' +
        'to Cloudflare Pages env to enable live data.',
      params,
      results: [],
    },
    503
  );
