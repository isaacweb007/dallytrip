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
    liveResults = list.slice(0, 24).map((h, i) => ({
      id: `tph_${h.hotelId || i}`,
      hotelId: h.hotelId,
      name: h.hotelName || h.name,
      stars: h.stars || 0,
      location: h.location?.name || locName,
      country: h.location?.country,
      price: Math.round(h.priceAvg || h.priceFrom || 0),
      currency: 'USD',
      // Hotellook CDN gives a real photo of THIS hotel when hotelId is known.
      image: h.hotelId
        ? `https://photo.hotellook.com/image_v2/limit/h${h.hotelId}_1/800/520.auto`
        : pickCityHotelImage(h.location?.name || locName, h.hotelName || h.name),
      bookingUrl: withMarker(
        `https://search.hotellook.com/hotels?destination=${encodeURIComponent(locName)}` +
          `&checkIn=${checkin}&checkOut=${checkout}&adults=${adults}`,
        MARKER
      ),
    }));
  } catch (e) { /* swallow and use fallback */ }

  // If live returned nothing, build curated showcase with commission deeplinks.
  // CRITICAL: for each curated hotel, look it up BY NAME in Hotellook so we get
  // its real hotelId — that's what unlocks the real per-hotel photo. Without
  // this step every Furama/Sheraton/Pullman/etc. falls back to the same generic
  // city-pool image (the bug user complained about).
  let debugInfo = null;
  if (liveResults.length === 0) {
    const showcase = CURATED[city] || CURATED._default(city);
    const debugDump = [];
    liveResults = await Promise.all(showcase.map(async (h, i) => {
      const { id: realId, debug } = await lookupHotelId(h.name, city, TOKEN);
      if (i < 2) debugDump.push({ name: h.name, ...debug });
      return {
        id: `tph_curated_${city.toLowerCase().replace(/\s+/g,'_')}_${i}`,
        hotelId: realId || null,
        name: h.name,
        stars: h.stars,
        location: city,
        country: COUNTRY_OF[city] || '',
        price: h.price,
        currency: 'USD',
        // Per-hotel real photo from Hotellook's CDN when we found a hotelId,
        // otherwise picked from the per-city HOTEL_IMG_POOL with a well-mixed
        // hash so different hotel names land on different pool slots.
        image: realId
          ? `https://photo.hotellook.com/image_v2/limit/h${realId}_1/800/520.auto`
          : pickCityHotelImage(city, h.name),
        bookingUrl: withMarker(
          `https://search.hotellook.com/hotels?destination=${encodeURIComponent(city)}` +
            `&checkIn=${checkin}&checkOut=${checkout}&adults=${adults}`,
          MARKER
        ),
      };
    }));
    debugInfo = debugDump;
  }

  const payload = {
    provider: 'hotellook',
    city,
    count: liveResults.length,
    results: liveResults,
  };
  if (url.searchParams.get('debug') === '1' && debugInfo) {
    payload.debug = debugInfo;
  }
  return json(payload);
}

