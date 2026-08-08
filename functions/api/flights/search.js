// =========================================================
// GET /api/flights/search
//   ?from=ICN&to=DAD&date=2026-09-15&adults=2&children=0&infants=0
//
// 백엔드: Atlas (atriptech) — LCC 140여 개를 한 API로. 베트남 법인도 셀프 가입 가능해
// Duffel(베트남 법인 불가) 대신 채택했다.
//
// 동작 모드:
//   · ATLAS_CLIENT_ID/SECRET 없음 → 빈 결과 + 안내 (프론트는 "결과 없음"으로 표시)
//   · 키 있음                     → 실시간 검색
//
// 필요한 환경변수 (Cloudflare Pages → Settings → Variables and Secrets):
//   ATLAS_CLIENT_ID       x-atlas-client-id
//   ATLAS_CLIENT_SECRET   x-atlas-client-secret
//   FLIGHT_MARKUP_PERCENT 항공 마진율(%). 미설정 시 0.
//                         항공은 가격 비교가 투명해 2~3% 이상은 잘 안 팔린다.
//   ATLAS_BASE            검색 주소 덮어쓰기(선택). 샌드박스로 돌릴 때만 쓴다.
//
// 우리 계정에는 프로덕션 키만 있고 샌드박스 키는 만든 적이 없다.
// 샌드박스 주소로 프로덕션 키를 보내면 Atlas가 status 900(인증 실패)로 막는다.
// 검색은 조회일 뿐이라 발권되지 않으므로 프로덕션을 기본으로 둔다.
// 예약·결제는 다른 주소(https://api-sg.atriptech.com)를 쓴다 — 붙일 때 확인할 것.
// =========================================================
import { json, corsPreflight } from '../_lib.js';

export const onRequestOptions = corsPreflight;

const SEARCH_BASE = 'https://search-sg.atriptech.com';

// Atlas 검색 응답은 항공사 코드만 주고 이름을 주지 않는다 (airlineName은 예약 후 조회에만 존재).
// 우리 노선에 실제로 뜨는 항공사만 담았고, 없으면 코드를 그대로 보여준다.
const AIRLINES = {
  KE: '대한항공', OZ: '아시아나항공', '7C': '제주항공', LJ: '진에어', TW: '티웨이항공',
  BX: '에어부산', RS: '에어서울', YP: '에어프레미아', ZE: '이스타항공',
  VN: '베트남항공', VJ: '비엣젯항공', QH: '뱀부항공', BL: '퍼시픽항공', VZ: '타이비엣젯',
  AK: '에어아시아', D7: '에어아시아 X', FD: '타이에어아시아', QZ: '인도네시아에어아시아',
  TR: '스쿠트', SQ: '싱가포르항공', MI: '실크에어', TG: '타이항공', PG: '방콕에어웨이스',
  SL: '타이라이온에어', DD: '녹에어', JT: '라이온에어', QG: '시티링크', GA: '가루다인도네시아',
  PR: '필리핀항공', '5J': '세부퍼시픽', Z2: '필리핀에어아시아', MH: '말레이시아항공',
  JL: '일본항공', NH: '전일본공수', MM: '피치항공', GK: '젯스타재팬', '7G': '스타플라이어',
  CI: '중화항공', BR: '에바항공', IT: '타이거에어대만',
  CA: '중국국제항공', MU: '중국동방항공', CZ: '중국남방항공', HO: '준야오항공',
  CX: '캐세이퍼시픽', HX: '홍콩항공', UO: '홍콩익스프레스',
  '6E': '인디고', AI: '에어인디아', U2: '이지젯', FR: '라이언에어', W6: '위즈에어',
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const from     = (url.searchParams.get('from') || 'ICN').toUpperCase();
  const to       = (url.searchParams.get('to')   || 'DAD').toUpperCase();
  const date     = url.searchParams.get('date') || isoInDays(30);
  const adults   = clamp(parseInt(url.searchParams.get('adults')   || '1', 10), 1, 9);
  const children = clamp(parseInt(url.searchParams.get('children') || '0', 10), 0, 8);
  const infants  = clamp(parseInt(url.searchParams.get('infants')  || '0', 10), 0, adults);

  // 대시보드에서 붙여넣을 때 딸려오는 공백·줄바꿈은 그대로 두면 인증이 깨진다
  const clientId = (env.ATLAS_CLIENT_ID || '').trim();
  const clientSecret = (env.ATLAS_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    return json({
      provider: 'atlas',
      note: 'ATLAS_CLIENT_ID / ATLAS_CLIENT_SECRET 를 Cloudflare Pages 환경변수에 등록하면 실검색이 켜집니다.',
      results: [],
    });
  }

  const base = (env.ATLAS_BASE || SEARCH_BASE).replace(/\/+$/, '');
  const markup = parseFloat(env.FLIGHT_MARKUP_PERCENT || '0');

  // ?debug=1 — 응답을 가공하지 않고 Atlas 원문 상태만 돌려준다 (장애 원인 격리용)
  const debug = url.searchParams.get('debug') === '1';

  try {
    const res = await fetch(`${base}/search.do`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-atlas-client-id': clientId,
        'x-atlas-client-secret': clientSecret,
      },
      body: JSON.stringify({
        tripType: '1',              // 1=편도. 왕복은 retDate와 함께 '2'
        adultNum: adults,
        childNum: children,
        infantNum: infants,
        fromCity: from,
        toCity: to,
        fromDate: date.replace(/-/g, ''),   // Atlas는 YYYYMMDD
        currency: 'USD',
      }),
    });

    // 호출량 초과 응답은 형태가 다르다 (status 필드가 없다) → 먼저 걸러낸다
    if (res.status === 429) {
      const r = await res.json().catch(() => ({}));
      return json({ provider: 'atlas', error: '검색 요청이 몰리고 있어요. 잠시 후 다시 시도해주세요.', retryAfter: r.retryAfter ?? 1, results: [] }, 429);
    }

    if (debug) {
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch { /* 원문만 본다 */ }
      return json({
        debug: true, base, httpStatus: res.status, bodyLen: text.length,
        // 값은 절대 노출하지 않고, 잘려 들어갔는지만 알 수 있게 길이와 형태만 본다
        credShape: { idLen: clientId.length, secretLen: clientSecret.length,
                     idLooksUuid: /^[0-9a-f-]{20,}$/i.test(clientId) },
        atlasStatus: parsed?.status, atlasMsg: parsed?.msg,
        routings: parsed?.routings?.length ?? null,
        head: text.slice(0, 400),
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== 0) {
      // 5xx로 돌려주면 Cloudflare가 본문을 자기 오류 페이지로 갈아치워 원인이 사라진다.
      // 화면은 data.error만 보므로 200으로 내려 메시지를 살린다.
      return json({ provider: 'atlas', error: data.msg || `Atlas HTTP ${res.status}`, atlasStatus: data.status, results: [] });
    }

    const results = (data.routings || [])
      .map((r) => toCard(r, { from, to, adults, markup }))
      .filter(Boolean)
      .sort((a, b) => a.price - b.price)
      .slice(0, 15);

    return json({ provider: 'atlas', from, to, date, count: results.length, results });
  } catch (e) {
    return json({ provider: 'atlas', error: e.message, results: [] });
  }
}

