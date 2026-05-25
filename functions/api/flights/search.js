// =========================================================
// GET /api/flights/search
//   ?from=ICN&to=DAD&date=2026-07-15&adults=2&children=0&infants=0&cabin=economy
//
// Priority:
//   1. DUFFEL_API_KEY  → real-time Duffel flights (live inventory + booking)
//   2. TRAVELPAYOUTS_TOKEN → affiliate price calendar (redirect)
//   3. mock fallback
//
// Required env:
//   DUFFEL_API_KEY      — Duffel live token (duffel_live_... or duffel_test_...)
//   TRAVELPAYOUTS_TOKEN — Aviasales/TP affiliate token (fallback)
//   TRAVELPAYOUTS_MARKER — TP affiliate marker
// =========================================================
import { json, corsPreflight, withMarker, fallback } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const from    = (url.searchParams.get('from')     || 'ICN').toUpperCase();
  const to      = (url.searchParams.get('to')       || 'DAD').toUpperCase();
  const date    = url.searchParams.get('date')    || tomorrowISO(30);
  const adults  = parseInt(url.searchParams.get('adults')   || '1', 10);
  const children= parseInt(url.searchParams.get('children') || '0', 10);
  const infants = parseInt(url.searchParams.get('infants')  || '0', 10);
  const cabin   = url.searchParams.get('cabin')   || 'economy';

  // ── 1. Duffel (real-time) ─────────────────────────────
  if (env.DUFFEL_API_KEY) {
    return searchDuffel({ from, to, date, adults, children, infants, cabin, env });
  }

  // ── 2. Travelpayouts affiliate ────────────────────────
  if (env.TRAVELPAYOUTS_TOKEN) {
    return searchTravelpayouts({ from, to, date, adults, env });
  }

  // ── 3. Mock ───────────────────────────────────────────
  return fallback('flights', { from, to, date, adults });
}

// ─────────────────────────────────────────────────────────
// Duffel Integration
// Docs: https://duffel.com/docs/api/overview/request-and-response-bodies
// ─────────────────────────────────────────────────────────
async function searchDuffel({ from, to, date, adults, children, infants, cabin, env }) {
  const BASE = 'https://api.duffel.com';
  const headers = {
    'Authorization': `Bearer ${env.DUFFEL_API_KEY}`,
    'Content-Type':  'application/json',
    'Duffel-Version': 'v2',
    'Accept':         'application/json',
  };

  try {
    // Step 1 — Create offer request
    const passengers = buildPassengers(adults, children, infants);
    const offerReqBody = {
      data: {
        slices: [{ origin: from, destination: to, departure_date: date }],
        passengers,
        cabin_class: cabin,
        return_offers: false,
      },
    };

    const reqRes = await fetch(`${BASE}/air/offer_requests`, {
      method: 'POST',
      headers,
      body: JSON.stringify(offerReqBody),
    });

    if (!reqRes.ok) {
      const err = await reqRes.json().catch(() => ({}));
      return json({ provider: 'duffel', error: err?.errors?.[0]?.message || reqRes.statusText, results: [] }, reqRes.status);
    }

    const reqData = await reqRes.json();
    const offerRequestId = reqData?.data?.id;
    if (!offerRequestId) throw new Error('No offer_request_id returned from Duffel');

    // Step 2 — Fetch offers (paginated, take top 15)
    const offersRes = await fetch(
      `${BASE}/air/offers?offer_request_id=${offerRequestId}&limit=15&sort=total_amount`,
      { headers }
    );

    if (!offersRes.ok) {
      const err = await offersRes.json().catch(() => ({}));
      return json({ provider: 'duffel', error: err?.errors?.[0]?.message || offersRes.statusText, results: [] }, offersRes.status);
    }

    const offersData = await offersRes.json();
    const offers = offersData?.data || [];

    const results = offers.map(o => {
      const slice   = o.slices?.[0];
      const seg     = slice?.segments?.[0];
      const lastSeg = slice?.segments?.[slice.segments.length - 1];
      const stops   = Math.max(0, (slice?.segments?.length || 1) - 1);

      return {
        id:           o.id,
        provider:     'duffel',
        from:         slice?.origin?.iata_code || from,
        to:           slice?.destination?.iata_code || to,
        depart:       seg?.departing_at?.slice(0, 10),
        departTime:   seg?.departing_at?.slice(11, 16),
        arriveTime:   lastSeg?.arriving_at?.slice(11, 16),
        airline:      seg?.marketing_carrier?.iata_code || '',
        airlineName:  seg?.marketing_carrier?.name || '',
        airlineLogo:  seg?.marketing_carrier?.logo_symbol_url || null,
        flightNumber: seg ? `${seg.marketing_carrier?.iata_code}${seg.marketing_carrier_flight_number}` : '',
        stops,
        duration:     slice?.duration || null,      // ISO 8601 e.g. "PT2H30M"
        price:        parseFloat(o.total_amount),
        currency:     o.total_currency,
        baggageInfo:  formatBaggage(o),
        expiresAt:    o.expires_at,
        offerId:      o.id,                         // used for booking step
        // booking handled by /api/flights/book?offerId=...
        bookingUrl:   null,                         // in-app booking, no redirect needed
      };
    });

    return json({
      provider: 'duffel',
      from, to, date,
      count: results.length,
      offerRequestId,
      results,
    });
  } catch (e) {
    return json({ provider: 'duffel', error: e.message, results: [] }, 502);
  }
}

