// =========================================================
// POST /api/flights/uat   — Atlas Core UAT용 예약 체인 (내부 전용)
//
// Atlas는 Core UAT(Flight Booking 2건)를 통과해야 계정 API를 열어준다.
// UAT는 "샌드박스 주문을 실제로 만들어 orderNo를 제출"하는 방식이라,
// 손님용 결제 화면보다 먼저 서버 체인부터 돌려야 한다.
//
//   search.do → verify.do → order.do → pay.do → queryOrderDetails.do(폴링)
//
// 손님 화면은 이 흐름이 검증된 뒤에 붙인다. 단계별 함수로 쪼개 뒀으니
// 그때 각 함수를 그대로 개별 엔드포인트로 꺼내 쓰면 된다.
//
// ⚠️ 예약·결제를 일으키는 엔드포인트다. ATLAS_ADMIN_TOKEN이 없으면 아예 꺼진다.
//
// 필요한 환경변수 (Cloudflare Pages → Settings → Variables and Secrets):
//   ATLAS_SANDBOX_ID / ATLAS_SANDBOX_SECRET   샌드박스 자격증명
//   ATLAS_ADMIN_TOKEN                          이 엔드포인트 호출용 임의 문자열
//
// 사용:
//   curl -X POST https://dallytrip.com/api/flights/uat \
//     -H 'x-dally-admin: <TOKEN>' -H 'Content-Type: application/json' \
//     -d '{"from":"SEL","to":"CJU","date":"2026-09-15"}'
//   (진행 중인 주문 상태만 다시 볼 때)  -d '{"orderNo":"TEST..."}'
// =========================================================
import { json, corsPreflight } from '../_lib.js';

export const onRequestOptions = corsPreflight;

const BASE = 'https://sandbox.atriptech.com';

// 문서가 공개한 샌드박스 VCC 테스트 카드. 예치금(paymentMethod 1)은 Core UAT 전까지
// 충전이 막혀 있어 쓸 수 없으므로 VCC 패스스루(3)로 간다.
const TEST_CARD = {
  cardNumber: '4532015112830366',
  cardCVV: '123',
  cardExpireMonth: '12',
  cardExpireYear: '30',       // 2자리
  cardHolderFirstName: 'ISAAC',
  cardHolderLastName: 'KIM',
  cardHolderCountry: 'KR',
  reusable: false,
};

// 실제 여행자가 아닌 UAT용 기본값. 요청 본문으로 덮어쓸 수 있다.
const DEFAULT_PAX = {
  name: 'KIM/ISAAC', passengerType: 0, gender: 'M',
  birthday: '19900115', nationality: 'KR',
  cardType: 'PP', cardNum: 'M12345678', cardIssuePlace: 'KR', cardExpired: '20320115',
};
const DEFAULT_CONTACT = {
  name: 'KIM/ISAAC',
  email: 'ops@dallytrip.com',
  mobile: '0082-1012345678',   // 국가번호 4자리 zero-pad + '-'
};

// ── Atlas 호출 ──────────────────────────────────────────────────────────
async function atlas(path, body, env) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-atlas-client-id': (env.ATLAS_SANDBOX_ID || '').trim(),
      'x-atlas-client-secret': (env.ATLAS_SANDBOX_SECRET || '').trim(),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) return { status: 429, msg: '호출량 초과' };
  return res.json().catch(() => ({ status: -1, msg: `HTTP ${res.status} 응답을 읽지 못함` }));
}

const ok = (r) => r && r.status === 0;
const fail = (step, r) => ({ step, status: r?.status, msg: r?.msg || null });

// ── 단계별 (손님 화면을 붙일 때 이 함수들을 그대로 꺼내 쓴다) ──────────────
async function search({ from, to, date }, env) {
  return atlas('search.do', {
    tripType: '1', adultNum: 1, childNum: 0, infantNum: 0,
    fromCity: from, toCity: to, fromDate: date.replace(/-/g, ''), currency: 'USD',
  }, env);
}

async function verify(routingIdentifier, env) {
  return atlas('verify.do', { routingIdentifier, maxResponseTime: 15000 }, env);
}

async function order({ sessionId, passenger, contact }, env) {
  return atlas('order.do', {
    sessionId,
    passengers: [passenger],
    contact,
    ifSeatOccupied: 'SIMILAR_SEAT',
  }, env);
}

async function pay({ orderNo, clientOrderNo }, env) {
  return atlas('pay.do', {
    orderNo, paymentMethod: 3, creditCard: TEST_CARD, clientOrderNo,
  }, env);
}

async function detail(orderNo, env) {
  return atlas('queryOrderDetails.do', { orderNo }, env);
}

// ── 발권 결과 판정 ──────────────────────────────────────────────────────
// 발권은 비동기라 결제 성공 ≠ 발권 완료. 끝난 상태에 도달할 때까지만 기다린다.
export function terminalState(d) {
  const orderStatus = String(d?.orderStatus ?? '');
  const ticketStatus = String(d?.ticketStatus ?? '');
  const tickets = (d?.paxTicketInfos ?? []).flatMap((p) => p.ticketNos ?? []);

  if (orderStatus === '-3') {
    return { done: true, ok: false, reason: d?.errorCode ? `발권 실패 ${d.errorCode}` : '주문 취소됨',
             errorCode: d?.errorCode ?? null, errorMessage: d?.errorMessage ?? null };
  }
  if (orderStatus === '2' && ticketStatus === '1') {
    return { done: true, ok: true, reason: '발권 완료', tickets,
             pnrs: (d?.paxTicketInfos ?? []).flatMap((p) => p.airlinePNRs ?? []) };
  }
  return { done: false, ok: false, reason: `진행 중 (orderStatus=${orderStatus || '?'}, ticketStatus=${ticketStatus || '?'})` };
}

