/* 달리트립 호텔 상세 페이지 — /hotel.html?id=…&checkin=…&checkout=…&adults=…
 *
 * 이 페이지의 축은 "점수마다 손님이 실제로 쓴 문장을 붙이는 것"이다.
 * 별점 막대만 보여주는 화면은 어디에나 있고, 정작 왜 그 점수인지는 알려주지 않는다.
 *
 * 예약은 js/booking.js가 맡는다 — 객실의 [data-book-offer] 버튼을 그쪽이 듣는다.
 */
(() => {
  const API = 'https://hzwxeyxnlpmauyeqscim.supabase.co/functions/v1/hotel-detail';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d3hleXhubHBtYXV5ZXFzY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODM1NzMsImV4cCI6MjEwMTY1OTU3M30.ccyV9CPuAfR1OvvgjIgaDORkKMNjPNeoyiHbLoKQGF4';

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const app = $('#app');

  const p = new URLSearchParams(location.search);
  const q = {
    hotelId: p.get('id') || '',
    checkin: p.get('checkin') || '',
    checkout: p.get('checkout') || '',
    adults: parseInt(p.get('adults') || '2', 10),
  };
  const nights = (() => {
    const n = (new Date(q.checkout) - new Date(q.checkin)) / 86400000;
    return n > 0 ? Math.round(n) : 1;
  })();

  $('#back').onclick = () => (history.length > 1 ? history.back() : (location.href = '/'));

  // 9.8 같은 숫자만 던지면 좋은 건지 알기 어렵다
  const verdictWord = (n) =>
    n >= 9.5 ? '완벽해요' : n >= 9 ? '훌륭해요' : n >= 8 ? '아주 좋아요'
      : n >= 7 ? '좋아요' : n >= 6 ? '괜찮아요' : '보통이에요';

  const TRAVELER = {
    couple: '커플', Couples: '커플', solo_traveller: '혼자', Solo: '혼자',
    family_with_children: '아이와 함께', Family: '가족', family: '가족',
    extended_group: '여럿이', group: '여럿이', business: '출장',
  };
  const traveler = (t) => TRAVELER[t] || (t ? String(t).replace(/_/g, ' ') : '여행자');

  const CATEGORY = {
    Cleanliness: '청결', Service: '서비스', Location: '위치', 'Room Quality': '객실',
    Facilities: '시설', Amenities: '편의시설', Comfort: '편안함', Staff: '직원',
    Value: '가격 대비', 'Value for money': '가격 대비', 'Value for Money': '가격 대비',
    Food: '식사', 'Food and Beverage': '식사', Breakfast: '조식',
    'Wi-Fi': '와이파이', Parking: '주차', Pool: '수영장',
  };
  // 총평은 위의 큰 점수가 이미 말하고 있다 — 같은 말을 두 번 하지 않는다
  const OVERALL = /^overall/i;
  const category = (n) => CATEGORY[n] || n;

  // 한국어 사용자가 못 읽는 리뷰는 자리만 차지한다. 한글·라틴 문자가 절반 이상일 때만 쓴다.
  const readable = (t) => {
    const s = String(t || '');
    const letters = s.replace(/[^\p{L}]/gu, '');
    if (!letters) return false;
    const known = (letters.match(/[A-Za-z가-힣]/g) || []).length;
    return known / letters.length >= 0.5;
  };

  const failed = (msg) => {
    app.innerHTML = `<div class="msg"><h2>${esc(msg)}</h2>
      <p>주소가 오래됐거나 호텔이 예약을 닫았을 수 있어요. 검색 결과로 돌아가 다시 골라주세요.</p>
      <button class="cta" style="max-width:220px;margin:18px auto 0" onclick="location.href='/'">검색으로 가기</button></div>`;
  };

  if (!q.hotelId || !q.checkin || !q.checkout) return failed('호텔 정보를 열 수 없어요');

  fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY, apikey: KEY },
    body: JSON.stringify(q),
  })
    .then((r) => r.json())
    .then((d) => (d.error || !d.hotel ? failed('호텔 정보를 불러오지 못했어요') : render(d)))
    .catch(() => failed('연결에 실패했어요'));

  // ── 그리기 ──────────────────────────────────────────────────────────
  let photos = [];
  let fullDesc = '';

  function render(d) {
    const h = d.hotel;
    const s = d.sentiment || {};
    const rooms = d.rooms || [];
    photos = h.images || [];
    fullDesc = h.description || '';
    document.title = `${h.name || '호텔'} — 달리트립`;

    const cheapest = rooms.length ? rooms[0] : null;

    app.innerHTML = `
      ${gallery(photos)}
      <div class="wrap">
        <div class="col-main">
          <h1>${esc(h.name || '호텔')} ${h.stars ? `<span class="stars">${'★'.repeat(Math.min(5, Math.round(h.stars)))}</span>` : ''}</h1>
          <p class="addr">${esc(h.address || '')}</p>
          ${verdict(h, s)}
          ${lovedHated(s)}
          <section id="rooms">
            <p class="eyebrow">Rooms</p>
            <h2>객실 선택 · ${esc(q.checkin)} ~ ${esc(q.checkout)} · 성인 ${q.adults}</h2>
            ${rooms.length ? rooms.map(room).join('')
              : `<div class="pane"><p style="margin:0;color:var(--ink-soft);font-weight:600">
                   이 날짜에는 예약할 수 있는 객실이 없어요. 다른 날짜로 검색해보세요.</p></div>`}
          </section>
          ${about(h)}
          ${reviews(d.reviews || [])}
        </div>
        <aside class="col-book">${bookCard(cheapest)}</aside>
      </div>
      ${cheapest ? `<div class="mbar">
        <div><div class="amt">${money(cheapest.total_usd)}</div><div class="sub">${nights}박 총액</div></div>
        <button onclick="document.getElementById('rooms').scrollIntoView()">객실 보기</button></div>` : ''}`;

    wireGallery();
    wireMore();
    wireReviewFilter();
  }

  function gallery(imgs) {
    if (!imgs.length) return '';
    const cells = imgs.slice(0, 5).map((im, i) => {
      const rest = i === 4 && imgs.length > 5 ? `<div class="rest">사진 ${imgs.length}장 모두 보기</div>` : '';
      // 첫 화면 사진은 바로 띄운다. 프록시가 죽으면 원본으로 되돌린다.
      return `<button data-i="${i}" aria-label="사진 크게 보기">
        <img src="${esc(im.thumb)}" alt=""${i ? ' loading="lazy"' : ''}
             onerror="this.onerror=null;this.src='${esc(im.full)}'">${rest}</button>`;
    }).join('');
    return `<div class="gallery"><div class="mosaic">${cells}</div></div>`;
  }

  // 이 페이지의 signature — 점수 옆에 그 점수의 근거가 된 손님 문장이 붙는다
  function verdict(h, s) {
    if (!h.rating) return '';
    const cats = (s.categories || []).filter((c) => c.name && c.rating && !OVERALL.test(c.name));
    return `<section>
      <p class="eyebrow">Guest verdict</p>
      <h2>손님들이 남긴 평가</h2>
      <div class="verdict">
        <div class="vhead">
          <div class="vscore">${esc(h.rating)}</div>
          <div class="vword">${esc(verdictWord(Number(h.rating)))}</div>
          ${h.reviews ? `<div class="vcount">${Number(h.reviews).toLocaleString()}명이 남긴 후기</div>` : ''}
        </div>
        ${cats.map((c) => `<div class="cat">
          <div><b>${esc(Number(c.rating).toFixed(1))}</b><span class="cn">${esc(category(c.name))}</span></div>
          <q>${esc(c.description || '')}</q>
        </div>`).join('')}
      </div>
    </section>`;
  }

  function lovedHated(s) {
    const pros = s.pros || [], cons = s.cons || [];
    if (!pros.length && !cons.length) return '';
    // 아쉬운 점을 숨기면 도착해서 알게 된다. 미리 보여주는 편이 신뢰가 쌓인다.
    return `<section><div class="split">
      ${pros.length ? `<div class="pane good"><h3>자주 칭찬받은 점</h3>
        <ul>${pros.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${cons.length ? `<div class="pane bad"><h3>미리 알아두면 좋은 점</h3>
        <ul>${cons.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
    </div></section>`;
  }

  function room(r) {
    const tags = [
      r.board ? `<span class="tag">${esc(r.board)}</span>` : '',
      r.refundable ? '<span class="tag ok">무료 취소</span>' : '<span class="tag no">환불 불가</span>',
      r.maxOccupancy ? `<span class="tag">최대 ${esc(r.maxOccupancy)}인</span>` : '',
    ].join('');
    return `<article class="room">
      <div class="rl"><h3>${esc(r.name)}</h3><div class="tags">${tags}</div></div>
      <div class="rr">
        <div class="amt">${money(r.total_usd)}</div>
        <div class="per">${nights}박 총액</div>
        <div class="dali"><img src="icons/icon-coin.webp" alt="" style="width:13px;height:13px">+${r.dali} DALI</div>
        <button class="pick" data-book-offer="${esc(r.offerId)}"
          data-book-name="${esc(r.name)}" data-book-meta="${esc([r.board, `${nights}박`].filter(Boolean).join(' · '))}">선택</button>
      </div>
    </article>`;
  }

  function about(h) {
    const d = h.description || '';
    const short = d.length > 320 ? d.slice(0, 320) + '…' : d;
    return `<section>
      <p class="eyebrow">About</p>
      <h2>호텔 정보</h2>
      <div class="about">
        ${(h.checkin || h.checkout) ? `<div class="times">
          <div><span>체크인</span>${esc(h.checkin || '-')}</div>
          <div><span>체크아웃</span>${esc(h.checkout || '-')}</div></div>` : ''}
        ${(h.facilities || []).length ? `<div class="chips">${h.facilities.map((f) => `<span>${esc(f)}</span>`).join('')}</div>` : ''}
        ${d ? `<div class="desc" id="desc">${esc(short)}</div>${
          d.length > 320 ? `<button class="more" id="moreBtn">더 보기</button>` : ''}` : ''}
      </div>
    </section>`;
  }

  let allReviews = [];
  function reviews(list) {
    allReviews = list.filter((v) => readable(v.pros) || readable(v.cons) || readable(v.headline));
    if (!allReviews.length) return '';
    const types = [...new Set(allReviews.map((v) => traveler(v.type)))];
    return `<section>
      <p class="eyebrow">Reviews</p>
      <h2>여행자 후기 ${allReviews.length}건</h2>
      ${types.length > 1 ? `<div class="filters" id="revFilter">
        <button aria-pressed="true" data-t="">전체</button>
        ${types.map((t) => `<button aria-pressed="false" data-t="${esc(t)}">${esc(t)}</button>`).join('')}
      </div>` : ''}
      <div id="revList">${allReviews.map(reviewCard).join('')}</div>
    </section>`;
  }

  function reviewCard(v) {
    const who = [traveler(v.type), v.country ? String(v.country).toUpperCase() : ''].filter(Boolean).join(' · ');
    return `<article class="rev" data-t="${esc(traveler(v.type))}">
      <header>
        ${v.score ? `<div class="badge">${esc(v.score)}</div>` : ''}
        <div class="who">${esc(v.name || '익명')}<span>${esc(who)}</span></div>
        ${v.date ? `<div class="when">${esc(v.date)}</div>` : ''}
      </header>
      ${readable(v.headline) ? `<h4>${esc(v.headline)}</h4>` : ''}
      ${readable(v.pros) ? `<p class="p">${esc(v.pros)}</p>` : ''}
      ${readable(v.cons) ? `<p class="c">${esc(v.cons)}</p>` : ''}
    </article>`;
  }

  function bookCard(cheapest) {
    if (!cheapest) return `<div class="bookcard"><div class="when2">이 날짜에는 예약할 수 있는 객실이 없어요.</div></div>`;
    return `<div class="bookcard">
      <div class="when2">${esc(q.checkin)} ~ ${esc(q.checkout)}<br>${nights}박 · 성인 ${q.adults}</div>
      <div class="from">최저가</div>
      <div class="big">${money(cheapest.total_usd)}</div>
      <div class="nights">${nights}박 총액 · 세금 포함</div>
      <div class="dali" style="margin-top:10px">
        <img src="icons/icon-coin.webp" alt="" style="width:13px;height:13px">+${cheapest.dali} DALI 적립</div>
      <button class="cta" onclick="document.getElementById('rooms').scrollIntoView()">객실 선택하기</button>
      <p class="note">지금 결제해도 예약이 확정될 때까지 카드에서 빠져나가지 않아요.</p>
    </div>`;
  }

  // ── 상호작용 ────────────────────────────────────────────────────────
  function wireMore() {
    const btn = $('#moreBtn');
    if (!btn) return;
    btn.onclick = () => { $('#desc').textContent = fullDesc; btn.remove(); };
  }

  function wireReviewFilter() {
    const bar = $('#revFilter');
    if (!bar) return;
    bar.onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      bar.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const t = b.dataset.t;
      $('#revList').querySelectorAll('.rev').forEach((c) => {
        c.style.display = !t || c.dataset.t === t ? '' : 'none';
      });
    };
  }

  function wireGallery() {
    const lb = $('#lb'), img = $('#lbImg'), cnt = $('#lbC');
    let i = 0;
    const show = (n) => {
      i = (n + photos.length) % photos.length;
      img.src = photos[i].full;
      cnt.textContent = `${i + 1} / ${photos.length}`;
    };
    document.querySelectorAll('.mosaic button').forEach((b) => {
      b.onclick = () => { show(Number(b.dataset.i)); lb.classList.add('show'); document.body.style.overflow = 'hidden'; };
    });
    const close = () => { lb.classList.remove('show'); document.body.style.overflow = ''; };
    $('#lbX').onclick = close;
    $('#lbP').onclick = () => show(i - 1);
    $('#lbN').onclick = () => show(i + 1);
    lb.onclick = (e) => { if (e.target === lb) close(); };
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('show')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
  }
})();