// ─────────────────────────────────────────────────────────
// Travelpayouts / Aviasales (affiliate fallback)
// ─────────────────────────────────────────────────────────
async function searchTravelpayouts({ from, to, date, adults, env }) {
  const TOKEN  = env.TRAVELPAYOUTS_TOKEN;
  const MARKER = env.TRAVELPAYOUTS_MARKER || env.TRAVELPAYOUTS_TRS || '';

  try {
    const api = new URL('https://api.travelpayouts.com/v1/prices/cheap');
    api.searchParams.set('origin', from);
    api.searchParams.set('destination', to);
    api.searchParams.set('currency', 'usd');
    if (date) api.searchParams.set('depart_date', date.slice(0, 7));
    api.searchParams.set('token', TOKEN);

    const r = await fetch(api.toString());
    const data = await r.json();

    const offersMap = data?.data?.[to] || {};
    const results = Object.entries(offersMap).slice(0, 12).map(([key, o]) => ({
      id: `tpf_${key}_${o.airline}${o.flight_number}`,
      provider: 'travelpayouts',
      from, to,
      depart:       o.departure_at?.slice(0, 10),
      departTime:   o.departure_at?.slice(11, 16) || '',
      arriveTime:   '',
      airline:      o.airline || 'Multiple',
      airlineName:  o.airline || '',
      airlineLogo:  null,
      flightNumber: o.airline && o.flight_number ? `${o.airline}${o.flight_number}` : '',
      stops:        o.transfers ?? 0,
      duration:     null,
      price:        Math.round(o.price),
      currency:     'USD',
      baggageInfo:  null,
      expiresAt:    o.expires_at,
      offerId:      null,
      bookingUrl:   withMarker(buildAviasalesUrl(from, to, date, String(adults)), MARKER),
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

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function buildPassengers(adults, children, infants) {
  const pax = [];
  for (let i = 0; i < adults;   i++) pax.push({ type: 'adult' });
  for (let i = 0; i < children; i++) pax.push({ type: 'child' });
  for (let i = 0; i < infants;  i++) pax.push({ type: 'infant_without_seat' });
  return pax;
}

function formatBaggage(offer) {
  try {
    const cond = offer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.baggages;
    if (!cond || !cond.length) return null;
    const checked = cond.find(b => b.type === 'checked');
    const carry   = cond.find(b => b.type === 'carry_on');
    const parts   = [];
    if (carry   && carry.quantity   > 0) parts.push(`기내 수하물 ${carry.quantity}개`);
    if (checked && checked.quantity > 0) parts.push(`위탁 수하물 ${checked.quantity}개`);
    return parts.join(', ') || null;
  } catch { return null; }
}

function tomorrowISO(plusDays = 1) {
  const d = new Date();
  d.setDate(d.getDate() + plusDays);
  return d.toISOString().slice(0, 10);
}

function buildAviasalesUrl(from, to, isoDate, adults) {
  let departCode = '';
  if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [, mm, dd] = isoDate.split('-');
    departCode = dd + mm;
  } else {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    departCode = dd + mm;
  }
  return `https://www.aviasales.com/search/${from}${departCode}${to}${adults}`;
}
