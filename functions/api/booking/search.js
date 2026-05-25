// =========================================================
// GET /api/booking/search?city=Da+Nang&checkin=2026-07-15&checkout=2026-07-17&adults=2
//
// Booking.com Affiliate deeplinks — gives higher commission (4-6%) than
// the Hotellook route. Activate when you have BOOKING_AID env var
// (your Affiliate Partner ID).
//
// Required env: BOOKING_AID
// Docs: https://www.booking.com/affiliate-program/v2/index.html
// =========================================================
import { json, corsPreflight } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const city = (url.searchParams.get('city') || 'Da Nang').trim();
  const checkin = url.searchParams.get('checkin') || '';
  const checkout = url.searchParams.get('checkout') || '';
  const adults = url.searchParams.get('adults') || '2';
  const sub = url.searchParams.get('sub_id') || '';

  const AID = env.BOOKING_AID;
  // If no Booking AID yet, gracefully fall back to Hotellook
  if (!AID) {
    return json({
      provider: 'booking-not-configured',
      hint: 'Sign up at https://www.booking.com/affiliate-program/v2/index.html and set env BOOKING_AID',
      results: [],
    });
  }

  // Booking.com search URL with affiliate parameters
  // aid = your partner ID, label = sub-ID for analytics
  const link = `https://www.booking.com/searchresults.html?` +
    `aid=${encodeURIComponent(AID)}` +
    (sub ? `&label=${encodeURIComponent(sub)}` : '') +
    `&ss=${encodeURIComponent(city)}` +
    (checkin ? `&checkin=${checkin}` : '') +
    (checkout ? `&checkout=${checkout}` : '') +
    `&group_adults=${adults}` +
    `&no_rooms=1`;

  // Booking doesn't expose a free public search-data API, so we surface a single
  // "search this city on Booking" card. Higher commission than Hotellook (4-6% vs ~6-7%
  // depending on dynamic rate). Optimized for click-through.
  const results = [{
    id: `bkg_${city}`.toLowerCase().replace(/\s+/g, '_'),
    name: `Search ${city} hotels on Booking.com`,
    location: city,
    price: null,
    currency: 'USD',
    note: `Higher commission · Booking.com inventory`,
    bookingUrl: link,
  }];

  return json({ provider: 'booking-direct', count: results.length, results });
}
