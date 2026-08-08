/* 달리트립 호텔 예약 — 검색 카드의 "예약하기" → 정보 입력 → 결제 → 예약 확정
 *
 * 결제는 liteAPI 결제 SDK(내부적으로 Stripe)로 손님이 직접 카드 결제한다.
 * 우리 서버도 이 스크립트도 카드번호를 만지지 않는다.
 *
 * 흐름:
 *   ① prebook(usePaymentSdk:true) → 최종가 + 결제 토큰(secretKey)
 *   ② SDK가 결제 폼을 그리고, 결제되면 returnUrl 로 되돌아온다
 *   ③ 돌아온 화면에서 book(transactionId) 호출 → 예약 확정
 *
 * ②→③ 사이에 페이지가 통째로 바뀌므로 예약자 정보는 sessionStorage에 맡긴다.
 *
 * 별도 파일인 이유: index.html은 디자인 작업으로 통째로 재생성되는 일이 있어서,
 * 예약 로직이 그 안에 있으면 같이 날아간다.
 *
 * index.html 쪽 의존 (재생성 시 확인):
 *   ① 호텔 카드 .book 버튼에 data-offer="<offerId>"
 *   ② </body> 앞 <script src="js/booking.js?v=N" defer></script>
 *      ↑ 이 파일을 고치면 N을 반드시 올릴 것. Cloudflare가 .js를 4시간 캐시해서
 *        주소가 그대로면 손님에게 옛 결제 코드가 계속 나간다.
 */
