// 발권 결과 판정 검증.  실행:  node tests/uat.test.mjs
// 여기가 틀리면 실패한 예약을 성공으로 보거나, 끝난 주문을 영원히 폴링한다.
import assert from 'node:assert/strict';
import { terminalState } from '../functions/api/flights/uat.js';

// 발권 완료 — 티켓번호와 항공사 PNR까지 나와야 진짜 끝이다
const done = terminalState({
  orderStatus: 2, ticketStatus: 1,
  paxTicketInfos: [{ ticketNos: ['S30814'], airlinePNRs: ['ABCDEF'] }],
});
assert.equal(done.done, true);
assert.equal(done.ok, true);
assert.deepEqual(done.tickets, ['S30814']);
assert.deepEqual(done.pnrs, ['ABCDEF']);

// 결제는 됐지만 아직 발권 전 — 끝난 게 아니다
const pending = terminalState({ orderStatus: 2, ticketStatus: 0, paxTicketInfos: [] });
assert.equal(pending.done, false);
assert.equal(pending.ok, false);

// 발권 진행 중
assert.equal(terminalState({ orderStatus: 1, ticketStatus: 0 }).done, false);

// 취소 — 사유 코드를 살려야 원인을 안다
const cancelled = terminalState({ orderStatus: -3, ticketStatus: 0, errorCode: '604', errorMessage: 'card declined' });
assert.equal(cancelled.done, true);
assert.equal(cancelled.ok, false);
assert.equal(cancelled.errorCode, '604');
assert.match(cancelled.reason, /604/);

// 문서가 문자열/숫자를 섞어 쓴다 — 둘 다 같게 판정돼야 한다
assert.equal(terminalState({ orderStatus: '2', ticketStatus: '1', paxTicketInfos: [] }).ok, true);
assert.equal(terminalState({ orderStatus: '-3' }).ok, false);

// 응답이 비어도 죽지 않고 "진행 중"으로 본다 (성공으로 오판하지 않는 쪽이 안전)
assert.equal(terminalState({}).done, false);
assert.equal(terminalState(null).done, false);

console.log('ok — 발권 판정 검증 통과');