// 폴링 예산: Cloudflare 서브리퀘스트 한도와 클라이언트 대기시간을 넘기지 않게 짧게 끊는다.
// 끝나지 않으면 orderNo만 다시 던져 이어서 확인한다.
const POLL_TRIES = 8;
const POLL_INTERVAL_MS = 5000;

async function pollUntilDone(orderNo, env, trace) {
  for (let i = 0; i < POLL_TRIES; i++) {
    if (i) await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const d = await detail(orderNo, env);
    if (!ok(d)) return { result: fail('queryOrderDetails', d), detail: d };

    const state = terminalState(d);
    trace.push({ poll: i + 1, ...state });
    if (state.done) return { result: state, detail: d };
  }
  return { result: { done: false, ok: false, reason: '아직 발권 진행 중 — orderNo로 다시 조회할 것' } };
}

// ── 요청 처리 ───────────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  const token = (env.ATLAS_ADMIN_TOKEN || '').trim();
  if (!token) return json({ error: 'UAT 엔드포인트 비활성 (ATLAS_ADMIN_TOKEN 미설정)' }, 404);
  if (request.headers.get('x-dally-admin') !== token) return json({ error: 'unauthorized' }, 401);
  if (!(env.ATLAS_SANDBOX_ID && env.ATLAS_SANDBOX_SECRET)) {
    return json({ error: 'ATLAS_SANDBOX_ID / ATLAS_SANDBOX_SECRET 미설정' }, 400);
  }

  const body = await request.json().catch(() => ({}));
  const trace = [];

  // 이미 만든 주문의 상태만 다시 확인하는 모드
  if (body.orderNo && !body.from) {
    const { result, detail: d } = await pollUntilDone(body.orderNo, env, trace);
    return json({ orderNo: body.orderNo, result, trace, tktLimitTime: d?.tktLimitTime ?? null });
  }

  const from = (body.from || 'SEL').toUpperCase();
  const to = (body.to || 'CJU').toUpperCase();
  const date = body.date || isoInDays(30);
  const passenger = { ...DEFAULT_PAX, ...(body.passenger || {}) };
  const contact = { ...DEFAULT_CONTACT, ...(body.contact || {}) };

  // ① 검색 — 가장 싼 편도 하나를 고른다
  const s = await search({ from, to, date }, env);
  if (!ok(s)) return json({ failed: fail('search', s), trace }, 200);
  const routings = (s.routings || []).filter((r) => (r.fromSegments || []).length);
  if (!routings.length) return json({ failed: { step: 'search', msg: '해당 노선·날짜에 결과 없음' }, trace }, 200);

  const picked = routings.reduce((a, b) =>
    (Number(a.adultPrice) || Infinity) <= (Number(b.adultPrice) || Infinity) ? a : b);
  trace.push({ step: 'search', routings: routings.length,
               picked: `${picked.fromSegments[0].carrier} ${picked.fromSegments[0].flightNumber}`,
               price: picked.adultPrice, currency: picked.currency });

  // ② 검증 — 가격이 아직 유효한지, 어떤 승객 정보가 필수인지
  const v = await verify(picked.routingIdentifier, env);
  if (!ok(v)) return json({ failed: fail('verify', v), trace }, 200);
  trace.push({ step: 'verify', sessionId: Boolean(v.sessionId),
               priceChanged: v.priceChange?.isPriceChange ?? null,
               required: requiredFields(v.bookingRequirement),
               supportPaymentMethods: v.routing?.supportPaymentMethods ?? null });

  // ③ 예약
  const o = await order({ sessionId: v.sessionId, passenger, contact }, env);
  if (!ok(o)) return json({ failed: fail('order', o), trace }, 200);
  trace.push({ step: 'order', orderNo: o.orderNo, pnrCode: o.pnrCode,
               totalPrice: o.totalPrice, currency: o.currency, tktLimitTime: o.tktLimitTime });

  // ④ 결제 (VCC 패스스루 — 예치금은 Core UAT 전까지 충전 불가)
  const clientOrderNo = `DALLY-UAT-${o.orderNo}`;
  const p = await pay({ orderNo: o.orderNo, clientOrderNo }, env);
  if (!ok(p)) return json({ orderNo: o.orderNo, failed: fail('pay', p), trace }, 200);
  trace.push({ step: 'pay', paymentMethod: 3, clientOrderNo });

  // ⑤ 발권 확인 — 비동기라 결제 성공만으로는 끝난 게 아니다
  const { result } = await pollUntilDone(o.orderNo, env, trace);

  return json({ orderNo: o.orderNo, pnrCode: o.pnrCode, result, trace });
}

// bookingRequirement에서 필수로 표시된 항목만 추린다 (order.do 필드명과 1:1이다)
function requiredFields(br) {
  const p = br?.passenger ?? {};
  return Object.keys(p).filter((k) => p[k]?.required === true);
}

function isoInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