(() => {
  const API = 'https://hzwxeyxnlpmauyeqscim.supabase.co/functions/v1/hotels-book';
  const DETAIL_API = 'https://hzwxeyxnlpmauyeqscim.supabase.co/functions/v1/hotel-detail';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d3hleXhubHBtYXV5ZXFzY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODM1NzMsImV4cCI6MjEwMTY1OTU3M30.ccyV9CPuAfR1OvvgjIgaDORkKMNjPNeoyiHbLoKQGF4';
  const SDK = 'https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1';
  const PENDING = 'dally_pending_booking';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 202.4 를 그대로 쓰면 "$202.4"라 돈으로 안 읽힌다
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const post = (url, body) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY, apikey: KEY },
    body: JSON.stringify(body),
  }).then((r) => r.json());

  const call = (body) => post(API, body);

  // 검색폼에 손님이 넣은 날짜·인원. 상세와 예약이 같은 조건을 봐야 가격이 어긋나지 않는다.
  const stay = () => ({
    checkin: document.getElementById('f2')?.value || '',
    checkout: document.getElementById('f3')?.value || '',
    adults: parseInt((document.querySelector('.field select')?.value.match(/성인\s*(\d+)/) || [])[1] || '2', 10),
  });

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
      font-size:12px;font-weight:700;margin-bottom:14px}
    .bk .pay{margin-top:16px;min-height:40px}
    .bk .paying{text-align:center;color:var(--ink-soft,#6b6f9c);font-weight:700;font-size:14px;padding:18px 0}
    /* 상세 */
    .bk.wide{max-width:560px}
    .bk .shots{display:flex;gap:8px;overflow-x:auto;margin:0 -24px 14px;padding:0 24px 4px}
    .bk .shots img{width:180px;height:120px;object-fit:cover;border-radius:14px;flex:0 0 auto;background:rgba(34,37,76,.06)}
    .bk .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
    .bk .chips span{background:rgba(34,37,76,.06);color:var(--ink-soft,#6b6f9c);border-radius:8px;
      padding:5px 9px;font-size:12px;font-weight:700}
    .bk .desc{font-size:13px;line-height:1.7;color:var(--ink-soft,#6b6f9c);font-weight:500;
      margin-top:12px;white-space:pre-line}
    .bk .more{border:0;background:none;color:#f4785a;font-weight:800;font-size:13px;font-family:inherit;
      padding:6px 0;cursor:pointer}
    .bk h5{margin:20px 0 8px;font-size:15px;font-weight:800;color:var(--ink,#22254c)}
    .bk .room{display:flex;align-items:center;gap:12px;border:1.5px solid rgba(34,37,76,.1);
      border-radius:14px;padding:12px 14px;margin-bottom:8px}
    .bk .room .rn{flex:1;min-width:0}
    .bk .room .rt{font-size:14px;font-weight:800;color:var(--ink,#22254c);line-height:1.35}
    .bk .room .rs{font-size:12px;font-weight:600;color:var(--ink-soft,#6b6f9c);margin-top:3px}
    .bk .room .rp{text-align:right;flex:0 0 auto}
    .bk .room .rp b{font-size:16px;font-weight:800;color:var(--ink,#22254c);display:block}
    .bk .room .pick{margin-top:6px;border:0;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:800;
      font-family:inherit;color:#fff;background:#f4785a;cursor:pointer;white-space:nowrap}`;
  document.head.appendChild(style);

  const dim = document.createElement('div');
  dim.className = 'bk-dim';
  dim.innerHTML = '<div class="bk"></div>';
  document.body.appendChild(dim);
  const box = dim.querySelector('.bk');

  const open = () => dim.classList.add('show');
  const close = () => { dim.classList.remove('show'); box.innerHTML = ''; };
  // 결제 폼이 떠 있는 동안 배경 클릭으로 닫히면 결제가 중간에 끊긴다
  dim.addEventListener('click', (e) => { if (e.target === dim && !box.querySelector('.pay')) close(); });

  const testBadge = (sandbox) => sandbox
    ? '<div class="test">테스트 모드 — 실제 결제와 투숙이 발생하지 않습니다.</div>' : '';

  // ── ⓪ 호텔 상세 — 사진·설명·시설·객실 선택 ──────────────────────────
  async function showHotel(hotelId, fallbackName) {
    box.parentElement.querySelector('.bk').classList.add('wide');
    box.innerHTML = `<div class="paying">호텔 정보를 불러오는 중…</div>`;
    open();

    const s = stay();
    const r = await post(DETAIL_API, { hotelId, ...s }).catch(() => ({ error: '연결에 실패했어요.' }));
    if (r.error || !r.hotel) {
      box.innerHTML = `<h4>${esc(fallbackName || '호텔')}</h4>
        <div class="sub">호텔 정보를 불러오지 못했어요.</div>
        <button class="go" id="bkClose2">닫기</button>`;
      box.querySelector('#bkClose2').onclick = close;
      return;
    }

    const h = r.hotel;
    const stars = '★'.repeat(Math.max(0, Math.min(5, Math.round(h.stars || 0))));
    const nights = nightsBetween(s.checkin, s.checkout);

    const shots = (h.images || []).length
      // 처음 세 장은 바로 띄운다 — 가로 스크롤이라 lazy면 첫 화면이 빈 채로 보인다
      ? `<div class="shots">${h.images.map((u, i) =>
          `<img src="${esc(u)}" alt=""${i < 3 ? '' : ' loading="lazy"'}>`).join('')}</div>` : '';

    const rooms = (r.rooms || []).length
      ? (r.rooms.map((rm) => `
          <div class="room">
            <div class="rn">
              <div class="rt">${esc(rm.name)}</div>
              <div class="rs">${[rm.board, rm.refundable ? '무료 취소' : '환불 불가'].filter(Boolean).map(esc).join(' · ')}</div>
            </div>
            <div class="rp">
              <b>${money(rm.total_usd)}</b>
              <div class="rs">${nights}박 · ${rm.dali} DALI</div>
              <button class="pick" data-offer="${esc(rm.offerId)}">선택</button>
            </div>
          </div>`).join(''))
      : `<div class="sub">이 날짜에 예약 가능한 객실이 없어요. 다른 날짜로 검색해보세요.</div>`;

    const desc = h.description || '';
    const shortDesc = desc.length > 260 ? desc.slice(0, 260) + '…' : desc;

    box.innerHTML = `
      <h4>${esc(h.name || fallbackName || '호텔')} ${stars ? `<span style="color:#f5b301">${stars}</span>` : ''}</h4>
      <div class="sub">${esc(h.address || '')}${h.rating ? ` · 평점 ${esc(h.rating)}${h.reviews ? ` (${esc(h.reviews)}건)` : ''}` : ''}</div>
      ${shots}
      ${h.checkin || h.checkout ? `<div class="rs">체크인 ${esc(h.checkin || '-')} · 체크아웃 ${esc(h.checkout || '-')}</div>` : ''}
      ${(h.facilities || []).length ? `<div class="chips">${h.facilities.map((f) => `<span>${esc(f)}</span>`).join('')}</div>` : ''}
      ${desc ? `<div class="desc" id="bkDesc">${esc(shortDesc)}</div>${
        desc.length > 260 ? '<button class="more" id="bkMore">더 보기</button>' : ''}` : ''}
      <h5>객실 선택 · ${s.checkin} ~ ${s.checkout}</h5>
      ${rooms}
      <button class="cancel" id="bkClose3">닫기</button>`;

    box.querySelector('#bkClose3').onclick = close;
    const more = box.querySelector('#bkMore');
    if (more) more.onclick = () => { box.querySelector('#bkDesc').textContent = desc; more.remove(); };

    box.querySelectorAll('.pick').forEach((b) => {
      b.onclick = () => askDetails({
        offerId: b.dataset.offer,
        name: h.name || fallbackName || '호텔',
        meta: [h.address, b.closest('.room').querySelector('.rt')?.textContent].filter(Boolean).join(' · '),
      });
    });
  }

  const nightsBetween = (a, b) => {
    const n = (new Date(b) - new Date(a)) / 86400000;
    return n > 0 ? Math.round(n) : 1;
  };

  // ── ① 예약자 정보 ───────────────────────────────────────────────────
  function askDetails(hotel) {
    box.parentElement.querySelector('.bk').classList.remove('wide');
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
      <button class="go" id="bkNext">다음 — 결제하기</button>
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
      btn.disabled = true; btn.textContent = '최종 금액 확인 중…'; err.textContent = '';

      const r = await call({ action: 'prebook', offerId: hotel.offerId, usePaymentSdk: true })
        .catch(() => ({ error: '연결에 실패했어요.' }));
      if (r.error) { btn.disabled = false; btn.textContent = '다음 — 결제하기'; err.textContent = r.error; return; }
      payStep(hotel, holder, r);
    };
  }

  // ── ② 최종 확인 + 결제 ──────────────────────────────────────────────
  async function payStep(hotel, holder, pre) {
    // 취소 조건을 분명히 보여주지 않으면, 환불 불가 요금을 취소하고 전액 청구되는 사고가 난다
    const cancelNote = pre.refundable && pre.freeCancelUntil
      ? `<div class="note">${esc(pre.freeCancelUntil)} 까지 무료 취소할 수 있어요.</div>`
      : `<div class="warn">이 요금은 <b>환불되지 않습니다.</b> 결제 후 취소하셔도 금액이 돌아오지 않아요.</div>`;

    const atProperty = (pre.payAtProperty || []).length
      ? `<div class="note">현지에서 따로 내셔야 하는 금액이 있어요 — ${
          pre.payAtProperty.map((t) => `${esc(t.label)} ${t.amount} ${esc(t.currency)}`).join(', ')}</div>`
      : '';

    box.innerHTML = `
      ${testBadge(pre.sandbox)}
      <h4>${esc(hotel.name)}</h4>
      <div class="sub">${esc(holder.lastName)} ${esc(holder.firstName)} · ${esc(holder.email)}</div>
      ${pre.changed ? '<div class="warn">조건이 조금 바뀌었어요. 아래 최종 금액을 확인해주세요.</div>' : ''}
      <div class="sum">
        <div class="line"><span>결제 금액</span><span class="big">${money(pre.total)}</span></div>
        <div class="line"><span>적립 예정</span><span>${pre.dali} DALI</span></div>
      </div>
      ${cancelNote}${atProperty}
      ${pre.sandbox ? '<div class="note">테스트 카드: 4242 4242 4242 4242 · 유효기간은 미래 아무 값 · CVC 아무 3자리</div>' : ''}
      <div class="pay" id="bkPay"><div class="paying">결제창을 여는 중…</div></div>
      <button class="cancel" id="bkBack">뒤로</button>
      <div class="err" id="bkErr2"></div>`;

    box.querySelector('#bkBack').onclick = () => askDetails(hotel);
    const err = box.querySelector('#bkErr2');

    if (!pre.payment?.secretKey) {
      box.querySelector('#bkPay').innerHTML = '';
      err.textContent = '결제창을 준비하지 못했어요. 잠시 후 다시 시도해주세요.';
      return;
    }

    // 결제가 끝나면 페이지가 통째로 바뀌므로, 예약에 필요한 값을 미리 넘겨둔다
    sessionStorage.setItem(PENDING, JSON.stringify({
      prebookId: pre.prebookId, holder, hotel: hotel.name, total: pre.total, sandbox: pre.sandbox,
    }));

    try {
      await loadSdk();
    } catch {
      box.querySelector('#bkPay').innerHTML = '';
      err.textContent = '결제 모듈을 불러오지 못했어요. 잠시 후 다시 시도해주세요.';
      return;
    }

    const back = `${location.origin}${location.pathname}?pay=1`
      + `&tid=${encodeURIComponent(pre.payment.transactionId)}`
      + `&pid=${encodeURIComponent(pre.prebookId)}`;

    new window.LiteAPIPayment({
      publicKey: pre.sandbox ? 'sandbox' : 'live',   // API 키 환경과 반드시 같아야 한다
      appearance: { theme: 'flat' },
      options: { business: { name: 'DallyTrip' } },
      submitButton: { text: `${money(pre.total)} 결제하기` },
      targetElement: '#bkPay',
      secretKey: pre.payment.secretKey,
      returnUrl: back,
    }).handlePayment();

    // SDK는 결제 폼을 mount 안에 덧붙이기만 해서 "여는 중" 문구가 폼 위에 남는다.
    // 또 내부 오류를 전부 삼켜서(catch 비어 있음) 실패하면 문구만 남은 채 멈춘다.
    // 폼(iframe)이 뜨면 문구를 치우고, 끝내 안 뜨면 손님에게 알린다.
    const mount = box.querySelector('#bkPay');
    const spinner = mount.querySelector('.paying');
    const started = Date.now();
    const watch = setInterval(() => {
      if (!document.body.contains(mount)) return clearInterval(watch);
      if (mount.querySelector('iframe')) {
        spinner?.remove();
        clearInterval(watch);
      } else if (Date.now() - started > 12000) {
        clearInterval(watch);
        spinner?.remove();
        err.textContent = '결제창을 여는 데 실패했어요. 잠시 후 다시 시도해주세요.';
      }
    }, 400);
  }

  let sdkLoad = null;
  function loadSdk() {
    if (window.LiteAPIPayment) return Promise.resolve();
    if (!sdkLoad) {
      sdkLoad = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = SDK; s.onload = res; s.onerror = () => { sdkLoad = null; rej(new Error('sdk')); };
        document.head.appendChild(s);
      });
    }
    return sdkLoad;
  }

  // ── ③ 결제 후 돌아왔을 때 — 예약 확정 ───────────────────────────────
  async function resume() {
    const p = new URLSearchParams(location.search);
    if (p.get('pay') !== '1') return;

    const tid = p.get('tid');
    const pid = p.get('pid');
    const status = p.get('redirect_status');           // Stripe가 붙여준다
    const raw = sessionStorage.getItem(PENDING);

    // 주소를 먼저 정리한다 — 새로고침으로 예약이 한 번 더 시도되면 안 된다
    history.replaceState(null, '', location.pathname);
    open();

    if (status && status !== 'succeeded') {
      box.innerHTML = `<h4>결제가 완료되지 않았어요</h4>
        <div class="sub">카드 승인이 이루어지지 않았습니다. 다시 시도해주세요.</div>
        <button class="go" id="bkDone">확인</button>`;
      box.querySelector('#bkDone').onclick = close;
      return;
    }

    const pending = raw ? JSON.parse(raw) : null;
    if (!tid || !pid || !pending) {
      box.innerHTML = `<h4>예약 정보를 찾지 못했어요</h4>
        <div class="sub">결제가 되었는데 이 화면이 보인다면 고객센터로 연락해주세요.</div>
        ${tid ? `<div class="note">결제번호: ${esc(tid)}</div>` : ''}
        <button class="go" id="bkDone">확인</button>`;
      box.querySelector('#bkDone').onclick = close;
      return;
    }

    box.innerHTML = `${testBadge(pending.sandbox)}
      <div class="paying">결제가 완료됐어요. 예약을 확정하는 중입니다…</div>`;

    const r = await call({
      action: 'book', prebookId: pid, holder: pending.holder, transactionId: tid,
    }).catch(() => ({ error: '연결에 실패했어요.' }));

    sessionStorage.removeItem(PENDING);

    if (r.error) {
      // 최악의 경우 — 돈은 나갔는데 예약이 안 잡혔다. 손님이 스스로 재시도하면 이중결제가 되므로
      // 재시도 버튼을 주지 않고, 사람이 처리할 수 있게 번호를 남긴다.
      box.innerHTML = `${testBadge(pending.sandbox)}
        <h4>예약 확정이 지연되고 있어요</h4>
        <div class="sub">결제는 완료됐습니다. 다시 결제하지 마세요.</div>
        <div class="warn">${esc(r.error)}</div>
        <div class="note">아래 번호로 고객센터에 문의해주시면 바로 확인해드립니다.<br>
          결제번호 ${esc(tid)}<br>예약참조 ${esc(pid)}</div>
        <button class="go" id="bkDone">확인</button>`;
      box.querySelector('#bkDone').onclick = close;
      return;
    }
    done(r);
  }

  // ── 완료 ────────────────────────────────────────────────────────────
  function done(r) {
    box.innerHTML = `
      ${testBadge(r.sandbox)}
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
    box.querySelector('#bkDone').onclick = close;
  }

  // ── 진입점 ──────────────────────────────────────────────────────────
  // 카드는 검색할 때마다 새로 그려지므로 문서에 위임해서 듣는다.
  document.addEventListener('click', (e) => {
    if (e.target.closest('.favb')) return;      // 즐겨찾기 하트는 원래 동작대로

    const card = e.target.closest('#hotelList .hotel[data-hotel]');
    if (!card) return;                          // 항공권 카드 등은 기존 동작에 맡긴다

    e.preventDefault();
    e.stopImmediatePropagation();               // index.html의 "곧 열립니다" 알림을 대체한다

    // 카드 어디를 눌러도 상세로 간다 — 객실은 거기서 고른다
    showHotel(card.dataset.hotel, card.querySelector('h5')?.textContent.trim());
  }, true);                                     // 캡처 단계 — 기존 리스너보다 먼저 잡는다

  resume();
})();
