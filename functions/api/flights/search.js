// =========================================================
// GET /api/flights/search?from=ICN&to=DAD&date=2026-07-15&adults=2
//
// Uses Travelpayouts (Aviasales) — commission tracked per redirect.
// Required env: TRAVELPAYOUTS_TOKEN, TRAVELPAYOUTS_MARKER
// Docs: https://support.travelpayouts.com/hc/en-us/articles/360023115774
// =========================================================
import { json, corsPreflight, withMarker, fallback } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const from = (url.searchParams.get('from') || 'ICN').toUpperCase();
  const to = (url.searchParams.get('to') || 'DAD').toUpperCase();
  const date = url.searchParams.get('date') || '';
  const adults = url.searchParams.get('adults') || '1';

  const TOKEN = env.TRAVELPAYOUTS_TOKEN;
  const MARKER = env.TRAVELPAYOUTS_MARKER || env.TRAVELPAYOUTS_TRS || '';

  if (!TOKEN) return fallback('flights', { from, to, date, adults });

  try {
    // v1 prices/cheap — returns clean { airline, flight_number, ... }
    const api = new URL('https://api.travelpayouts.com/v1/prices/cheap');
    api.searchParams.set('origin', from);
    api.searchParams.set('destination', to);
    api.searchParams.set('currency', 'usd');
    if (date) api.searchParams.set('depart_date', date.slice(0, 7)); // YYYY-MM
    api.searchParams.set('token', TOKEN);

    const r = await fetch(api.toString());
    const data = await r.json();

    const offersMap = (data && data.data && data.data[to]) || {};
    const results = Object.entries(offersMap).slice(0, 12).map(([key, o]) => ({
      id: `tpf_${key}_${o.airline}${o.flight_number}`,
      from,
      to,
      depart: o.departure_at?.slice(0, 10),
      return: o.return_at?.slice(0, 10) || null,
      airline: o.airline || 'Multiple',
      flightNumber: o.airline && o.flight_number ? `${o.airline}${o.flight_number}` : '',
      stops: o.transfers ?? 0,
      price: Math.round(o.price),
      currency: 'USD',
      expiresAt: o.expires_at,
      // Affiliate deeplink — Aviasales search with our marker = commission tracked
      bookingUrl: withMarker(
        buildAviasalesUrl(from, to, date, adults),
        MARKER
      ),
    }));

    return json({
      provider: 'travelpayouts',
      currency: data.currency || 'USD',
      from, to,
      count: results.length,
      results,
    });
  } catch (e) {
    return json({ provider: 'error', message: e.message, results: [] }, 502);
  }
}

// Aviasales link format: /search/{from}{ddmm}{to}{ddmm-or-empty}{adults}
function buildAviasalesUrl(from, to, isoDate, adults) {
  let departCode = '';
  if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [, mm, dd] = isoDate.split('-');
    departCode = dd + mm;
  } else {
    // default: 1 month from today
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    departCode = dd + mm;
  }
  return `https://www.aviasales.com/search/${from}${departCode}${to}${adults}`;
}
