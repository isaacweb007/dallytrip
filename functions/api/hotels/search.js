// =========================================================
// GET /api/hotels/search?city=DAD&checkin=2026-07-15&checkout=2026-07-17&adults=2
//
// Uses Hotellook (Travelpayouts family). Commission paid per stayed night.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/115001772233
// =========================================================
import { json, corsPreflight, withMarker, fallback } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const city = (url.searchParams.get('city') || 'Da Nang').trim();
  const checkin = url.searchParams.get('checkin') || '';
  const checkout = url.searchParams.get('checkout') || '';
  const adults = url.searchParams.get('adults') || '2';

  const TOKEN = env.TRAVELPAYOUTS_TOKEN;
  const MARKER = env.TRAVELPAYOUTS_MARKER || '';

  if (!TOKEN) return fallback('hotels', { city, checkin, checkout, adults });

  try {
    // 1) Static endpoint for cached lowest prices by city
    const api = new URL('https://engine.hotellook.com/api/v2/cache.json');
    api.searchParams.set('location', city);
    if (checkin) api.searchParams.set('checkIn', checkin);
    if (checkout) api.searchParams.set('checkOut', checkout);
    api.searchParams.set('adults', adults);
    api.searchParams.set('limit', '15');
    api.searchParams.set('currency', 'usd');
    api.searchParams.set('token', TOKEN);

    const r = await fetch(api.toString());
    const arr = await r.json();

    const results = (Array.isArray(arr) ? arr : []).slice(0, 12).map((h, i) => ({
      id: `tph_${h.hotelId || i}`,
      hotelId: h.hotelId,
      name: h.hotelName,
      stars: h.stars,
      location: h.location?.name || city,
      country: h.location?.country,
      price: Math.round(h.priceAvg || h.priceFrom || 0),
      currency: 'USD',
      // Hotellook deeplink with our marker
      bookingUrl: withMarker(
        `https://search.hotellook.com/hotels?destination=${encodeURIComponent(city)}` +
          (checkin ? `&checkIn=${checkin}` : '') +
          (checkout ? `&checkOut=${checkout}` : '') +
          `&adults=${adults}`,
        MARKER
      ),
    }));

    return json({ provider: 'hotellook', count: results.length, results });
  } catch (e) {
    return json({ provider: 'error', message: e.message, results: [] }, 502);
  }
}
