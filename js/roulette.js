/* 달리트립 — 매일 한 번 행운의 룰렛
 *
 * 하루에 한 번(한국 시간 기준) 자동으로 열린다. 오늘 이미 돌렸으면 열지 않는다.
 * 데모용으로 다시 보려면 주소에 ?roulette=1 을 붙인다.
 *
 * 당첨 결과는 localStorage 'dallytrip_roulette' 에 따로 저장한다.
 * 마이 달리(index.html)가 쓰는 'dallytrip_v03' 에 같이 쓰면, 그쪽이 오래된 상태를
 * 통째로 저장할 때 당첨이 날아간다. 나중에 마이 달리에서 이 키를 읽어 쿠폰함을 붙이면 된다.
 *
 * index.html 의존: </body> 앞 <script src="js/roulette.js?v=N" defer></script> 한 줄.
 * (파일을 고치면 N을 올릴 것 — Cloudflare가 .js를 4시간 캐시한다)
 */
(() => {
  const STORE = 'dallytrip_roulette';

  // ── 상품 구성 ────────────────────────────────────────────────────────
  // ⚠️ 지금은 샘플 데모라 당첨을 후하게 잡아 뒀다(약 21%).
  //    실제로 항공권을 걸려면 weight를 훨씬 낮춰야 한다 — 어드민에서 관리할 값.
  const SEGMENTS = [
    { kind: 'flight', place: '다낭',  label: '다낭\n항공권',  title: '다낭 왕복 항공권',   color: '#FF6B4A', weight: 5 },
    { kind: 'miss',                   label: '꽝',            title: '꽝',                 color: '#EFE4D5', weight: 25 },
    { kind: 'stay',   place: '발리',  label: '발리\n2박',     title: '발리 리조트 2박',    color: '#3ECFB2', weight: 5 },
    { kind: 'miss',                   label: '꽝',            title: '꽝',                 color: '#EFE4D5', weight: 25 },
    { kind: 'flight', place: '방콕',  label: '방콕\n항공권',  title: '방콕 왕복 항공권',   color: '#F5B301', weight: 5 },
    { kind: 'miss',                   label: '꽝',            title: '꽝',                 color: '#EFE4D5', weight: 25 },
    { kind: 'stay',   place: '세부',  label: '세부\n2박',     title: '세부 리조트 2박',    color: '#7EA8E8', weight: 5 },
  ];
  const ICON = { flight: 'icons/icon-plane.webp', stay: 'icons/icon-hotel.webp' };

  // 한국 시간 기준 날짜 — 자정 넘어 하루가 바뀌는 기준을 손님 시계에 맞춘다
  const todayKST = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  const save = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* 시크릿 모드 */ } };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 받침이 없거나 ㄹ이면 '로', 아니면 '으로' (발리로 / 다낭으로)
  const ro = (word) => {
    const last = String(word || '').trim().slice(-1);
    const code = last.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return '로';
    const jong = code % 28;
    return (jong === 0 || jong === 8) ? '로' : '으로';
  };

  const forced = new URLSearchParams(location.search).get('roulette') === '1';
  const state = load();
  if (!forced && state.last === todayKST()) return;    // 오늘 몫은 이미 돌렸다

  // ── 모양 ─────────────────────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    .rl-dim{position:fixed;inset:0;z-index:130;background:rgba(34,37,76,.5);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .3s}
    .rl-dim.in{opacity:1}
    .rl{background:linear-gradient(170deg,#FFF9F2,#FFEFE2);border-radius:32px;max-width:390px;width:100%;
      padding:24px 24px 22px;text-align:center;position:relative;
      box-shadow:0 26px 70px rgba(34,37,76,.3),inset 0 2px 0 rgba(255,255,255,.9);
      transform:translateY(16px) scale(.96);transition:transform .38s cubic-bezier(.2,.9,.3,1.2)}
    .rl-dim.in .rl{transform:none}
    .rl .x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;background:rgba(34,37,76,.07);
      color:#5A5E86;font-size:17px;font-weight:700;display:grid;place-items:center;border:0;cursor:pointer}
    .rl .x:hover{background:rgba(34,37,76,.14)}
    .rl .kicker{font-size:11.5px;font-weight:800;letter-spacing:1px;color:#FF6B4A;text-transform:uppercase}
    .rl h3{margin:5px 0 2px;font-size:22px;font-weight:800;letter-spacing:-.6px;color:#22254C}
    .rl .sub{font-size:13px;font-weight:600;color:#5A5E86;margin-bottom:14px}

    .rl-stage{position:relative;width:min(300px,74vw);margin:0 auto;aspect-ratio:1}
    .rl-glow{position:absolute;inset:-14%;border-radius:50%;opacity:0;transition:opacity .5s;
      background:radial-gradient(circle,rgba(245,179,1,.55),transparent 62%)}
    .rl-stage.won .rl-glow{opacity:1}
    /* 클레이 느낌 — 두꺼운 흰 테두리, 바깥 그림자, 안쪽 하이라이트 */
    .rl-wheel{width:100%;height:100%;border-radius:50%;background:#fff;padding:9px;box-sizing:border-box;
      box-shadow:0 16px 30px rgba(34,37,76,.22),0 3px 0 rgba(34,37,76,.06),
                 inset 0 -6px 12px rgba(34,37,76,.09),inset 0 6px 10px rgba(255,255,255,.95);
      transition:transform 4.4s cubic-bezier(.16,.72,.14,1)}
    .rl-wheel svg{display:block;width:100%;height:100%;filter:drop-shadow(0 2px 3px rgba(34,37,76,.12))}
    .rl-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:29%;height:29%;
      border-radius:50%;background:#fff;display:grid;place-items:center;
      box-shadow:0 6px 14px rgba(34,37,76,.22),inset 0 -3px 6px rgba(34,37,76,.08)}
    .rl-hub img{width:66%;height:66%;object-fit:contain}
    .rl-stage.won .rl-hub{animation:rlPop .6s ease-out 2}
    @keyframes rlPop{0%,100%{transform:translate(-50%,-50%) scale(1)}45%{transform:translate(-50%,-50%) scale(1.13)}}
    /* 바늘 — 둥근 클레이 물방울 */
    .rl-pin{position:absolute;left:50%;top:-9px;transform:translateX(-50%);width:34px;height:44px;z-index:2;
      background:#FF6B4A;border-radius:50% 50% 50% 50%/42% 42% 62% 62%;clip-path:polygon(50% 100%,0 42%,0 0,100% 0,100% 42%);
      box-shadow:0 6px 12px rgba(232,83,47,.4),inset 0 -4px 8px rgba(0,0,0,.12),inset 0 3px 5px rgba(255,255,255,.5)}

    .rl-go{width:100%;margin-top:18px;border:0;border-radius:16px;padding:15px;font-family:inherit;
      font-size:16.5px;font-weight:800;color:#fff;background:#FF6B4A;cursor:pointer;
      box-shadow:0 8px 18px rgba(232,83,47,.32),inset 0 -3px 0 rgba(0,0,0,.12);transition:transform .12s,background .15s}
    .rl-go:hover{background:#E8532F}
    .rl-go:active{transform:translateY(2px)}
    .rl-go[disabled]{opacity:.5;cursor:default;box-shadow:none;transform:none}
    .rl-note{font-size:11.5px;font-weight:600;color:#8A8FB0;margin-top:10px;line-height:1.5}

    /* 결과 */
    .rl-res{margin-top:16px;background:#fff;border-radius:20px;padding:18px 18px 16px;
      box-shadow:0 8px 20px rgba(34,37,76,.1);animation:rlUp .4s cubic-bezier(.2,.9,.3,1.2)}
    @keyframes rlUp{from{opacity:0;transform:translateY(14px)}}
    .rl-res img{width:52px;height:52px;object-fit:contain;margin:0 auto 8px}
    .rl-res b{display:block;font-size:19px;font-weight:800;letter-spacing:-.5px;color:#22254C}
    .rl-res p{margin:6px 0 0;font-size:13px;font-weight:600;color:#5A5E86;line-height:1.6}
    .rl-code{margin-top:11px;background:#FFF4E8;border:1.5px dashed #F3C58E;border-radius:12px;padding:9px;
      font-size:14px;font-weight:800;letter-spacing:1.2px;color:#8A5A12}

    @media (prefers-reduced-motion:reduce){
      .rl-wheel{transition-duration:.35s}
      .rl-dim,.rl,.rl-res,.rl-stage.won .rl-hub{transition:none;animation:none}
    }`;
  document.head.appendChild(css);

  // ── 원판 그리기 ──────────────────────────────────────────────────────
  const N = SEGMENTS.length;
  const STEP = 360 / N;
  const pt = (deg, r) => {
    const a = (deg - 90) * Math.PI / 180;          // 0도를 12시 방향으로
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  };

  const sectors = SEGMENTS.map((s, i) => {
    const [x1, y1] = pt(i * STEP, 50);
    const [x2, y2] = pt((i + 1) * STEP, 50);
    const mid = i * STEP + STEP / 2;
    const [lx, ly] = pt(mid, 31);
    const [ix, iy] = pt(mid, 41);
    const lines = s.label.split('\n');
    const text = lines.map((t, k) =>
      `<tspan x="0" dy="${k ? 11 : 0}">${esc(t)}</tspan>`).join('');
    return `<path d="M50 50 L${x1} ${y1} A50 50 0 0 1 ${x2} ${y2} Z" fill="${s.color}"
              stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
      ${ICON[s.kind] ? `<image href="${ICON[s.kind]}" x="${ix - 6}" y="${iy - 6}" width="12" height="12"/>` : ''}
      <text transform="translate(${lx} ${ly}) rotate(${mid})" text-anchor="middle"
            font-size="8.4" font-weight="800" fill="${s.kind === 'miss' ? '#9A9280' : '#fff'}"
            style="font-family:inherit">${text}</text>`;
  }).join('');

  const dim = document.createElement('div');
  dim.className = 'rl-dim';
  dim.innerHTML = `
    <div class="rl" role="dialog" aria-modal="true" aria-label="오늘의 행운 룰렛">
      <button class="x" aria-label="닫기">✕</button>
      <div class="kicker">Daily</div>
      <h3>오늘의 행운 룰렛</h3>
      <div class="sub">하루에 한 번, 동남아 여행이 걸려 있어요</div>
      <div class="rl-stage">
        <div class="rl-glow"></div>
        <div class="rl-pin"></div>
        <div class="rl-wheel"><svg viewBox="0 0 100 100" aria-hidden="true">${sectors}</svg></div>
        <div class="rl-hub"><img src="icons/dally-face.webp" alt=""></div>
      </div>
      <button class="rl-go">룰렛 돌리기</button>
      <div class="rl-note">당첨 상품은 마이 달리에 보관돼요. 내일 또 도전할 수 있어요.</div>
      <div class="rl-out" aria-live="polite"></div>
    </div>`;

  // ── 동작 ─────────────────────────────────────────────────────────────
  const wheel = dim.querySelector('.rl-wheel');
  const stage = dim.querySelector('.rl-stage');
  const go = dim.querySelector('.rl-go');
  const out = dim.querySelector('.rl-out');
  const close = () => { dim.classList.remove('in'); setTimeout(() => dim.remove(), 300); };

  dim.querySelector('.x').onclick = close;
  dim.addEventListener('click', (e) => { if (e.target === dim && !spun) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dim.isConnected && !spinning) close(); });

  // 가중치대로 뽑는다 — 칸마다 확률이 다르다
  function draw() {
    const total = SEGMENTS.reduce((a, s) => a + s.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < N; i++) { r -= SEGMENTS[i].weight; if (r < 0) return i; }
    return N - 1;
  }

  const code = () => 'DALLY-' + Math.random().toString(36).slice(2, 7).toUpperCase()
    + Math.random().toString(36).slice(2, 5).toUpperCase();

  let spun = false, spinning = false;

  go.onclick = () => {
    if (spun) {                                    // 결과를 본 뒤 — 버튼 문구대로 움직인다
      close();
      if (go.textContent.includes('호텔')) document.getElementById('searchForm')?.scrollIntoView();
      return;
    }
    spun = spinning = true;
    go.disabled = true;
    go.textContent = '돌리는 중…';

    const i = draw();
    const seg = SEGMENTS[i];
    // 바늘은 12시에 고정 — 뽑힌 칸의 한가운데가 바늘 아래로 오게 원판을 돌린다
    const target = 360 * 6 - (i * STEP + STEP / 2);
    wheel.style.transform = `rotate(${target}deg)`;

    const settle = () => {
      spinning = false;
      const won = seg.kind !== 'miss';
      if (won) stage.classList.add('won');

      const rec = load();
      rec.last = todayKST();
      rec.history = (rec.history || []).slice(-29);
      if (won) {
        const prize = { kind: seg.kind, title: seg.title, place: seg.place, code: code(), won: todayKST() };
        rec.prizes = [...(rec.prizes || []), prize];
        rec.history.push({ d: todayKST(), title: seg.title });
        save(rec);
        out.innerHTML = `<div class="rl-res">
          <img src="${ICON[seg.kind]}" alt="">
          <b>${esc(seg.title)} 당첨</b>
          <p>${esc(seg.place)}${ro(seg.place)} 떠날 준비가 됐어요.<br>아래 번호를 예약할 때 보여주세요.</p>
          <div class="rl-code">${esc(prize.code)}</div></div>`;
        go.textContent = '확인';
      } else {
        rec.history.push({ d: todayKST(), title: '꽝' });
        save(rec);
        out.innerHTML = `<div class="rl-res">
          <img src="icons/icon-gift.webp" alt="">
          <b>오늘은 아쉽게 꽝</b>
          <p>내일 다시 돌릴 수 있어요.<br>그동안 다낭·방콕 특가부터 둘러보세요.</p></div>`;
        go.textContent = '호텔 보러 가기';
      }
      go.disabled = false;
    };

    // 애니메이션을 끈 환경에서도 결과는 나와야 한다
    const ms = matchMedia('(prefers-reduced-motion:reduce)').matches ? 400 : 4500;
    setTimeout(settle, ms);
  };

  // 페이지가 먼저 그려진 뒤에 띄운다
  setTimeout(() => {
    document.body.appendChild(dim);
    // rAF는 배경 탭에서 멈춘다 — 그러면 모달이 투명한 채로 남는다
    setTimeout(() => dim.classList.add('in'), 20);
  }, forced ? 200 : 1400);
})();
