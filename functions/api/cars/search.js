// =========================================================
// GET /api/cars/search?city=Da+Nang&pickup=2026-07-15&dropoff=2026-07-17
//
// DiscoverCars affiliate deeplinks (no per-search API needed for affiliate model;
// public API requires DiscoverCars approval). For now we return curated mock
// cards but every "Book" button is a real commission-tracked affiliate link.
//
// Required env: DISCOVERCARS_AFFILIATE_ID (or fallback to TRAVELPAYOUTS_MARKER)
// =========================================================
import { json, corsPreflight } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city') || 'Da Nang';
  const pickup = url.searchParams.get('pickup') || '';
  const dropoff = url.searchParams.get('dropoff') || '';
  // Prefer DiscoverCars direct affiliate ID; falls back to Travelpayouts marker
  // (Travelpayouts also has DiscoverCars in its network so marker still tracks).
  const affId = env.DISCOVERCARS_AFFILIATE_ID || env.TRAVELPAYOUTS_MARKER || env.TRAVELPAYOUTS_TRS || '';
  const sub = url.searchParams.get('sub_id') || '';

  const baseLink = `https://www.discovercars.com/?a_aid=${encodeURIComponent(affId)}` +
    (sub ? `&a_bid=${encodeURIComponent(sub)}` : '') +
    `&country=any&location=${encodeURIComponent(city)}` +
    (pickup ? `&pickupdate=${pickup}` : '') +
    (dropoff ? `&dropoffdate=${dropoff}` : '');

  // Curated showcase cards — replace with real API later
  const results = [
    {
      id: 'car1',
      type: 'Economy',
      model: 'Toyota Vios or similar',
      supplier: 'Sixt',
      seats: 5,
      transmission: 'Auto',
      price: 28,
      currency: 'USD',
      bookingUrl: baseLink,
    },
    {
      id: 'car2',
      type: 'SUV',
      model: 'Honda CR-V or similar',
      supplier: 'Hertz',
      seats: 5,
      transmission: 'Auto',
      price: 55,
      currency: 'USD',
      bookingUrl: baseLink,
    },
    {
      id: 'car3',
      type: 'Compact',
      model: 'Hyundai Accent or similar',
      supplier: 'Avis',
      seats: 5,
      transmission: 'Manual',
      price: 22,
      currency: 'USD',
      bookingUrl: baseLink,
    },
    {
      id: 'car4',
      type: 'Minivan',
      model: 'Toyota Hiace or similar',
      supplier: 'Europcar',
      seats: 9,
      transmission: 'Auto',
      price: 78,
      currency: 'USD',
      bookingUrl: baseLink,
    },
  ];

  return json({
    provider: env.DISCOVERCARS_AFFILIATE_ID ? 'discovercars-direct' : 'discovercars-via-travelpayouts',
    count: results.length,
    results
  });
}