// Resolve a curated hotel name to its real Hotellook ID so we can pull the
// REAL photo of that specific hotel (not a generic city stock shot).
// Returns { id, debug } — id is null on any failure; debug surfaces what the
// API actually returned so we can diagnose without redeploying.
async function lookupHotelId(hotelName, city, token) {
  if (!hotelName || !token) return { id: null, debug: 'no name/token' };
  try {
    // Hotellook's lookup uses `lookFor=both` and returns both `locations` and
    // `hotels` arrays. `hotel` (singular) is also accepted in some docs.
    const lu = new URL('https://engine.hotellook.com/api/v2/lookup.json');
    lu.searchParams.set('query', `${hotelName} ${city}`);
    lu.searchParams.set('lang', 'en');
    lu.searchParams.set('lookFor', 'both');
    lu.searchParams.set('limit', '3');
    lu.searchParams.set('token', token);
    const data = await fetch(lu.toString()).then(safeJson);
    // Some Hotellook responses wrap hotels under results.hotels; some under
    // a flat `hotels` key. Probe both. The hotel record uses `id` or `hotelId`.
    const hotels = data?.results?.hotels || data?.hotels || [];
    const first = Array.isArray(hotels) ? hotels[0] : null;
    const realId = first?.id || first?.hotelId || null;
    return {
      id: realId,
      debug: {
        url: lu.toString().replace(token, '***'),
        keys: data ? Object.keys(data) : null,
        resultsKeys: data?.results ? Object.keys(data.results) : null,
        hotelsLen: Array.isArray(hotels) ? hotels.length : 'not array',
        firstHotelKeys: first ? Object.keys(first) : null,
        sampleFirst: first || null,
      },
    };
  } catch (e) {
    return { id: null, debug: { error: String(e?.message || e) } };
  }
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

// ============== HOTEL image pools (fallback only) ==============
// Used ONLY when Hotellook lookup-by-name fails to find a real hotelId. Each
// city has 12+ distinct resort/villa/hotel photos so the FNV-1a hash spreads
// neighboring hotel names across visibly different images even when the lookup
// path can't be used.
//
// Shared photo bucket — varied resort/villa/hotel/lobby shots. Per-city pools
// reference these by index so we don't repeat URL strings 25 times.
const SHARED_HOTEL_PHOTOS = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=70&auto=format&fit=crop', //  0 villa pool palms
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=70&auto=format&fit=crop', //  1 wood deck sunset
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=70&auto=format&fit=crop', //  2 modern hotel room
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=70&auto=format&fit=crop', //  3 hotel hallway
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&q=70&auto=format&fit=crop', //  4 hotel exterior dusk
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=70&auto=format&fit=crop', //  5 boutique lobby
  'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=70&auto=format&fit=crop', //  6 city hotel facade
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=70&auto=format&fit=crop', //  7 overwater villa
  'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=900&q=70&auto=format&fit=crop', //  8 tropical pool deck
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=70&auto=format&fit=crop', //  9 boutique room
  'https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=900&q=70&auto=format&fit=crop', // 10 atrium lobby
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=70&auto=format&fit=crop', // 11 mountain resort
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=70&auto=format&fit=crop', // 12 luxury bedroom
  'https://images.unsplash.com/photo-1455587734955-081b22074882?w=900&q=70&auto=format&fit=crop', // 13 city skyline hotel
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=900&q=70&auto=format&fit=crop', // 14 grand entrance
  'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=900&q=70&auto=format&fit=crop', // 15 modern suite
  'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=900&q=70&auto=format&fit=crop', // 16 boutique facade
  'https://images.unsplash.com/photo-1551776235-dde6d4829808?w=900&q=70&auto=format&fit=crop', // 17 design hotel
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=70&auto=format&fit=crop', // 18 infinity pool
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=70&auto=format&fit=crop', // 19 beach resort
];

// Per-city pools — each city picks a different subset/order from SHARED_HOTEL_PHOTOS
// so visually similar properties don't pile up on the same shot. Order also
// matters because we hash → index, so different orderings give different distributions.
function _pool(...indices) { return indices.map(i => SHARED_HOTEL_PHOTOS[i]); }
const HOTEL_IMG_POOL = {
  'Da Nang':     _pool(0, 8, 7, 11, 2, 18, 19, 1, 12, 15, 17, 14),
  'Phu Quoc':    _pool(7, 8, 0, 18, 19, 11, 1, 12, 15, 2),
  'Nha Trang':   _pool(0, 7, 8, 19, 18, 11, 12, 2, 15, 17),
  'Ho Chi Minh': _pool(4, 6, 10, 13, 14, 5, 3, 16, 17, 15),
  'Hanoi':       _pool(5, 6, 10, 14, 4, 13, 16, 3, 17, 15),
  'Bangkok':     _pool(13, 5, 6, 10, 14, 4, 16, 17, 3, 15, 12, 0),
  'Phuket':      _pool(7, 0, 8, 18, 19, 11, 1, 12, 15, 17),
  'Chiang Mai':  _pool(11, 5, 4, 6, 16, 17, 14, 3, 10, 15),
  'Bali':        _pool(7, 0, 8, 11, 18, 19, 1, 12, 15, 17, 14, 2, 9, 5),
  'Jakarta':     _pool(6, 13, 14, 10, 4, 5, 3, 16, 17, 15),
  'Manila':      _pool(6, 13, 5, 10, 4, 14, 16, 3, 17, 15),
  'Cebu':        _pool(7, 8, 18, 0, 11, 19, 1, 12, 15, 2),
  'Boracay':     _pool(8, 7, 18, 19, 0, 11, 1, 12, 15, 17),
  'Seoul':       _pool(13, 14, 4, 6, 5, 10, 3, 16, 17, 15, 12, 2),
  'Busan':       _pool(4, 13, 14, 6, 11, 10, 16, 5, 17, 15),
  'Jeju':        _pool(11, 7, 8, 18, 0, 19, 1, 12, 15, 17),
  'Tokyo':       _pool(5, 13, 14, 6, 4, 10, 3, 16, 17, 15, 12, 9),
  'Osaka':       _pool(10, 5, 13, 14, 6, 4, 16, 3, 17, 15),
  'Kyoto':       _pool(5, 11, 4, 14, 16, 17, 6, 10, 3, 15),
  'Shanghai':    _pool(6, 13, 14, 4, 10, 5, 16, 3, 17, 15),
  'Beijing':     _pool(10, 5, 13, 14, 6, 4, 16, 3, 17, 15),
  'Hong Kong':   _pool(13, 6, 14, 4, 10, 5, 16, 3, 17, 15),
  'Kuala Lumpur':_pool(5, 13, 14, 6, 4, 10, 16, 3, 17, 15),
  'Penang':      _pool(5, 11, 4, 14, 16, 17, 6, 10, 3, 15),
  'Singapore':   _pool(13, 14, 6, 5, 10, 4, 16, 3, 17, 15, 12, 0),
};
const HOTEL_DEFAULT = SHARED_HOTEL_PHOTOS[3];

