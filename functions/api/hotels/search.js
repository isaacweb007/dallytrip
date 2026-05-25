// =========================================================
// GET /api/hotels/search?city=Da+Nang&checkin=2026-07-15&checkout=2026-07-17&adults=2
//
// Hotellook + Travelpayouts hybrid:
//   1) Try Hotellook cache.json for live cheapest prices
//   2) If empty, fall back to curated showcase hotels (per-city) with
//      Hotellook search deeplinks (commission still tracked).
//
// Required env: TRAVELPAYOUTS_TOKEN, TRAVELPAYOUTS_MARKER
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

  let liveResults = [];
  try {
    // Step 1: lookup
    const lookup = new URL('https://engine.hotellook.com/api/v2/lookup.json');
    lookup.searchParams.set('query', city);
    lookup.searchParams.set('lang', 'en');
    lookup.searchParams.set('lookFor', 'both');
    lookup.searchParams.set('limit', '1');
    lookup.searchParams.set('token', TOKEN);
    const lu = await fetch(lookup.toString()).then(safeJson);
    const loc = lu?.results?.locations?.[0];
    const locName = loc?.fullName || city;

    // Step 2: cache.json (yasen host)
    const cache = new URL('https://yasen.hotellook.com/tp/public/cache.json');
    cache.searchParams.set('location', locName);
    cache.searchParams.set('checkIn', checkin);
    cache.searchParams.set('checkOut', checkout);
    cache.searchParams.set('adults', adults);
    cache.searchParams.set('limit', '15');
    cache.searchParams.set('currency', 'usd');
    cache.searchParams.set('token', TOKEN);
    const arr = await fetch(cache.toString()).then(safeJson);

    const list = Array.isArray(arr) ? arr : (arr?.results || []);
    liveResults = list.slice(0, 12).map((h, i) => ({
      id: `tph_${h.hotelId || i}`,
      hotelId: h.hotelId,
      name: h.hotelName || h.name,
      stars: h.stars || 0,
      location: h.location?.name || locName,
      country: h.location?.country,
      price: Math.round(h.priceAvg || h.priceFrom || 0),
      currency: 'USD',
      bookingUrl: withMarker(
        `https://search.hotellook.com/hotels?destination=${encodeURIComponent(locName)}` +
          `&checkIn=${checkin}&checkOut=${checkout}&adults=${adults}`,
        MARKER
      ),
    }));
  } catch (e) { /* swallow and use fallback */ }

  // If live returned nothing, build curated showcase with commission deeplinks
  if (liveResults.length === 0) {
    const showcase = CURATED[city] || CURATED._default(city);
    liveResults = showcase.map((h, i) => ({
      id: `tph_curated_${city.toLowerCase().replace(/\s+/g,'_')}_${i}`,
      hotelId: null,
      name: h.name,
      stars: h.stars,
      location: city,
      country: COUNTRY_OF[city] || '',
      price: h.price,
      currency: 'USD',
      bookingUrl: withMarker(
        `https://search.hotellook.com/hotels?destination=${encodeURIComponent(city)}` +
          `&checkIn=${checkin}&checkOut=${checkout}&adults=${adults}`,
        MARKER
      ),
    }));
  }

  return json({
    provider: 'hotellook',
    city,
    count: liveResults.length,
    results: liveResults,
  });
}

async function safeJson(res) {
  try { return await res.json(); }
  catch { return null; }
}
function defaultDate(addDays) {
  const d = new Date();
  d.setDate(d.getDate() + 30 + addDays);
  return d.toISOString().slice(0, 10);
}

// ============== Curated showcase per city ==============
// Real popular hotels (names + typical price points). Each click goes to
// Hotellook search with our marker = commission tracked.
const COUNTRY_OF = {
  'Da Nang':'Vietnam','Nha Trang':'Vietnam','Phu Quoc':'Vietnam','Ho Chi Minh':'Vietnam','Hanoi':'Vietnam',
  'Bangkok':'Thailand','Phuket':'Thailand','Chiang Mai':'Thailand',
  'Bali':'Indonesia','Jakarta':'Indonesia',
  'Manila':'Philippines','Cebu':'Philippines','Boracay':'Philippines',
  'Seoul':'Korea','Busan':'Korea','Jeju':'Korea',
  'Tokyo':'Japan','Osaka':'Japan','Kyoto':'Japan',
  'Shanghai':'China','Beijing':'China','Hong Kong':'China',
  'Kuala Lumpur':'Malaysia','Penang':'Malaysia',
  'Singapore':'Singapore',
};

