// =========================================================
// GET /api/hotels/search?city=Da+Nang&checkin=2026-07-15&checkout=2026-07-17&adults=2
//
// Hotellook (Travelpayouts). Uses the current `yasen.hotellook.com` host.
// Commission paid per stayed night.
// Required env: TRAVELPAYOUTS_TOKEN, TRAVELPAYOUTS_MARKER
// Docs: https://support.travelpayouts.com/hc/en-us/categories/200358578
// =========================================================
import { json, corsPreflight, withMarker, fallback } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const city = (url.searchParams.get('city') || 'Da Nang').trim();
  const checkin = url.searchParams.get('checkin') || defaultDate(0);
  const checkout = url.searchParams.get('checkout') || defaultDate(2);
  const adults = url.searchParams.get('adults') || '2';

  const TOKEN = env.TRAVELPAYOUTS_TOKEN;
  const MARKER = env.TRAVELPAYOUTS_MARKER || env.TRAVELPAYOUTS_TRS || '';

  if (!TOKEN) return fallback('hotels', { city, checkin, checkout, adults });

  try {
    // Step 1: lookup the location to get a stable locationId
    const lookup = new URL('https://engine.hotellook.com/api/v2/lookup.json');
    lookup.searchParams.set('query', city);
    lookup.searchParams.set('lang', 'en');
    lookup.searchParams.set('lookFor', 'both');
    lookup.searchParams.set('limit', '1');
    lookup.searchParams.set('token', TOKEN);
    const luRes = await fetch(lookup.toString());
    const luJson = await safeJson(luRes);
    const loc = luJson?.results?.locations?.[0];
    const locName = loc?.fullName || city;
    const locId = loc?.id;

    // Step 2: cache.json on yasen.* host (current endpoint)
    const cache = new URL('https://yasen.hotellook.com/tp/public/cache.json');
    cache.searchParams.set('location', locName);
    cache.searchParams.set('checkIn', checkin);
    cache.searchParams.set('checkOut', checkout);
    cache.searchParams.set('adults', adults);
    cache.searchParams.set('limit', '15');
    cache.searchParams.set('currency', 'usd');
    cache.searchParams.set('token', TOKEN);

    const r = await fetch(cache.toString());
    const arr = await safeJson(r);

    const list = Array.isArray(arr) ? arr : (arr?.results || []);
    const results = list.slice(0, 12).map((h, i) => ({
      id: `tph_${h.hotelId || i}`,
      hotelId: h.hotelId,
      name: h.hotelName || h.name,
      stars: h.stars || 0,
      location: h.location?.name || locName,
      country: h.location?.country,
      price: Math.round(h.priceAvg || h.priceFrom || 0),
      currency: 'USD',
      // Affiliate deeplink with marker
      bookingUrl: withMarker(
        `https://search.hotellook.com/hotels?destination=${encodeURIComponent(locName)}` +
          `&checkIn=${checkin}&checkOut=${checkout}&adults=${adults}`,
        MARKER
      ),
    }));

    return json({
      provider: 'hotellook',
      city: locName,
      locationId: locId,
      count: results.length,
      results,
    });
  } catch (e) {
    return json({ provider: 'error', message: e.message, results: [] }, 502);
  }
}

async function safeJson(res) {
  try { return await res.json(); }
  catch { return null; }
}
function defaultDate(addDays) {
  const d = new Date();
  d.setDate(d.getDate() + 30 + addDays); // ~30 days out
  return d.toISOString().slice(0, 10);
}
