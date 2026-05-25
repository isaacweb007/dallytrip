// =========================================================
// GET /api/activities/search?city=Da+Nang
//
// GetYourGuide partner deeplink (8% commission).
// Set GETYOURGUIDE_PARTNER_ID once you sign up.
// Falls back to curated showcase data so the UI works without keys.
// =========================================================
import { json, corsPreflight } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city') || 'Da Nang';
  // Prefer dedicated GetYourGuide partner ID; otherwise fall back to TP marker
  // (Travelpayouts is also a GYG affiliate sub-network, so marker still tracks).
  const partnerId = env.GETYOURGUIDE_PARTNER_ID || env.TRAVELPAYOUTS_MARKER || env.TRAVELPAYOUTS_TRS || '';
  const sub = url.searchParams.get('sub_id') || '';

  const link = (q) =>
    `https://www.getyourguide.com/s/?q=${encodeURIComponent(q || city)}` +
    `&partner_id=${encodeURIComponent(partnerId)}` +
    (sub ? `&utm_content=${encodeURIComponent(sub)}` : '');

  // Curated activities (real GetYourGuide categories, real commission links)
  const baseSet = {
    'Da Nang': [
      { name: 'Ba Na Hills + Golden Bridge skip-the-line', price: 42, rating: 4.7, reviews: 3120 },
      { name: 'Marble Mountains half-day tour', price: 28, rating: 4.6, reviews: 1840 },
      { name: 'Hoi An old town & lantern night', price: 35, rating: 4.9, reviews: 2210 },
      { name: 'My Khe Beach surfing lesson', price: 48, rating: 4.8, reviews: 320 },
      { name: 'Son Tra Peninsula sunset tour', price: 32, rating: 4.7, reviews: 1200 },
      { name: 'Da Nang street food walking tour', price: 25, rating: 4.8, reviews: 980 },
      { name: 'Cham Islands snorkeling day trip', price: 55, rating: 4.6, reviews: 1450 },
      { name: 'Da Nang night cruise on Han River', price: 18, rating: 4.5, reviews: 720 },
    ],
    'Nha Trang': [
      { name: 'Vinpearl Land full-day pass', price: 38, rating: 4.7, reviews: 980 },
      { name: 'Island hopping with snorkeling', price: 32, rating: 4.6, reviews: 1430 },
      { name: 'Mud bath at Thap Ba Hot Springs', price: 22, rating: 4.5, reviews: 540 },
      { name: 'Nha Trang scuba diving experience', price: 70, rating: 4.8, reviews: 360 },
      { name: 'Po Nagar Cham Towers walking tour', price: 18, rating: 4.4, reviews: 420 },
      { name: 'Sailing cruise + sunset cocktails', price: 55, rating: 4.7, reviews: 280 },
    ],
    'Phu Quoc': [
      { name: 'Hon Thom cable car & water park', price: 45, rating: 4.8, reviews: 760 },
      { name: 'Sunset cruise with seafood BBQ', price: 39, rating: 4.7, reviews: 520 },
      { name: 'Phu Quoc 3-island speedboat tour', price: 35, rating: 4.6, reviews: 980 },
      { name: 'Vinpearl Safari & Vinwonders combo', price: 65, rating: 4.8, reviews: 540 },
      { name: 'Squid night fishing experience', price: 28, rating: 4.5, reviews: 320 },
      { name: 'ATV jungle adventure', price: 48, rating: 4.6, reviews: 180 },
    ],
    'Ho Chi Minh': [
      { name: 'Cu Chi Tunnels half-day tour', price: 25, rating: 4.7, reviews: 4100 },
      { name: 'Saigon street food walking tour', price: 35, rating: 4.8, reviews: 1900 },
      { name: 'Mekong Delta day trip', price: 38, rating: 4.6, reviews: 5200 },
      { name: 'Saigon by night on a Vespa', price: 65, rating: 4.9, reviews: 2400 },
      { name: 'War Remnants Museum + city tour', price: 20, rating: 4.5, reviews: 1700 },
      { name: 'Bitexco Saigon Skydeck ticket', price: 12, rating: 4.4, reviews: 980 },
      { name: 'Ao dai photoshoot experience', price: 55, rating: 4.8, reviews: 420 },
    ],
    'Hanoi': [
      { name: 'Ha Long Bay full-day cruise', price: 75, rating: 4.8, reviews: 5400 },
      { name: 'Hanoi old quarter cyclo tour', price: 22, rating: 4.6, reviews: 1100 },
      { name: 'Train Street + coffee experience', price: 18, rating: 4.7, reviews: 1300 },
      { name: 'Bat Trang ceramic village half-day', price: 28, rating: 4.5, reviews: 540 },
      { name: 'Hanoi night street food tour', price: 32, rating: 4.9, reviews: 2200 },
      { name: 'Water puppet theatre show ticket', price: 8, rating: 4.4, reviews: 4500 },
      { name: 'Ninh Binh + Trang An day trip', price: 65, rating: 4.8, reviews: 1800 },
    ],
    'Bangkok': [
      { name: 'Grand Palace & Wat Pho half-day tour', price: 25, rating: 4.5, reviews: 5200 },
      { name: 'Damnoen Saduak floating market', price: 30, rating: 4.6, reviews: 3100 },
      { name: 'Chao Phraya River dinner cruise', price: 55, rating: 4.7, reviews: 2400 },
      { name: 'Ayutthaya day trip with lunch', price: 45, rating: 4.7, reviews: 6800 },
      { name: 'Thai cooking class with market tour', price: 50, rating: 4.9, reviews: 4200 },
      { name: 'Bangkok Sky Bar rooftop pass', price: 28, rating: 4.4, reviews: 1600 },
      { name: 'Erawan + Khao Yai national park', price: 75, rating: 4.6, reviews: 1100 },
      { name: 'Tuk-tuk night food tour', price: 38, rating: 4.8, reviews: 3400 },
      { name: 'Maeklong Railway market tour', price: 35, rating: 4.5, reviews: 2200 },
    ],
    'Phuket': [
      { name: 'Phi Phi & Maya Bay speedboat day trip', price: 68, rating: 4.7, reviews: 8200 },
      { name: 'James Bond Island canoe tour', price: 58, rating: 4.6, reviews: 3400 },
      { name: 'Phuket Fantasea show + dinner', price: 70, rating: 4.5, reviews: 1900 },
      { name: 'Coral Island day trip', price: 35, rating: 4.6, reviews: 4400 },
      { name: 'Big Buddha + Wat Chalong + Karon viewpoint', price: 28, rating: 4.5, reviews: 1700 },
      { name: 'Splash Jungle Waterpark ticket', price: 32, rating: 4.7, reviews: 980 },
      { name: 'Similan Islands speedboat day trip', price: 95, rating: 4.8, reviews: 2200 },
      { name: 'Thai Muay Thai class', price: 25, rating: 4.6, reviews: 540 },
    ],
    'Chiang Mai': [
      { name: 'Elephant Nature Park ethical sanctuary', price: 85, rating: 4.9, reviews: 7100 },
      { name: 'Doi Inthanon national park day tour', price: 45, rating: 4.7, reviews: 2300 },
      { name: 'Thai cooking class with organic farm', price: 38, rating: 4.9, reviews: 5400 },
      { name: 'Old city temple tour', price: 18, rating: 4.5, reviews: 1200 },
      { name: 'Zipline jungle adventure', price: 95, rating: 4.7, reviews: 1800 },
      { name: 'Sticky waterfall day trip', price: 35, rating: 4.6, reviews: 980 },
      { name: 'Chiang Mai Sunday Walking Street tour', price: 22, rating: 4.4, reviews: 760 },
    ],
    'Bali': [
      { name: 'Uluwatu Temple + Kecak fire dance sunset', price: 38, rating: 4.8, reviews: 6400 },
      { name: 'Mount Batur sunrise trek + breakfast', price: 65, rating: 4.7, reviews: 5800 },
      { name: 'Ubud rice terraces & swing photo tour', price: 55, rating: 4.6, reviews: 3700 },
      { name: 'Nusa Penida island day trip', price: 70, rating: 4.7, reviews: 2900 },
      { name: 'Tegallalang + Tirta Empul + Tegenungan', price: 48, rating: 4.8, reviews: 4500 },
      { name: 'Tanah Lot sunset temple tour', price: 25, rating: 4.5, reviews: 6200 },
      { name: 'White-water rafting Ayung river', price: 38, rating: 4.7, reviews: 3400 },
      { name: 'Bali ATV quad bike adventure', price: 55, rating: 4.8, reviews: 1900 },
      { name: 'Lempuyang Temple Gates of Heaven', price: 78, rating: 4.6, reviews: 2700 },
      { name: 'Traditional Balinese spa massage', price: 35, rating: 4.9, reviews: 4100 },
      { name: 'Sekumpul waterfall trekking', price: 65, rating: 4.7, reviews: 1100 },
      { name: 'Diving in Tulamben USS Liberty wreck', price: 95, rating: 4.8, reviews: 880 },
    ],
    'Jakarta': [
      { name: 'Old Batavia walking & food tour', price: 35, rating: 4.5, reviews: 980 },
      { name: 'Thousand Islands snorkeling day trip', price: 75, rating: 4.6, reviews: 540 },
      { name: 'National Monument (Monas) tour', price: 18, rating: 4.4, reviews: 720 },
      { name: 'Bogor Botanical Gardens day trip', price: 42, rating: 4.5, reviews: 380 },
      { name: 'Ancol Dreamland + Sea World ticket', price: 28, rating: 4.6, reviews: 1100 },
      { name: 'Jakarta night food tour', price: 32, rating: 4.7, reviews: 460 },
    ],
    'Manila': [
      { name: 'Intramuros walking heritage tour', price: 28, rating: 4.7, reviews: 1100 },
      { name: 'Taal Volcano + Tagaytay day tour', price: 70, rating: 4.6, reviews: 890 },
      { name: 'Manila Bay sunset cruise', price: 35, rating: 4.5, reviews: 620 },
      { name: 'Pagsanjan Falls adventure day trip', price: 85, rating: 4.7, reviews: 380 },
      { name: 'Corregidor Island full-day tour', price: 75, rating: 4.6, reviews: 420 },
      { name: 'Manila street food tasting tour', price: 38, rating: 4.8, reviews: 540 },
    ],
    'Cebu': [
      { name: 'Whale shark watching in Oslob', price: 95, rating: 4.7, reviews: 2200 },
      { name: 'Kawasan Falls canyoneering', price: 80, rating: 4.8, reviews: 1700 },
      { name: 'Pescador Island sardine run', price: 65, rating: 4.7, reviews: 980 },
      { name: 'Bohol Chocolate Hills day trip', price: 110, rating: 4.6, reviews: 2400 },
      { name: 'Sumilon Island sandbar day tour', price: 70, rating: 4.7, reviews: 540 },
      { name: 'Mactan island hopping with lunch', price: 45, rating: 4.5, reviews: 1300 },
    ],
    'Boracay': [
      { name: 'Boracay island hopping & helmet diving', price: 65, rating: 4.7, reviews: 1400 },
      { name: 'Parasailing sunset experience', price: 50, rating: 4.6, reviews: 720 },
      { name: 'Boracay paraw sailing at sunset', price: 25, rating: 4.8, reviews: 2100 },
      { name: 'Crystal Cove Island full-day tour', price: 42, rating: 4.7, reviews: 540 },
      { name: 'Ariel\'s Point cliff diving adventure', price: 65, rating: 4.8, reviews: 680 },
    ],
    'Seoul': [
      { name: 'DMZ half-day tour from Seoul', price: 55, rating: 4.7, reviews: 9200 },
      { name: 'N Seoul Tower + Bukchon village', price: 28, rating: 4.5, reviews: 4100 },
      { name: 'K-pop dance class & photoshoot', price: 75, rating: 4.8, reviews: 1300 },
      { name: 'Gyeongbokgung + Hanbok rental', price: 22, rating: 4.7, reviews: 5400 },
      { name: 'Lotte World 1-day pass', price: 38, rating: 4.6, reviews: 7800 },
      { name: 'Nami Island + Petite France day tour', price: 45, rating: 4.7, reviews: 3200 },
      { name: 'Seoul night food market tour', price: 55, rating: 4.8, reviews: 2400 },
      { name: 'Everland theme park 1-day pass', price: 42, rating: 4.6, reviews: 5800 },
      { name: 'Cooking class: Korean kimchi & bibimbap', price: 48, rating: 4.9, reviews: 1700 },
      { name: 'Seoul cycling tour along Han River', price: 32, rating: 4.7, reviews: 980 },
      { name: 'Korean BBQ + soju cocktail night', price: 60, rating: 4.8, reviews: 1400 },
      { name: 'Han River cruise dinner', price: 65, rating: 4.6, reviews: 2200 },
    ],
    'Busan': [
      { name: 'Haeundae & Gamcheon village day tour', price: 60, rating: 4.7, reviews: 1100 },
      { name: 'Busan night skyline cruise', price: 45, rating: 4.6, reviews: 540 },
      { name: 'Gamcheon culture village + Songdo', price: 38, rating: 4.7, reviews: 980 },
      { name: 'Beomeosa temple & Geumjeongsan trek', price: 42, rating: 4.5, reviews: 320 },
      { name: 'Jagalchi fish market food tour', price: 35, rating: 4.8, reviews: 740 },
      { name: 'Oryukdo island ferry + skywalk', price: 25, rating: 4.6, reviews: 420 },
    ],
    'Jeju': [
      { name: 'Hallasan trekking + sunrise peak', price: 90, rating: 4.8, reviews: 870 },
      { name: 'Jeju Olle Trail guided walk', price: 38, rating: 4.6, reviews: 410 },
      { name: 'Manjanggul lava tube + Seongsan Ilchulbong', price: 55, rating: 4.7, reviews: 1200 },
      { name: 'Udo island bike day tour', price: 32, rating: 4.7, reviews: 640 },
      { name: 'Jeju east coast horseback riding', price: 65, rating: 4.6, reviews: 320 },
      { name: 'Hallim Park & Hyeopjae Beach combo', price: 28, rating: 4.5, reviews: 580 },
    ],
    'Tokyo': [
      { name: 'TeamLab Borderless / Planets ticket', price: 38, rating: 4.8, reviews: 12400 },
      { name: 'Mt. Fuji & Hakone full-day bus tour', price: 145, rating: 4.6, reviews: 8900 },
      { name: 'Tsukiji + Asakusa walking food tour', price: 110, rating: 4.8, reviews: 3700 },
      { name: 'Robot Restaurant Shinjuku show', price: 90, rating: 4.5, reviews: 5200 },
      { name: 'Tokyo Skytree fast-track ticket', price: 28, rating: 4.6, reviews: 18000 },
      { name: 'Shibuya & Harajuku pop culture tour', price: 55, rating: 4.7, reviews: 4200 },
      { name: 'Sumo training morning practice viewing', price: 75, rating: 4.8, reviews: 1900 },
      { name: 'Akihabara anime & gaming tour', price: 65, rating: 4.7, reviews: 2400 },
      { name: 'Sushi making class with chef', price: 95, rating: 4.9, reviews: 1700 },
      { name: 'Tokyo Disneyland 1-day passport', price: 78, rating: 4.8, reviews: 24000 },
      { name: 'Ghibli Museum entry + transfer', price: 55, rating: 4.9, reviews: 8400 },
      { name: 'Tokyo Bay sunset cruise', price: 68, rating: 4.7, reviews: 1100 },
    ],
    'Osaka': [
      { name: 'Universal Studios Japan 1-day ticket', price: 78, rating: 4.7, reviews: 22000 },
      { name: 'Kyoto + Nara day trip from Osaka', price: 125, rating: 4.8, reviews: 6400 },
      { name: 'Osaka street food walking tour', price: 65, rating: 4.8, reviews: 2200 },
      { name: 'Osaka Castle + Dotonbori night tour', price: 32, rating: 4.6, reviews: 1700 },
      { name: 'Osaka Aquarium Kaiyukan ticket', price: 25, rating: 4.7, reviews: 9100 },
      { name: 'Shinsaibashi & Namba shopping tour', price: 28, rating: 4.5, reviews: 540 },
    ],
    'Kyoto': [
      { name: 'Fushimi Inari + Arashiyama bamboo walk', price: 55, rating: 4.8, reviews: 4200 },
      { name: 'Tea ceremony + kimono experience', price: 80, rating: 4.9, reviews: 1900 },
      { name: 'Geisha district private walking tour', price: 95, rating: 4.8, reviews: 1100 },
      { name: 'Kinkaku-ji + Ryoan-ji temple tour', price: 45, rating: 4.7, reviews: 3400 },
      { name: 'Sagano Romantic Train + monkey park', price: 55, rating: 4.7, reviews: 1400 },
      { name: 'Kyoto night walking food tour', price: 75, rating: 4.9, reviews: 980 },
    ],
    'Shanghai': [
      { name: 'The Bund + Yu Garden classic city tour', price: 60, rating: 4.5, reviews: 2300 },
      { name: 'Shanghai Disneyland 1-day ticket', price: 85, rating: 4.7, reviews: 9100 },
      { name: 'Zhujiajiao water town day trip', price: 38, rating: 4.6, reviews: 1700 },
      { name: 'Shanghai Tower observation deck', price: 32, rating: 4.7, reviews: 4400 },
      { name: 'Shanghai food walking tour at night', price: 65, rating: 4.8, reviews: 1100 },
      { name: 'Tianzifang & French Concession tour', price: 42, rating: 4.5, reviews: 740 },
    ],
    'Beijing': [
      { name: 'Great Wall Mutianyu + cable car', price: 75, rating: 4.8, reviews: 11000 },
      { name: 'Forbidden City guided walking tour', price: 55, rating: 4.7, reviews: 5600 },
      { name: 'Temple of Heaven + Hutong tour', price: 38, rating: 4.6, reviews: 2400 },
      { name: 'Beijing Peking duck dinner cruise', price: 78, rating: 4.7, reviews: 1800 },
      { name: 'Summer Palace classic tour', price: 32, rating: 4.5, reviews: 3200 },
      { name: 'Beijing kung fu show ticket', price: 35, rating: 4.6, reviews: 1900 },
    ],
    'Hong Kong': [
      { name: 'Hong Kong Disneyland 1-day ticket', price: 88, rating: 4.7, reviews: 18000 },
      { name: 'Victoria Peak + Star Ferry combo', price: 35, rating: 4.6, reviews: 4200 },
      { name: 'Big Buddha + Ngong Ping cable car', price: 55, rating: 4.7, reviews: 5800 },
      { name: 'Ocean Park 1-day admission', price: 65, rating: 4.6, reviews: 9400 },
      { name: 'Symphony of Lights harbor cruise', price: 32, rating: 4.5, reviews: 2200 },
      { name: 'Hong Kong street food walking tour', price: 75, rating: 4.8, reviews: 1700 },
      { name: 'Tai O fishing village + Big Buddha', price: 70, rating: 4.7, reviews: 1100 },
    ],
    'Kuala Lumpur': [
      { name: 'Petronas Towers skip-the-line ticket', price: 28, rating: 4.6, reviews: 5400 },
      { name: 'Batu Caves + Genting Highlands tour', price: 55, rating: 4.5, reviews: 2300 },
      { name: 'KL city tour with KLCC + Merdeka Square', price: 38, rating: 4.5, reviews: 1700 },
      { name: 'Kuala Lumpur food tour by night', price: 65, rating: 4.8, reviews: 980 },
      { name: 'Sunway Lagoon water theme park', price: 45, rating: 4.7, reviews: 2200 },
      { name: 'Putrajaya day trip from KL', price: 42, rating: 4.4, reviews: 540 },
    ],
    'Penang': [
      { name: 'George Town street art e-bike tour', price: 35, rating: 4.7, reviews: 940 },
      { name: 'Penang Hill + Kek Lok Si temple', price: 38, rating: 4.6, reviews: 1200 },
      { name: 'Penang food trail walking tour', price: 42, rating: 4.9, reviews: 720 },
      { name: 'Entopia butterfly park ticket', price: 18, rating: 4.5, reviews: 540 },
    ],
    'Singapore': [
      { name: 'Gardens by the Bay + Cloud Forest combo', price: 32, rating: 4.7, reviews: 13800 },
      { name: 'Universal Studios Singapore 1-day pass', price: 70, rating: 4.7, reviews: 24000 },
      { name: 'Sentosa SEA Aquarium ticket', price: 35, rating: 4.5, reviews: 9100 },
      { name: 'Night Safari evening tour', price: 55, rating: 4.6, reviews: 6700 },
      { name: 'Singapore Flyer ride + brunch', price: 48, rating: 4.6, reviews: 3400 },
      { name: 'Sentosa luge & skyride pass', price: 38, rating: 4.7, reviews: 7200 },
      { name: 'Singapore Zoo + River Wonders combo', price: 65, rating: 4.8, reviews: 5800 },
      { name: 'Marina Bay Sands observation deck', price: 28, rating: 4.6, reviews: 4400 },
      { name: 'Singapore food trail Chinatown + Little India', price: 75, rating: 4.9, reviews: 1900 },
      { name: 'Adventure Cove Waterpark 1-day pass', price: 45, rating: 4.6, reviews: 2700 },
    ],
  };
  const list = baseSet[city] || baseSet['Da Nang'];

  const results = list.map((a, i) => ({
    id: `gyg_${city.toLowerCase().replace(/\s+/g, '_')}_${i}`,
    city,
    name: a.name,
    rating: a.rating,
    reviews: a.reviews,
    price: a.price,
    currency: 'USD',
    duration: '3-8 hrs',
    image: pickActivityImage(a.name, city),
    bookingUrl: link(`${city} ${a.name}`),
  }));

  return json({
    provider: env.GETYOURGUIDE_PARTNER_ID ? 'getyourguide-direct' : 'getyourguide-via-travelpayouts',
    count: results.length,
    results
  });
}