// ── 응답 → 화면 카드 ────────────────────────────────────────────────────
// 순수 함수로 분리해 tests/flights.test.mjs 에서 검증한다.
export function toCard(r, { from, to, adults, markup = 0 }) {
  const segs = r.fromSegments || [];
  if (!segs.length) return null;

  const first = segs[0];
  const last = segs[segs.length - 1];
  const carrier = first.carrier || '';
  const price = Math.ceil(totalPrice(r, adults, segs.length) * (1 + markup / 100));

  return {
    id: r.routingIdentifier,
    provider: 'atlas',
    from: first.depAirport || from,
    to: last.arrAirport || to,
    depart: hhmm(first.depTime).date,
    departTime: hhmm(first.depTime).time,
    arriveTime: hhmm(last.arrTime).time,
    airline: carrier,
    airlineName: AIRLINES[carrier] || carrier,
    airlineLogo: null,                          // Atlas는 로고를 주지 않는다 → 화면이 기본 아이콘 사용
    flightNumber: first.flightNumber || '',
    stops: segs.length - 1,
    duration: isoDuration(segs.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)),
    price,
    currency: r.currency || 'USD',
    baggageInfo: baggage(r),
    expiresAt: r.expireTime,
    offerId: r.routingIdentifier,               // 예약 단계(verify.do)에서 그대로 사용, 6시간 유효
    bookingUrl: null,
  };
}

// 총액 = (성인운임 + 세금) × 인원 + 거래수수료(부과 방식별)
export function totalPrice(r, adults, segments) {
  const perPax = (Number(r.adultPrice) || 0) + (Number(r.adultTax) || 0);
  const fee = Number(r.transactionFee) || 0;
  const mode = r.transactionFeeMode;

  let feeTotal;
  if (mode === 'PER_BOOKING') feeTotal = fee;
  else if (mode === 'PER_SEGMENT') feeTotal = fee * adults * segments;
  else feeTotal = fee * adults;              // PER_PAX · PER_TICKET · 미지정

  return perPax * adults + feeTotal;
}

// Atlas 시각은 "yyyyMMddHHmm" 현지시각. 문서에는 YYYYMMDD로 잘못 적혀 있어 길이를 확인하고 쓴다.
export function hhmm(v) {
  const s = String(v ?? '');
  if (!/^\d{12}$/.test(s)) return { date: s.slice(0, 8) || '', time: '' };
  return {
    date: `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`,
    time: `${s.slice(8, 10)}:${s.slice(10, 12)}`,
  };
}

// ponytail: 경유편은 대기시간을 뺀 순수 비행시간만 합산한다.
// 정확한 총 소요시간은 공항별 시간대가 필요한데 Atlas가 주지 않는다.
export function isoDuration(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `PT${h ? h + 'H' : ''}${m ? m + 'M' : ''}`;
}

// 무료 수하물만 표기한다 (유료 추가분은 ancillaryProductElements 쪽이라 예약 단계에서 노출)
export function baggage(r) {
  if (r?.rule?.hasBaggage !== 1) return null;
  const parts = [];
  for (const b of r.rule.baggageElements || []) {
    if (b.passengerType !== 0 && b.passengerType != null) continue;   // 성인 기준만
    const label = /Cabin/i.test(b.baggageType || '') ? '기내' : '위탁';
    if (parts.some((p) => p.startsWith(label))) continue;             // 구간별 중복 제거
    const w = Number(b.baggageWeight) || 0;
    const pc = Number(b.baggagePiece) || 0;
    if (w > 0) parts.push(`${label} ${w}kg`);
    else if (w === -1) parts.push(`${label} 무제한`);
    else if (pc > 0) parts.push(`${label} ${pc}개`);
  }
  return parts.join(' · ') || null;
}

// ── 잡다한 것들 ─────────────────────────────────────────────────────────
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

function isoInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
