// =========================================================
// GET /api/flights/search?from=ICN&to=DAD&date=2026-07-15&adults=2
//
// Uses Travelpayouts (Aviasales) — gives commission per booking.
// Required env: TRAVELPAYOUTS_TOKEN, TRAVELPAYOUTS_MARKER
// Docs: https://support.travelpayouts.com/hc/en-us/articles/360023115774
// =========================================================
import { json, corsPreflight, withMarker, fallback } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const from = (url.searchParams.get('from') || 'ICN').toUpperCase();
  const to = (url.searchParams.get('to') || 'DAD').toUpperCase();
  const date = url.searchParams.get('date') || ''; // YYYY-MM-DD
  const adults = url.searchParams.get('adults') || '1';

  const TOKEN = env.TRAVELPAYOUTS_TOKEN;
  const MARKER = env.TRAVELPAYOUTS_MARKER || '';

  if (!TOKEN) return fallback('flights', { from, to, date, adults });

  try {
    // Travelpayouts cheapest-prices-by-route
    const api = new URL('https://api.travelpayouts.com/v2/prices/latest');
    api.searchParams.set('origin', from);
    api.searchParams.set('destination', to);
    api.searchParams.set('currency', 'usd');
    api.searchParams.set('limit', '20');
    api.searchParams.set('one_way', 'true');
    if (date) {
      api.searchParams.set('beginning_of_period', date);
      api.searchParams.set('period_type', 'month');
    }

    const r = await fetch(api.toString(), {
      headers: { 'X-Access-Token': TOKEN },
    });
    const data = await r.json();

    const results = (data.data || []).slice(0, 12).map((o, i) => ({
      id: `tpf_${i}_${o.airline}${o.flight_number}`,
      from: o.origin,
      to: o.destination,
      depart: o.depart_date,
      return: o.return_date || null,
      airline: o.airline,
      flightNumber: o.airline + o.flight_number,
      stops: o.number_of_changes ?? 0,
      price: Math.round(o.value),
      currency: 'USD',
      // Affiliate deeplink — Aviasales search with our marker, commission tracked
      bookingUrl: withMarker(
        `https://www.aviasales.com/search/${from}${(date || '').replace(/-/g, '').slice(2, 8)}${to}${adults}`,
        MARKER
      ),
    }));

    return json({ provider: 'travelpayouts', count: results.length, results });
  } catch (e) {
    return json(
      { provider: 'error', message: e.message, results: [] },
      502
    );
  }
}