// FNV-1a 32-bit — much better avalanche than the old "h*31+c" so similar
// hotel names ("Da Nang Marriott" / "Da Nang Hyatt") land far apart in the pool.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function pickCityHotelImage(city, hotelName) {
  const pool = HOTEL_IMG_POOL[city] || [HOTEL_DEFAULT];
  // Mix hotel name AND city into the hash so the same brand name in different
  // cities doesn't land on the same index.
  const key = `${hotelName || 'hotel'}|${city || ''}`;
  return pool[fnv1a(key) % pool.length];
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
    {name:'Hyatt Regency Da Nang Resort & Spa', stars:5, price:240},
    {name:'Sheraton Grand Da Nang Resort', stars:5, price:280},
    {name:'Pullman Danang Beach Resort', stars:5, price:170},
    {name:'Crowne Plaza Da Nang', stars:5, price:155},
    {name:'Premier Village Danang Resort', stars:5, price:340},
    {name:'Mercure Da Nang French Village', stars:4, price:120},
    {name:'TIA Wellness Resort', stars:5, price:380},
    {name:'Naman Retreat Da Nang', stars:5, price:420},
    {name:'Da Nang Mikazuki Japanese Resort', stars:4, price:140},
    {name:'Novotel Danang Premier Han River', stars:5, price:135},
  ],
  'Phu Quoc':[
    {name:'JW Marriott Phu Quoc Emerald Bay', stars:5, price:380},
    {name:'Premier Village Phu Quoc Resort', stars:5, price:290},
    {name:'Salinda Resort Phu Quoc', stars:5, price:220},
    {name:'InterContinental Phu Quoc Long Beach', stars:5, price:340},
    {name:'Vinpearl Resort & Spa Phu Quoc', stars:5, price:195},
    {name:'Movenpick Resort Waverly Phu Quoc', stars:5, price:230},
    {name:'Sol Beach House Phu Quoc', stars:4, price:140},
    {name:'New World Phu Quoc Resort', stars:5, price:310},
    {name:'Pullman Phu Quoc Beach Resort', stars:5, price:280},
    {name:'Mango Bay Phu Quoc Resort', stars:4, price:160},
  ],
  'Nha Trang':[
    {name:'Six Senses Ninh Van Bay', stars:5, price:680},
    {name:'Vinpearl Resort Nha Trang', stars:5, price:210},
    {name:'Sheraton Nha Trang Hotel & Spa', stars:5, price:175},
    {name:'Anam Cam Ranh', stars:5, price:300},
    {name:'Mia Resort Nha Trang', stars:5, price:240},
    {name:'InterContinental Nha Trang', stars:5, price:220},
    {name:'Amiana Resort Nha Trang', stars:5, price:185},
    {name:'Diamond Bay Resort & Spa', stars:5, price:165},
    {name:'Sunrise Nha Trang Beach Hotel & Spa', stars:5, price:140},
    {name:'Ana Mandara Cam Ranh', stars:5, price:240},
  ],
  'Ho Chi Minh':[
    {name:'Park Hyatt Saigon', stars:5, price:420},
    {name:'The Reverie Saigon', stars:5, price:520},
    {name:'Sofitel Saigon Plaza', stars:5, price:185},
    {name:'Hotel Nikko Saigon', stars:5, price:165},
    {name:'Sheraton Saigon Hotel & Towers', stars:5, price:175},
    {name:'Le Meridien Saigon', stars:5, price:155},
    {name:'New World Saigon Hotel', stars:5, price:140},
    {name:'Renaissance Riverside Saigon', stars:5, price:130},
    {name:'Caravelle Saigon', stars:5, price:160},
    {name:'Liberty Central Saigon Riverside', stars:4, price:95},
  ],
  'Hanoi':[
    {name:'Sofitel Legend Metropole Hanoi', stars:5, price:540},
    {name:'JW Marriott Hotel Hanoi', stars:5, price:230},
    {name:'Lotte Hotel Hanoi', stars:5, price:180},
    {name:'InterContinental Hanoi Westlake', stars:5, price:210},
    {name:'Sheraton Hanoi Hotel', stars:5, price:160},
    {name:'Pan Pacific Hanoi', stars:5, price:175},
    {name:'Apricot Hotel Hanoi', stars:4, price:120},
    {name:'Hilton Hanoi Opera', stars:5, price:155},
    {name:'Pullman Hanoi', stars:5, price:140},
    {name:'Hanoi La Siesta Diamond Hotel & Spa', stars:4, price:90},
  ],
  'Bangkok':[
    {name:'Mandarin Oriental Bangkok', stars:5, price:680},
    {name:'The Peninsula Bangkok', stars:5, price:520},
    {name:'Banyan Tree Bangkok', stars:5, price:340},
    {name:'Lebua at State Tower', stars:5, price:280},
    {name:'Centara Grand at CentralWorld', stars:5, price:195},
    {name:'St. Regis Bangkok', stars:5, price:420},
    {name:'Park Hyatt Bangkok', stars:5, price:380},
    {name:'Sukhothai Bangkok', stars:5, price:310},
    {name:'Anantara Riverside Bangkok Resort', stars:5, price:240},
    {name:'Shangri-La Hotel Bangkok', stars:5, price:280},
    {name:'Conrad Bangkok', stars:5, price:220},
    {name:'Hyatt Regency Bangkok Sukhumvit', stars:5, price:185},
  ],
  'Phuket':[
    {name:'Trisara Phuket', stars:5, price:980},
    {name:'Amanpuri Phuket', stars:5, price:1450},
    {name:'The Surin Phuket', stars:5, price:380},
    {name:'Banyan Tree Phuket', stars:5, price:620},
    {name:'Anantara Mai Khao Phuket Villas', stars:5, price:520},
    {name:'JW Marriott Phuket Resort & Spa', stars:5, price:320},
    {name:'Le Meridien Phuket Beach Resort', stars:5, price:240},
    {name:'Centara Grand Beach Resort Phuket', stars:5, price:280},
    {name:'Outrigger Laguna Phuket Beach Resort', stars:5, price:340},
    {name:'Kata Beach Resort', stars:4, price:120},
  ],
  'Chiang Mai':[
    {name:'Four Seasons Resort Chiang Mai', stars:5, price:580},
    {name:'Anantara Chiang Mai Resort', stars:5, price:240},
    {name:'Le Meridien Chiang Mai', stars:5, price:140},
    {name:'Shangri-La Hotel, Chiang Mai', stars:5, price:160},
    {name:'137 Pillars House Chiang Mai', stars:5, price:280},
    {name:'Dhara Dhevi Chiang Mai', stars:5, price:340},
    {name:'Rachamankha Hotel', stars:5, price:185},
    {name:'Akyra Manor Chiang Mai', stars:5, price:130},
  ],
  'Bali':[
    {name:'Bulgari Resort Bali', stars:5, price:1450},
    {name:'Four Seasons Resort Bali at Sayan', stars:5, price:880},
    {name:'The Mulia Bali', stars:5, price:480},
    {name:'COMO Uma Ubud', stars:5, price:380},
    {name:'Padma Resort Legian', stars:5, price:210},
    {name:'Hanging Gardens of Bali', stars:5, price:540},
    {name:'Ayana Resort and Spa Bali', stars:5, price:340},
    {name:'Anantara Uluwatu Bali Resort', stars:5, price:420},
    {name:'The Ritz-Carlton Bali', stars:5, price:380},
    {name:'St. Regis Bali Resort', stars:5, price:680},
    {name:'Viceroy Bali', stars:5, price:520},
    {name:'Como Shambhala Estate', stars:5, price:780},
    {name:'Maya Ubud Resort & Spa', stars:5, price:240},
    {name:'Hotel Indigo Bali Seminyak Beach', stars:5, price:280},
  ],
  'Jakarta':[
    {name:'The Ritz-Carlton Jakarta, Pacific Place', stars:5, price:280},
    {name:'Park Hyatt Jakarta', stars:5, price:320},
    {name:'Mandarin Oriental Jakarta', stars:5, price:240},
    {name:'Raffles Jakarta', stars:5, price:380},
    {name:'Four Seasons Hotel Jakarta', stars:5, price:340},
    {name:'Grand Hyatt Jakarta', stars:5, price:220},
    {name:'JW Marriott Hotel Jakarta', stars:5, price:200},
    {name:'Pullman Jakarta Indonesia', stars:5, price:150},
    {name:'Fairmont Jakarta', stars:5, price:280},
  ],
  'Manila':[
    {name:'The Peninsula Manila', stars:5, price:280},
    {name:'Shangri-La The Fort Manila', stars:5, price:240},
    {name:'Conrad Manila', stars:5, price:220},
    {name:'Manila Hotel', stars:5, price:180},
    {name:'New World Makati Hotel', stars:5, price:160},
    {name:'Marco Polo Ortigas Manila', stars:5, price:170},
    {name:'Sofitel Philippine Plaza Manila', stars:5, price:230},
    {name:'Edsa Shangri-La Manila', stars:5, price:200},
    {name:'Solaire Resort & Casino', stars:5, price:280},
  ],
  'Cebu':[
    {name:'Shangri-La Mactan Resort & Spa', stars:5, price:340},
    {name:'Crimson Resort & Spa Mactan', stars:5, price:220},
    {name:'Plantation Bay Resort and Spa', stars:5, price:180},
    {name:'Movenpick Hotel Mactan Island Cebu', stars:5, price:240},
    {name:'JPark Island Resort & Waterpark', stars:5, price:200},
    {name:'Bluewater Maribago Beach Resort', stars:4, price:150},
    {name:'Pulchra Resort Cebu', stars:5, price:280},
    {name:'Marriott Cebu City Hotel', stars:5, price:170},
  ],
  'Boracay':[
    {name:'Shangri-La Boracay Resort & Spa', stars:5, price:460},
    {name:'Crimson Resort & Spa Boracay', stars:5, price:280},
    {name:'Henann Regency Resort & Spa', stars:4, price:160},
    {name:'Discovery Shores Boracay', stars:5, price:340},
    {name:'Movenpick Resort & Spa Boracay', stars:5, price:300},
    {name:'Astoria Current Boracay', stars:4, price:130},
    {name:'The District Boracay', stars:5, price:240},
    {name:'Henann Garden Resort Boracay', stars:4, price:150},
  ],
  'Seoul':[
    {name:'The Shilla Seoul', stars:5, price:420},
    {name:'Lotte Hotel Seoul', stars:5, price:280},
    {name:'Four Seasons Hotel Seoul', stars:5, price:520},
    {name:'Park Hyatt Seoul', stars:5, price:380},
    {name:'JW Marriott Dongdaemun Square Seoul', stars:5, price:240},
    {name:'Grand Hyatt Seoul', stars:5, price:320},
    {name:'Conrad Seoul', stars:5, price:260},
    {name:'InterContinental Seoul COEX', stars:5, price:220},
    {name:'Westin Chosun Seoul', stars:5, price:280},
    {name:'L7 Myeongdong by LOTTE', stars:4, price:150},
    {name:'Signiel Seoul', stars:5, price:480},
    {name:'Mondrian Seoul Itaewon', stars:5, price:240},
    {name:'Banyan Tree Club & Spa Seoul', stars:5, price:340},
    {name:'JW Marriott Hotel Seoul', stars:5, price:260},
    {name:'Andaz Seoul Gangnam', stars:5, price:300},
  ],
  'Busan':[
    {name:'Park Hyatt Busan', stars:5, price:380},
    {name:'Paradise Hotel Busan', stars:5, price:240},
    {name:'Westin Josun Busan', stars:5, price:280},
    {name:'Grand Josun Busan', stars:5, price:320},
    {name:'Lotte Hotel Busan', stars:5, price:220},
    {name:'Hilton Busan', stars:5, price:260},
    {name:'Signiel Busan', stars:5, price:340},
    {name:'Park Hotel Busan', stars:4, price:160},
  ],
  'Jeju':[
    {name:'Grand Hyatt Jeju', stars:5, price:340},
    {name:'Shilla Stay Jeju', stars:4, price:160},
    {name:'Lotte Hotel Jeju', stars:5, price:280},
    {name:'Hyatt Regency Jeju', stars:5, price:260},
    {name:'Parnas Hotel Jeju', stars:5, price:200},
    {name:'Maison Glad Jeju', stars:4, price:140},
    {name:'Phoenix Jeju', stars:5, price:240},
    {name:'Kensington Resort Seogwipo Jeju', stars:5, price:180},
  ],
  'Tokyo':[
    {name:'Aman Tokyo', stars:5, price:1280},
    {name:'The Ritz-Carlton Tokyo', stars:5, price:780},
    {name:'Park Hyatt Tokyo', stars:5, price:580},
    {name:'Mandarin Oriental Tokyo', stars:5, price:680},
    {name:'Andaz Tokyo Toranomon Hills', stars:5, price:420},
    {name:'Hoshinoya Tokyo', stars:5, price:520},
    {name:'Four Seasons Hotel Tokyo at Marunouchi', stars:5, price:540},
    {name:'Conrad Tokyo', stars:5, price:380},
    {name:'Grand Hyatt Tokyo', stars:5, price:340},
    {name:'The Peninsula Tokyo', stars:5, price:620},
    {name:'Shangri-La Tokyo', stars:5, price:580},
    {name:'St. Regis Hotel Osaka', stars:5, price:480},
    {name:'Cerulean Tower Tokyu Hotel', stars:5, price:260},
    {name:'Hyatt Regency Tokyo', stars:5, price:240},
    {name:'Tokyo Edition Toranomon', stars:5, price:440},
  ],
  'Osaka':[
    {name:'The Ritz-Carlton Osaka', stars:5, price:380},
    {name:'Conrad Osaka', stars:5, price:340},
    {name:'St. Regis Osaka', stars:5, price:480},
    {name:'InterContinental Osaka', stars:5, price:280},
    {name:'Hilton Osaka', stars:5, price:200},
    {name:'Imperial Hotel Osaka', stars:5, price:260},
    {name:'W Osaka', stars:5, price:420},
    {name:'Hotel Granvia Osaka', stars:5, price:180},
    {name:'Cross Hotel Osaka', stars:4, price:160},
    {name:'Osaka Marriott Miyako Hotel', stars:5, price:300},
  ],
  'Kyoto':[
    {name:'The Ritz-Carlton Kyoto', stars:5, price:780},
    {name:'Four Seasons Hotel Kyoto', stars:5, price:680},
    {name:'Aman Kyoto', stars:5, price:1480},
    {name:'Park Hyatt Kyoto', stars:5, price:580},
    {name:'Hoshinoya Kyoto', stars:5, price:620},
    {name:'Suiran, a Luxury Collection Hotel', stars:5, price:480},
    {name:'Hyatt Regency Kyoto', stars:5, price:280},
    {name:'Gion Hatanaka', stars:5, price:340},
    {name:'Kyoto Hotel Okura', stars:5, price:220},
  ],
  'Shanghai':[
    {name:'The Peninsula Shanghai', stars:5, price:480},
    {name:'Waldorf Astoria Shanghai on the Bund', stars:5, price:380},
    {name:'Mandarin Oriental Pudong, Shanghai', stars:5, price:340},
    {name:'Bulgari Hotel Shanghai', stars:5, price:520},
    {name:'Park Hyatt Shanghai', stars:5, price:420},
    {name:'Four Seasons Hotel Shanghai at Pudong', stars:5, price:300},
    {name:'St. Regis Shanghai Jingan', stars:5, price:280},
    {name:'Capella Shanghai, Jian Ye Li', stars:5, price:680},
    {name:'Edition Shanghai', stars:5, price:340},
    {name:'Shangri-La Pudong Shanghai', stars:5, price:240},
  ],
  'Beijing':[
    {name:'Waldorf Astoria Beijing', stars:5, price:380},
    {name:'Rosewood Beijing', stars:5, price:340},
    {name:'The Peninsula Beijing', stars:5, price:420},
    {name:'Mandarin Oriental Wangfujing, Beijing', stars:5, price:360},
    {name:'St. Regis Beijing', stars:5, price:380},
    {name:'Park Hyatt Beijing', stars:5, price:280},
    {name:'Conrad Beijing', stars:5, price:220},
    {name:'Aman at Summer Palace', stars:5, price:680},
    {name:'Bulgari Hotel Beijing', stars:5, price:580},
  ],
  'Hong Kong':[
    {name:'The Peninsula Hong Kong', stars:5, price:680},
    {name:'Mandarin Oriental, Hong Kong', stars:5, price:580},
    {name:'Rosewood Hong Kong', stars:5, price:780},
    {name:'Four Seasons Hotel Hong Kong', stars:5, price:740},
    {name:'Island Shangri-La Hong Kong', stars:5, price:420},
    {name:'The Ritz-Carlton Hong Kong', stars:5, price:680},
    {name:'St. Regis Hong Kong', stars:5, price:620},
    {name:'W Hong Kong', stars:5, price:380},
    {name:'Conrad Hong Kong', stars:5, price:340},
    {name:'Grand Hyatt Hong Kong', stars:5, price:420},
    {name:'JW Marriott Hotel Hong Kong', stars:5, price:380},
    {name:'Kerry Hotel Hong Kong', stars:5, price:280},
  ],
  'Kuala Lumpur':[
    {name:'Mandarin Oriental Kuala Lumpur', stars:5, price:220},
    {name:'The St. Regis Kuala Lumpur', stars:5, price:280},
    {name:'Four Seasons Hotel Kuala Lumpur', stars:5, price:240},
    {name:'Shangri-La Hotel Kuala Lumpur', stars:5, price:180},
    {name:'The Ritz-Carlton, Kuala Lumpur', stars:5, price:200},
    {name:'Banyan Tree Kuala Lumpur', stars:5, price:260},
    {name:'W Kuala Lumpur', stars:5, price:230},
    {name:'Hilton Kuala Lumpur', stars:5, price:140},
    {name:'EQ Kuala Lumpur', stars:5, price:160},
  ],
  'Penang':[
    {name:'Eastern & Oriental Hotel', stars:5, price:180},
    {name:'Shangri-La\'s Rasa Sayang Resort & Spa', stars:5, price:280},
    {name:'The Edison George Town', stars:4, price:120},
    {name:'Hard Rock Hotel Penang', stars:5, price:170},
    {name:'Lone Pine Hotel', stars:4, price:130},
    {name:'G Hotel Kelawai', stars:5, price:140},
    {name:'Macalister Mansion', stars:4, price:200},
  ],
  'Singapore':[
    {name:'Marina Bay Sands', stars:5, price:580},
    {name:'Raffles Hotel Singapore', stars:5, price:780},
    {name:'Mandarin Oriental Singapore', stars:5, price:480},
    {name:'The Fullerton Bay Hotel Singapore', stars:5, price:520},
    {name:'Capella Singapore', stars:5, price:680},
    {name:'The Ritz-Carlton, Millenia Singapore', stars:5, price:540},
    {name:'Four Seasons Hotel Singapore', stars:5, price:580},
    {name:'St. Regis Singapore', stars:5, price:620},
    {name:'Shangri-La Singapore', stars:5, price:340},
    {name:'Pan Pacific Singapore', stars:5, price:300},
    {name:'InterContinental Singapore', stars:5, price:380},
    {name:'Mandarin Oriental Pan Pacific', stars:5, price:380},
    {name:'PARKROYAL on Pickering', stars:5, price:280},
    {name:'JW Marriott Hotel Singapore South Beach', stars:5, price:340},
    {name:'Andaz Singapore', stars:5, price:320},
  ],
  _default: (city) => [
    {name:`${city} Marriott`, stars:5, price:280},
    {name:`${city} Hilton`, stars:5, price:240},
    {name:`${city} Hyatt`, stars:5, price:320},
    {name:`${city} InterContinental`, stars:5, price:380},
  ],
};