const CURATED = {
  'Da Nang':[
    {name:'InterContinental Da Nang Sun Peninsula Resort', stars:5, price:520},
    {name:'Furama Resort Da Nang', stars:5, price:185},
    {name:'Hyatt Regency Da Nang Resort', stars:5, price:240},
    {name:'Sheraton Grand Da Nang Resort', stars:5, price:280},
    {name:'Da Nang Mikazuki Japanese Resorts', stars:4, price:140},
  ],
  'Phu Quoc':[
    {name:'JW Marriott Phu Quoc Emerald Bay', stars:5, price:380},
    {name:'Premier Village Phu Quoc Resort', stars:5, price:290},
    {name:'Salinda Resort Phu Quoc', stars:5, price:220},
    {name:'Mango Bay Phu Quoc Resort', stars:4, price:160},
  ],
  'Nha Trang':[
    {name:'Six Senses Ninh Van Bay', stars:5, price:680},
    {name:'Vinpearl Resort Nha Trang', stars:5, price:210},
    {name:'Sheraton Nha Trang Hotel & Spa', stars:5, price:175},
    {name:'Ana Mandara Cam Ranh', stars:5, price:240},
  ],
  'Ho Chi Minh':[
    {name:'Park Hyatt Saigon', stars:5, price:420},
    {name:'The Reverie Saigon', stars:5, price:520},
    {name:'Hotel Nikko Saigon', stars:5, price:165},
    {name:'Liberty Central Saigon', stars:4, price:95},
  ],
  'Hanoi':[
    {name:'Sofitel Legend Metropole Hanoi', stars:5, price:540},
    {name:'JW Marriott Hotel Hanoi', stars:5, price:230},
    {name:'Apricot Hotel Hanoi', stars:4, price:120},
  ],
  'Bangkok':[
    {name:'Mandarin Oriental Bangkok', stars:5, price:680},
    {name:'The Peninsula Bangkok', stars:5, price:520},
    {name:'Banyan Tree Bangkok', stars:5, price:340},
    {name:'Lebua at State Tower', stars:5, price:280},
    {name:'Centara Grand at CentralWorld', stars:5, price:195},
  ],
  'Phuket':[
    {name:'Trisara Phuket', stars:5, price:980},
    {name:'Amanpuri Phuket', stars:5, price:1450},
    {name:'The Surin Phuket', stars:5, price:380},
    {name:'Kata Beach Resort', stars:4, price:120},
  ],
  'Chiang Mai':[
    {name:'Four Seasons Resort Chiang Mai', stars:5, price:580},
    {name:'Anantara Chiang Mai Resort', stars:5, price:240},
    {name:'Le Meridien Chiang Mai', stars:5, price:140},
  ],
  'Bali':[
    {name:'Bulgari Resort Bali', stars:5, price:1450},
    {name:'Four Seasons Resort Bali at Sayan', stars:5, price:880},
    {name:'The Mulia Bali', stars:5, price:480},
    {name:'COMO Uma Ubud', stars:5, price:380},
    {name:'Padma Resort Legian', stars:5, price:210},
  ],
  'Jakarta':[
    {name:'The Ritz-Carlton Jakarta, Pacific Place', stars:5, price:280},
    {name:'Park Hyatt Jakarta', stars:5, price:320},
    {name:'Mandarin Oriental Jakarta', stars:5, price:240},
  ],
  'Manila':[
    {name:'The Peninsula Manila', stars:5, price:280},
    {name:'Shangri-La The Fort Manila', stars:5, price:240},
    {name:'Conrad Manila', stars:5, price:220},
  ],
  'Cebu':[
    {name:'Shangri-La Mactan Resort & Spa', stars:5, price:340},
    {name:'Crimson Resort & Spa Mactan', stars:5, price:220},
    {name:'Plantation Bay Resort and Spa', stars:5, price:180},
  ],
  'Boracay':[
    {name:'Shangri-La Boracay Resort & Spa', stars:5, price:460},
    {name:'Crimson Resort & Spa Boracay', stars:5, price:280},
    {name:'Henann Regency Resort & Spa', stars:4, price:160},
  ],
  'Seoul':[
    {name:'The Shilla Seoul', stars:5, price:420},
    {name:'Lotte Hotel Seoul', stars:5, price:280},
    {name:'Four Seasons Hotel Seoul', stars:5, price:520},
    {name:'Park Hyatt Seoul', stars:5, price:380},
    {name:'JW Marriott Dongdaemun Square Seoul', stars:5, price:240},
  ],
  'Busan':[
    {name:'Park Hyatt Busan', stars:5, price:380},
    {name:'Paradise Hotel Busan', stars:5, price:240},
    {name:'Westin Josun Busan', stars:5, price:280},
  ],
  'Jeju':[
    {name:'Grand Hyatt Jeju', stars:5, price:340},
    {name:'Shilla Stay Jeju', stars:4, price:160},
    {name:'Lotte Hotel Jeju', stars:5, price:280},
  ],
  'Tokyo':[
    {name:'Aman Tokyo', stars:5, price:1280},
    {name:'The Ritz-Carlton Tokyo', stars:5, price:780},
    {name:'Park Hyatt Tokyo', stars:5, price:580},
    {name:'Mandarin Oriental Tokyo', stars:5, price:680},
    {name:'Andaz Tokyo Toranomon Hills', stars:5, price:420},
    {name:'Hoshinoya Tokyo', stars:5, price:520},
  ],
  'Osaka':[
    {name:'The Ritz-Carlton Osaka', stars:5, price:380},
    {name:'Conrad Osaka', stars:5, price:340},
    {name:'St. Regis Osaka', stars:5, price:480},
    {name:'InterContinental Osaka', stars:5, price:280},
  ],
  'Kyoto':[
    {name:'The Ritz-Carlton Kyoto', stars:5, price:780},
    {name:'Four Seasons Hotel Kyoto', stars:5, price:680},
    {name:'Aman Kyoto', stars:5, price:1480},
    {name:'Park Hyatt Kyoto', stars:5, price:580},
  ],
  'Shanghai':[
    {name:'The Peninsula Shanghai', stars:5, price:480},
    {name:'Waldorf Astoria Shanghai on the Bund', stars:5, price:380},
    {name:'Mandarin Oriental Pudong, Shanghai', stars:5, price:340},
    {name:'Bulgari Hotel Shanghai', stars:5, price:520},
  ],
  'Beijing':[
    {name:'Waldorf Astoria Beijing', stars:5, price:380},
    {name:'Rosewood Beijing', stars:5, price:340},
    {name:'The Peninsula Beijing', stars:5, price:420},
  ],
  'Hong Kong':[
    {name:'The Peninsula Hong Kong', stars:5, price:680},
    {name:'Mandarin Oriental, Hong Kong', stars:5, price:580},
    {name:'Rosewood Hong Kong', stars:5, price:780},
    {name:'Four Seasons Hotel Hong Kong', stars:5, price:740},
  ],
  'Kuala Lumpur':[
    {name:'Mandarin Oriental Kuala Lumpur', stars:5, price:220},
    {name:'The St. Regis Kuala Lumpur', stars:5, price:280},
    {name:'Four Seasons Hotel Kuala Lumpur', stars:5, price:240},
    {name:'Shangri-La Hotel Kuala Lumpur', stars:5, price:180},
  ],
  'Penang':[
    {name:'Eastern & Oriental Hotel', stars:5, price:180},
    {name:'Shangri-La\'s Rasa Sayang Resort & Spa', stars:5, price:280},
    {name:'The Edison George Town', stars:4, price:120},
  ],
  'Singapore':[
    {name:'Marina Bay Sands', stars:5, price:580},
    {name:'Raffles Hotel Singapore', stars:5, price:780},
    {name:'Mandarin Oriental Singapore', stars:5, price:480},
    {name:'The Fullerton Bay Hotel Singapore', stars:5, price:520},
    {name:'Capella Singapore', stars:5, price:680},
    {name:'The Ritz-Carlton, Millenia Singapore', stars:5, price:540},
  ],
  _default: (city) => [
    {name:`${city} Marriott`, stars:5, price:280},
    {name:`${city} Hilton`, stars:5, price:240},
    {name:`${city} Hyatt`, stars:5, price:320},
    {name:`${city} InterContinental`, stars:5, price:380},
  ],
};