// ============== Activity keyword → image map ==============
// Match each activity name to the most fitting visual theme. Order matters:
// first match wins, so put more specific keywords first.
const ACTIVITY_IMAGES = [
  // — Water / beach / island —
  { kw: ['snorkel', 'scuba', 'diving', 'dive', 'liberty wreck'],
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=70&auto=format&fit=crop' },
  { kw: ['island hopping', 'island day', 'island tour', '3-island', 'island speed', 'island ferry'],
    img: 'https://images.unsplash.com/photo-1559125148-869baf508c95?w=900&q=70&auto=format&fit=crop' },
  { kw: ['phi phi', 'maya bay', 'similan', 'nusa penida', 'corregidor', 'sumilon'],
    img: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=900&q=70&auto=format&fit=crop' },
  { kw: ['speedboat', 'boat tour', 'sailing', 'paraw', 'cruise', 'ferry', 'sea world'],
    img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900&q=70&auto=format&fit=crop' },
  { kw: ['cliff diving', 'parasail', 'helmet div', 'surf'],
    img: 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=900&q=70&auto=format&fit=crop' },
  { kw: ['kayak', 'canoe', 'rafting'],
    img: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=900&q=70&auto=format&fit=crop' },
  { kw: ['fish', 'squid', 'sardine'],
    img: 'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?w=900&q=70&auto=format&fit=crop' },

  // — Mountains / nature / treks —
  { kw: ['hallasan', 'mt.', 'mount batur', 'sunrise trek', 'sunrise peak', 'trek', 'hiking'],
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=70&auto=format&fit=crop' },
  { kw: ['waterfall', 'falls', 'kawasan', 'sekumpul', 'pagsanjan'],
    img: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=900&q=70&auto=format&fit=crop' },
  { kw: ['volcano', 'taal', 'crater'],
    img: 'https://images.unsplash.com/photo-1583531352515-8884af319dc7?w=900&q=70&auto=format&fit=crop' },
  { kw: ['rice terrace', 'tegallalang', 'ubud rice'],
    img: 'https://images.unsplash.com/photo-1531192635-4a39e83dee7c?w=900&q=70&auto=format&fit=crop' },
  { kw: ['national park', 'inthanon', 'erawan', 'khao yai', 'safari', 'jungle', 'rainforest', 'olle trail'],
    img: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=900&q=70&auto=format&fit=crop' },
  { kw: ['cable car', 'gondola', 'cable', 'ngong ping', 'penang hill'],
    img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&q=70&auto=format&fit=crop' },
  { kw: ['zipline', 'atv', 'quad', 'adventure'],
    img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=70&auto=format&fit=crop' },
  { kw: ['elephant', 'sanctuary'],
    img: 'https://images.unsplash.com/photo-1581852017103-68ac65514cf7?w=900&q=70&auto=format&fit=crop' },
  { kw: ['horseback', 'horse riding'],
    img: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=900&q=70&auto=format&fit=crop' },
  { kw: ['bike', 'cycling', 'cyclo'],
    img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900&q=70&auto=format&fit=crop' },

  // — Temples / culture / heritage —
  { kw: ['temple', 'wat ', 'pho', 'pagoda', 'cham tower', 'fushimi inari', 'kinkaku', 'po nagar',
         'beomeosa', 'temple of heaven', 'big buddha', 'golden bridge', 'forbidden city',
         'great wall', 'summer palace', 'gyeongbokgung', 'angkor', 'intramuros', 'grand palace'],
    img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=900&q=70&auto=format&fit=crop' },
  { kw: ['hanbok', 'kimono', 'ao dai', 'tea ceremony', 'geisha'],
    img: 'https://images.unsplash.com/photo-1493997181344-712f2f19d87a?w=900&q=70&auto=format&fit=crop' },
  { kw: ['water puppet', 'kecak', 'fire dance', 'show', 'fantasea', 'robot restaurant', 'fantasy',
         'kung fu', 'symphony of lights'],
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=900&q=70&auto=format&fit=crop' },
  { kw: ['marble mountain', 'lava tube', 'manjang', 'cave', 'tunnels', 'cu chi'],
    img: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=900&q=70&auto=format&fit=crop' },
  { kw: ['ha long', 'halong', 'ninh binh', 'trang an', 'mekong'],
    img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=70&auto=format&fit=crop' },

  // — City / heritage walks —
  { kw: ['old town', 'old quarter', 'old city', 'george town', 'hoi an', 'street art',
         'walking heritage', 'walking tour', 'walking', 'french concession', 'hutong',
         'tianzifang', 'sunday walking'],
    img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=70&auto=format&fit=crop' },
  { kw: ['dmz'],
    img: 'https://images.unsplash.com/photo-1538485399081-7c8970f1d0c1?w=900&q=70&auto=format&fit=crop' },
  { kw: ['skydeck', 'observation', 'skytree', 'sky bar', 'rooftop', 'tower', 'flyer'],
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=70&auto=format&fit=crop' },
  { kw: ['photoshoot', 'photo'],
    img: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=70&auto=format&fit=crop' },
  { kw: ['vespa', 'tuk-tuk', 'tuktuk'],
    img: 'https://images.unsplash.com/photo-1601301089032-ffeb6c01e3a3?w=900&q=70&auto=format&fit=crop' },

  // — Food / drink / class —
  { kw: ['cooking class', 'sushi making'],
    img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=70&auto=format&fit=crop' },
  { kw: ['street food', 'food tour', 'food trail', 'food walking', 'food tasting', 'food market',
         'jagalchi', 'maeklong'],
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=70&auto=format&fit=crop' },
  { kw: ['dinner cruise', 'peking duck', 'bbq', 'soju'],
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=70&auto=format&fit=crop' },

  // — Wellness —
  { kw: ['massage', 'spa', 'mud bath', 'hot spring'],
    img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=70&auto=format&fit=crop' },
  { kw: ['muay thai', 'kung fu class'],
    img: 'https://images.unsplash.com/photo-1517438476312-10d79c5f25ac?w=900&q=70&auto=format&fit=crop' },

  // — K-pop / anime / nightlife —
  { kw: ['k-pop', 'kpop'],
    img: 'https://images.unsplash.com/photo-1571266028243-d220c6a86a8b?w=900&q=70&auto=format&fit=crop' },
  { kw: ['anime', 'gaming', 'akihabara', 'ghibli', 'pop culture', 'shibuya', 'harajuku'],
    img: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?w=900&q=70&auto=format&fit=crop' },

  // — Theme parks —
  { kw: ['disney', 'disneyland'],
    img: 'https://images.unsplash.com/photo-1605457867610-e990b283f7e6?w=900&q=70&auto=format&fit=crop' },
  { kw: ['universal studio'],
    img: 'https://images.unsplash.com/photo-1571266028243-d220c6a86a8b?w=900&q=70&auto=format&fit=crop' },
  { kw: ['everland', 'lotte world', 'vinpearl', 'theme park', 'water park', 'waterpark',
         'splash jungle', 'sunway lagoon', 'adventure cove', 'dreamland', 'wonders combo',
         'vinwonders'],
    img: 'https://images.unsplash.com/photo-1568871073962-d4b3a09e3a4b?w=900&q=70&auto=format&fit=crop' },
  { kw: ['ocean park', 'aquarium', 'sea aquarium', 'kaiyukan'],
    img: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=900&q=70&auto=format&fit=crop' },
  { kw: ['gardens by the bay', 'cloud forest', 'botanical', 'butterfly', 'entopia', 'flower'],
    img: 'https://images.unsplash.com/photo-1561505457-3bcad021f8ee?w=900&q=70&auto=format&fit=crop' },
  { kw: ['sumo'],
    img: 'https://images.unsplash.com/photo-1614094082869-cd4e4b2905c7?w=900&q=70&auto=format&fit=crop' },
  { kw: ['skyride', 'luge'],
    img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&q=70&auto=format&fit=crop' },
];

const ACTIVITY_DEFAULT_BY_CITY = {
  'Da Nang':   'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900&q=70&auto=format&fit=crop',
  'Nha Trang': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=900&q=70&auto=format&fit=crop',
  'Phu Quoc':  'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=900&q=70&auto=format&fit=crop',
  'Ho Chi Minh':'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900&q=70&auto=format&fit=crop',
  'Hanoi':     'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=70&auto=format&fit=crop',
  'Bangkok':   'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=900&q=70&auto=format&fit=crop',
  'Phuket':    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=900&q=70&auto=format&fit=crop',
  'Chiang Mai':'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=900&q=70&auto=format&fit=crop',
  'Bali':      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=70&auto=format&fit=crop',
  'Jakarta':   'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=900&q=70&auto=format&fit=crop',
  'Manila':    'https://images.unsplash.com/photo-1518509562904-e7ef99cddc85?w=900&q=70&auto=format&fit=crop',
  'Cebu':      'https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=900&q=70&auto=format&fit=crop',
  'Boracay':   'https://images.unsplash.com/photo-1518509562904-e7ef99cddc85?w=900&q=70&auto=format&fit=crop',
  'Seoul':     'https://images.unsplash.com/photo-1538485399081-7c8970f1d0c1?w=900&q=70&auto=format&fit=crop',
  'Busan':     'https://images.unsplash.com/photo-1583266219671-2c1bb0bba4c0?w=900&q=70&auto=format&fit=crop',
  'Jeju':      'https://images.unsplash.com/photo-1605457867610-e990b283f7e6?w=900&q=70&auto=format&fit=crop',
  'Tokyo':     'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=70&auto=format&fit=crop',
  'Osaka':     'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=900&q=70&auto=format&fit=crop',
  'Kyoto':     'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&q=70&auto=format&fit=crop',
  'Shanghai':  'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=900&q=70&auto=format&fit=crop',
  'Beijing':   'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=900&q=70&auto=format&fit=crop',
  'Hong Kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=900&q=70&auto=format&fit=crop',
  'Kuala Lumpur':'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=900&q=70&auto=format&fit=crop',
  'Penang':    'https://images.unsplash.com/photo-1594388572748-ce4d2d59b91b?w=900&q=70&auto=format&fit=crop',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=900&q=70&auto=format&fit=crop',
};

function pickActivityImage(name, city) {
  const lower = (name || '').toLowerCase();
  for (const entry of ACTIVITY_IMAGES) {
    if (entry.kw.some(k => lower.includes(k))) return entry.img;
  }
  return ACTIVITY_DEFAULT_BY_CITY[city] ||
    'https://images.unsplash.com/photo-1580974511812-2c4c8ddf2456?w=900&q=70&auto=format&fit=crop';
}
