// =========================================================
// POST /api/flights/book
//
// Body JSON:
// {
//   offerId: "off_...",          // from /api/flights/search (Duffel)
//   passengers: [
//     { type:"adult", given_name:"Isaac", family_name:"Moon",
//       born_on:"1990-01-01", gender:"m",
//       email:"test@example.com", phone_number:"+821012345678",
//       identity_documents:[{ type:"passport", unique_identifier:"AB1234567",
//                             expires_on:"2030-01-01", issuing_country_code:"KR" }]
//     }
//   ],
//   payments: [
//     { type:"balance", currency:"USD", amount:"199.00" }
//   ]
// }
//
// Required env: DUFFEL_API_KEY
// =========================================================
import { json, corsPreflight } from '../_lib.js';

export const onRequestOptions = corsPreflight;

export async function onRequestPost({ request, env }) {
  if (!env.DUFFEL_API_KEY) {
    return json({ error: 'DUFFEL_API_KEY not configured', code: 'no_key' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { offerId, passengers, payments } = body || {};
  if (!offerId || !passengers?.length || !payments?.length) {
    return json({ error: 'offerId, passengers, and payments are required' }, 400);
  }

  const headers = {
    'Authorization':  `Bearer ${env.DUFFEL_API_KEY}`,
    'Content-Type':   'application/json',
    'Duffel-Version': 'v2',
    'Accept':         'application/json',
  };

  try {
    const res = await fetch('https://api.duffel.com/air/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'instant',
          selected_offers: [offerId],
          passengers,
          payments,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.errors?.[0]?.message || res.statusText;
      return json({ error: errMsg, code: data?.errors?.[0]?.code, raw: data }, res.status);
    }

    const order = data?.data;
    return json({
      success: true,
      orderId:       order?.id,
      bookingRef:    order?.booking_reference,
      status:        order?.payment_status?.awaiting_payment ? 'pending_payment' : 'confirmed',
      totalAmount:   order?.total_amount,
      totalCurrency: order?.total_currency,
      passengers:    order?.passengers?.map(p => ({
        id: p.id, name: `${p.given_name} ${p.family_name}`,
      })),
      slices: order?.slices?.map(s => ({
        origin:      s.origin?.iata_code,
        destination: s.destination?.iata_code,
        departure:   s.segments?.[0]?.departing_at,
        arrival:     s.segments?.[s.segments.length-1]?.arriving_at,
      })),
      documents: order?.documents || [],
    });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
