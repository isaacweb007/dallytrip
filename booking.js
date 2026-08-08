/* 달리트립 호텔 예약 흐름 — 검색 카드의 "예약하기" → 정보 입력 → 가격 재확인 → 확정
 *
 * 별도 파일로 둔 이유: index.html은 디자인 작업으로 통째로 재생성되는 일이 있어서,
 * 예약 로직이 그 안에 있으면 같이 날아간다. 여기 두면 <script src> 한 줄만 확인하면 된다.
 *
 * index.html 쪽에 필요한 것 두 가지 (재생성 시 확인):
 *   ① 호텔 카드의 .book 버튼에 data-offer="<offerId>"
 *   ② </body> 앞에 <script src="booking.js" defer></script>
 */
(() => {
  const BUILD = '2026-08-08a';   // 배포 반영 확인용
  const API = 'https://hzwxeyxnlpmauyeqscim.supabase.co/functions/v1/hotels-book';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d3hleXhubHBtYXV5ZXFzY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODM1NzMsImV4cCI6MjEwMTY1OTU3M30.ccyV9CPuAfR1OvvgjIgaDORkKMNjPNeoyiHbLoKQGF4';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 202.4 를 그대로 쓰면 "$202.4"라 돈으로 안 읽힌다
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const call = (body) => fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY, apikey: KEY },
    body: JSON.stringify(body),
  }).then((r) => r.json());

  // ── 화면 ────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .bk-dim{position:fixed;inset:0;z-index:120;background:rgba(34,37,76,.45);backdrop-filter:blur(5px);
      display:none;align-items:center;justify-content:center;padding:20px}
    .bk-dim.show{display:flex}
    .bk{background:var(--card,#fff);border-radius:24px;max-width:440px;width:100%;padding:26px 24px 22px;
      max-height:88vh;overflow:auto;box-shadow:0 24px 60px rgba(34,37,76,.25)}
    .bk h4{margin:0 0 4px;font-size:19px;font-weight:800;color:var(--ink,#22254c)}
    .bk .sub{color:var(--ink-soft,#6b6f9c);font-size:13px;font-weight:600;margin-bottom:16px}
    .bk label{display:block;font-size:12px;font-weight:700;color:var(--ink-soft,#6b6f9c);margin:12px 0 5px}
    .bk input{width:100%;box-sizing:border-box;border:1.5px solid rgba(34,37,76,.14);border-radius:12px;
      padding:11px 13px;font-size:15px;font-family:inherit;background:var(--bg,#fff);color:var(--ink,#22254c)}
    .bk input:focus{outline:none;border-color:#f4785a}
    .bk .row{display:flex;gap:10px}.bk .row>div{flex:1}
    .bk .hint{font-size:11px;color:var(--ink-soft,#6b6f9c);margin-top:4px;font-weight:600}
    .bk .sum{background:rgba(244,120,90,.07);border-radius:14px;padding:14px 16px;margin:16px 0 4px}
    .bk .sum .line{display:flex;justify-content:space-between;font-size:14px;font-weight:700;margin:5px 0}
    .bk .sum .big{font-size:20px;font-weight:800;color:var(--ink,#22254c)}
    .bk .warn{background:rgba(220,90,70,.08);color:#b4402c;border-radius:12px;padding:11px 14px;
      font-size:13px;font-weight:700;margin:12px 0;line-height:1.5}
    .bk .note{font-size:12px;color:var(--ink-soft,#6b6f9c);font-weight:600;line-height:1.6;margin-top:10px}
    .bk .go{width:100%;margin-top:16px;border:0;border-radius:14px;padding:14px;font-size:16px;font-weight:800;
      font-family:inherit;color:#fff;background:#f4785a;cursor:pointer}
    .bk .go[disabled]{opacity:.55;cursor:default}
    .bk .cancel{width:100%;margin-top:8px;border:0;background:none;color:var(--ink-soft,#6b6f9c);
      font-size:14px;font-weight:700;font-family:inherit;padding:8px;cursor:pointer}
    .bk .err{color:#b4402c;font-size:13px;font-weight:700;margin-top:10px;line-height:1.5}
    .bk .ok{text-align:center;padding:8px 0}
    .bk .ok .code{font-size:22px;font-weight:800;letter-spacing:.5px;margin:10px 0 2px;color:var(--ink,#22254c)}
    .bk .test{background:rgba(34,37,76,.06);color:var(--ink-soft,#6b6f9c);border-radius:10px;padding:8px 12px;
      font-size:12px;font-weight:700;margin-bottom:14px}`;
  document.head.appendChild(style);

  const dim = document.createElement('div');
  dim.className = 'bk-dim';
  dim.innerHTML = '<div class="bk"></div>';
  document.body.appendChild(dim);
  const box = dim.querySelector('.bk');

  const open = () => dim.classList.add('show');
  const close = () => { dim.classList.remove('show'); box.innerHTML = ''; };
  dim.addEventListener('click', (e) => { if (e.target === dim) close(); });

  // ── ① 예약자 정보 ───────────────────────────────────────────────────
  function askDetails(hotel) {
    box.innerHTML = `
      <h4>${esc(hotel.name)}</h4>
      <div class="sub">${esc(hotel.meta)}</div>
      <div class="row">
        <div><label>영문 성 (여권과 동일)</label><input id="bkLast" placeholder="HONG" autocomplete="family-name"></div>
        <div><label>영문 이름</label><input id="bkFirst" placeholder="GILDONG" autocomplete="given-name"></div>
      </div>
      <div class="hint">여권에 적힌 영문 그대로 입력해주세요. 다르면 현지에서 확인이 안 될 수 있어요.</div>
      <label>이메일</label><input id="bkEmail" type="email" placeholder="you@example.com" autocomplete="email">
      <div class="hint">예약 확인서를 여기로 보내드려요.</div>
      <label>휴대폰</label><input id="bkPhone" type="tel" placeholder="010-1234-5678" autocomplete="tel">
      <button class="go" id="bkNext">다음 — 최종 금액 확인</button>
      <button class="cancel" id="bkClose">닫기</button>
      <div class="err" id="bkErr"></div>`;

    box.querySelector('#bkClose').onclick = close;
    box.querySelector('#bkNext').onclick = async () => {
      const holder = {
        lastName: box.querySelector('#bkLast').value.trim(),
        firstName: box.querySelector('#bkFirst').value.trim(),
        email: box.querySelector('#bkEmail').value.trim(),
        phone: box.querySelector('#bkPhone').value.trim(),
      };
      const err = box.querySelector('#bkErr');
      if (!holder.lastName || !holder.firstName || !holder.email || !holder.phone) {
        err.textContent = '모든 항목을 입력해주세요.'; return;
      }
      const btn = box.querySelector('#bkNext');
      btn.disabled = true; btn.textContent = '금액 확인 중…'; err.textContent = '';

      const r = await call({ action: 'prebook', offerId: hotel.offerId }).catch(() => ({ error: '연결에 실패했어요.' }));
      if (r.error) { btn.disabled = false; btn.textContent = '다음 — 최종 금액 확인'; err.textContent = r.error; return; }
      confirmStep(hotel, holder, r);
    };
  }

  // ── ② 최종 확인 ─────────────────────────────────────────────────────
  function confirmStep(hotel, holder, pre) {
    // 취소 조건을 여기서 분명히 보여주지 않으면, 환불 불가 요금을 취소하고 전액 청구되는 사고가 난다
    const cancelNote = pre.refundable && pre.freeCancelUntil
      ? `<div class="note">${esc(pre.freeCancelUntil)} 까지 무료 취소할 수 있어요.</div>`
      : `<div class="warn">이 요금은 <b>환불되지 않습니다.</b> 예약 후 취소하시면 결제 금액이 돌아오지 않아요.</div>`;

    const atProperty = (pre.payAtProperty || []).length
      ? `<div class="note">현지에서 따로 내셔야 하는 금액이 있어요 — ${
          pre.payAtProperty.map((t) => `${esc(t.label)} ${t.amount} ${esc(t.currency)}`).join(', ')}</div>`
      : '';

    const changed = pre.changed
      ? `<div class="warn">조건이 조금 바뀌었어요. 아래 최종 금액을 확인해주세요.</div>` : '';

    box.innerHTML = `
      ${pre.sandbox ? '<div class="test">테스트 모드 — 실제 결제와 투숙이 발생하지 않습니다.</div>' : ''}
      <h4>${esc(hotel.name)}</h4>
      <div class="sub">${esc(holder.lastName)} ${esc(holder.firstName)} · ${esc(holder.email)}</div>
      ${changed}
      <div class="sum">
        <div class="line"><span>결제 금액</span><span class="big">${money(pre.total)}</span></div>
        <div class="line"><span>적립 예정</span><span>${pre.dali} DALI</span></div>
      </div>
      ${cancelNote}${atProperty}
      <button class="go" id="bkPay">예약 확정하기</button>
      <button class="cancel" id="bkBack">뒤로</button>
      <div class="err" id="bkErr2"></div>`;

    box.querySelector('#bkBack').onclick = () => askDetails(hotel);
    const pay = box.querySelector('#bkPay');
    pay.onclick = async () => {
      pay.disabled = true; pay.textContent = '예약 중…';       // 더블클릭 1차 차단(서버에도 멱등키가 있다)
      const r = await call({ action: 'book', prebookId: pre.prebookId, holder })
        .catch(() => ({ error: '연결에 실패했어요.' }));
      if (r.error) {
        pay.disabled = false; pay.textContent = '예약 확정하기';
        box.querySelector('#bkErr2').textContent = r.error; return;
      }
      done(r);
    };
  }

  // ── ③ 완료 ──────────────────────────────────────────────────────────
  function done(r) {
    box.innerHTML = `
      ${r.sandbox ? '<div class="test">테스트 모드 — 실제 결제와 투숙이 발생하지 않습니다.</div>' : ''}
      <div class="ok">
        <h4>예약이 확정됐어요</h4>
        <div class="sub">${esc(r.hotel || '')}</div>
        <div class="code">${esc(r.bookingId)}</div>
        <div class="sub">예약번호</div>
        <div class="sum">
          <div class="line"><span>결제 금액</span><span class="big">${money(r.total)}</span></div>
          <div class="line"><span>적립 DALI</span><span>${r.dali} DALI</span></div>
        </div>
        <div class="note">확인서를 이메일로 보내드렸어요. 예약번호는 문의하실 때 필요해요.</div>
      </div>
      <button class="go" id="bkDone">확인</button>`;
    box.querySelector('#bkDone').onclick = () => { close(); location.reload(); };
  }

  // ── 진입점 ──────────────────────────────────────────────────────────
  // 카드는 검색할 때마다 새로 그려지므로 목록에 위임해서 듣는다.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#hotelList .book');
    if (!btn) return;
    const offerId = btn.dataset.offer;
    if (!offerId) return;                       // 항공권 카드 등 offerId 없는 건 기존 동작에 맡긴다

    e.preventDefault();
    e.stopImmediatePropagation();               // index.html의 "곧 열립니다" 알림을 대체한다

    const card = btn.closest('.hotel');
    askDetails({
      offerId,
      name: card.querySelector('h5')?.textContent.trim() || '호텔',
      meta: card.querySelector('.meta')?.textContent.trim() || '',
    });
    open();
  }, true);                                     // 캡처 단계 — 기존 리스너보다 먼저 잡는다
})();
