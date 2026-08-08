// Atlas 응답 → 화면 카드 변환 검증.  실행:  node tests/flights.test.mjs
import assert from 'node:assert/strict';
import { toCard, totalPrice, hhmm, isoDuration, baggage } from '../functions/api/flights/search.js';

// 시각 — 문서가 YYYYMMDD라고 잘못 적어둔 자리. 실제는 12자리다.
assert.deepEqual(hhmm('202509151640'), { date: '2025-09-15', time: '16:40' });
assert.deepEqual(hhmm(''), { date: '', time: '' });          // 값이 없어도 죽지 않는다
assert.deepEqual(hhmm('20250915'), { date: '20250915', time: '' });  // 짧으면 시각을 지어내지 않는다

// 수수료 부과 방식별 총액
const base = { adultPrice: 100, adultTax: 10 };
assert.equal(totalPrice({ ...base, transactionFee: 2, transactionFeeMode: 'PER_PAX' }, 2, 1), 224);
assert.equal(totalPrice({ ...base, transactionFee: 2, transactionFeeMode: 'PER_BOOKING' }, 2, 1), 222);
assert.equal(totalPrice({ ...base, transactionFee: 2, transactionFeeMode: 'PER_SEGMENT' }, 2, 2), 228);
assert.equal(totalPrice(base, 1, 1), 110);                   // 수수료 필드가 없어도 계산된다

assert.equal(isoDuration(75), 'PT1H15M');
assert.equal(isoDuration(120), 'PT2H');
assert.equal(isoDuration(0), null);

// 무료 수하물만, 구간 중복 없이
assert.equal(baggage({ rule: { hasBaggage: 1, baggageElements: [
  { baggageType: 'CabinBaggageUnderSeat', passengerType: 0, baggageWeight: 7, baggagePiece: 1, segmentNo: 1 },
  { baggageType: 'StandardCheckInBaggage', passengerType: 0, baggageWeight: 20, baggagePiece: 1, segmentNo: 1 },
  { baggageType: 'StandardCheckInBaggage', passengerType: 0, baggageWeight: 20, baggagePiece: 1, segmentNo: 2 },
] } }), '기내 7kg · 위탁 20kg');
assert.equal(baggage({ rule: { hasBaggage: 0 } }), null);

// 전체 변환 — 경유 1회, 마크업 3%
const card = toCard({
  routingIdentifier: 'ABC==', currency: 'USD',
  adultPrice: 200, adultTax: 20, transactionFee: 2, transactionFeeMode: 'PER_PAX',
  expireTime: '2025-08-16T07:27:56Z',
  rule: { hasBaggage: 1, baggageElements: [
    { baggageType: 'StandardCheckInBaggage', passengerType: 0, baggageWeight: 20, baggagePiece: 1 },
  ] },
  fromSegments: [
    { carrier: 'VJ', flightNumber: 'VJ963', depAirport: 'ICN', depTime: '202509150910', arrAirport: 'SGN', arrTime: '202509151340', duration: 330 },
    { carrier: 'VJ', flightNumber: 'VJ628', depAirport: 'SGN', depTime: '202509151530', arrAirport: 'DAD', arrTime: '202509151650', duration: 80 },
  ],
}, { from: 'ICN', to: 'DAD', adults: 2, markup: 3 });

assert.equal(card.airlineName, '비엣젯항공');   // 코드→한글 이름
assert.equal(card.stops, 1);
assert.equal(card.departTime, '09:10');
assert.equal(card.arriveTime, '16:50');
assert.equal(card.duration, 'PT6H50M');         // 비행시간 합(410분), 대기시간 제외
assert.equal(card.price, Math.ceil(444 * 1.03));
assert.equal(card.baggageInfo, '위탁 20kg');
assert.equal(card.offerId, 'ABC==');

// 알 수 없는 항공사 코드는 코드 그대로
assert.equal(toCard({ fromSegments: [{ carrier: 'XX', depTime: '202509150910', arrTime: '202509151340' }] },
  { from: 'A', to: 'B', adults: 1 }).airlineName, 'XX');

// 구간이 없는 응답은 카드로 만들지 않는다
assert.equal(toCard({ fromSegments: [] }, { from: 'A', to: 'B', adults: 1 }), null);

console.log('ok — flights 변환 검증 통과');
