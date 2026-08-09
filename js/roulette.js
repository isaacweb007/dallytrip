/* 달리트립 — 매일 한 번 행운의 룰렛
 *
 * 하루에 한 번(한국 시간 기준) 자동으로 열린다. 오늘 이미 돌렸으면 열지 않는다.
 * 데모용으로 다시 보려면 주소에 ?roulette=1 을 붙인다.
 *
 * 회전은 CSS transition이 아니라 매 프레임 직접 그린다.
 * 감아뒀다가 튕겨 나가고, 길게 감속하다가 마지막에 살짝 넘어갔다 제자리로 —
 * 실제 원판이 멎는 느낌을 내려면 구간을 나눠야 한다.
 *
 * 당첨은 localStorage 'dallytrip_roulette' 에 남기고, 접수(이름·이메일)는
 * event-claim 함수로 보내 서버에 저장한다. 브라우저에만 두면 연락할 방법이 없다.
 *
 * index.html 의존: </body> 앞 <script src="js/roulette.js?v=N" defer></script>
 * (파일을 고치면 N을 올릴 것 — Cloudflare가 .js를 4시간 캐시한다)
 */
(() => {
  const STORE = 'dallytrip_roulette';
  const ACCOUNT = 'dallytrip_v03';                 // 마이 달리 — 읽기만 한다
  const CLAIM = 'https://hzwxeyxnlpmauyeqscim.supabase.co/functions/v1/event-claim';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d3hleXhubHBtYXV5ZXFzY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODM1NzMsImV4cCI6MjEwMTY1OTU3M30.ccyV9CPuAfR1OvvgjIgaDORkKMNjPNeoyiHbLoKQGF4';

  // ── 상품 구성 ────────────────────────────────────────────────────────
  // ⚠️ 지금은 샘플 데모라 당첨을 후하게 잡아 뒀다(약 21%).
  //    실제로 항공권을 걸려면 weight를 훨씬 낮춰야 한다 — 어드민에서 관리할 값.
  const SEGMENTS = [
    { kind: 'flight', place: '다낭', label: '다낭\n항공권', title: '다낭 왕복 항공권',  color: '#FF6B4A', weight: 5 },
    { kind: 'miss',                  label: '꽝',           title: '꽝',                color: '#EFE4D5', weight: 25 },
    { kind: 'stay',   place: '발리', label: '발리\n2박',    title: '발리 리조트 2박',   color: '#3ECFB2', weight: 5 },
    { kind: 'miss',                  label: '꽝',           title: '꽝',                color: '#EFE4D5', weight: 25 },
    { kind: 'flight', place: '방콕', label: '방콕\n항공권', title: '방콕 왕복 항공권',  color: '#F5B301', weight: 5 },
    { kind: 'miss',                  label: '꽝',           title: '꽝',                color: '#EFE4D5', weight: 25 },
    { kind: 'stay',   place: '세부', label: '세부\n2박',    title: '세부 리조트 2박',   color: '#7EA8E8', weight: 5 },
  ];
  const ICON = { flight: 'icons/icon-plane.webp', stay: 'icons/icon-hotel.webp' };

  const todayKST = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  const save = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* 시크릿 모드 */ } };
  const account = () => { try { return JSON.parse(localStorage.getItem(ACCOUNT)) || {}; } catch { return {}; } };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 받침이 없거나 ㄹ이면 '로', 아니면 '으로' (발리로 / 다낭으로)
  const ro = (word) => {
    const c = String(word || '').trim().slice(-1).charCodeAt(0) - 0xAC00;
    if (c < 0 || c > 11171) return '로';
    return (c % 28 === 0 || c % 28 === 8) ? '로' : '으로';
  };

  const rand = (n) => Math.random().toString(36).slice(2, 2 + n).toUpperCase();

  // 회원 아이디는 한 번 만들어 계속 쓴다 — 당첨 접수 때 본인 확인에 쓰인다
  function memberId(rec) {
    if (!rec.memberId) { rec.memberId = 'DALLY-' + rand(4) + rand(4); save(rec); }
    return rec.memberId;
  }

  // ⚠️ 개발 중 스위치 — 새로고침할 때마다 룰렛이 열린다.
  //    오픈 전에 반드시 false로 되돌릴 것. 안 그러면 손님이 하루에 몇 번이든 돌린다.
  const DEV_ALWAYS_OPEN = true;

  const forced = DEV_ALWAYS_OPEN || new URLSearchParams(location.search).get('roulette') === '1';
  if (!forced && load().last === todayKST()) return;    // 오늘 몫은 이미 돌렸다

  if (DEV_ALWAYS_OPEN) {
    console.warn('[달리트립] 룰렛이 개발 모드입니다 — 새로고침마다 열립니다. 오픈 전에 js/roulette.js의 DEV_ALWAYS_OPEN을 false로 바꾸세요.');
  }

  const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;

  // ── 모양 ─────────────────────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    .rl-dim{position:fixed;inset:0;z-index:130;background:rgba(34,37,76,.5);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;
      opacity:0;transition:opacity .3s}
    .rl-dim.in{opacity:1}
    .rl{background:linear-gradient(170deg,#FFF9F2,#FFEFE2);border-radius:32px;max-width:390px;width:100%;
      padding:24px 24px 22px;text-align:center;position:relative;margin:auto;
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
      will-change:transform;
      box-shadow:0 16px 30px rgba(34,37,76,.22),0 3px 0 rgba(34,37,76,.06),
                 inset 0 -6px 12px rgba(34,37,76,.09),inset 0 6px 10px rgba(255,255,255,.95)}
    .rl-wheel svg{display:block;width:100%;height:100%;filter:drop-shadow(0 2px 3px rgba(34,37,76,.12))}
    .rl-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:29%;height:29%;
      border-radius:50%;background:#fff;display:grid;place-items:center;
      box-shadow:0 6px 14px rgba(34,37,76,.22),inset 0 -3px 6px rgba(34,37,76,.08)}
    .rl-hub img{width:66%;height:66%;object-fit:contain}
    .rl-stage.won .rl-hub{animation:rlPop .6s ease-out 2}
    @keyframes rlPop{0%,100%{transform:translate(-50%,-50%) scale(1)}45%{transform:translate(-50%,-50%) scale(1.13)}}
    /* 바늘 — 둥근 클레이 물방울. 칸이 지날 때마다 살짝 튕긴다 */
    .rl-pin{position:absolute;left:50%;top:-9px;width:34px;height:44px;z-index:2;transform-origin:50% 18%;
      background:#FF6B4A;border-radius:50% 50% 50% 50%/42% 42% 62% 62%;clip-path:polygon(50% 100%,0 42%,0 0,100% 0,100% 42%);
      box-shadow:0 6px 12px rgba(232,83,47,.4),inset 0 -4px 8px rgba(0,0,0,.12),inset 0 3px 5px rgba(255,255,255,.5)}

    .rl-go{width:100%;margin-top:18px;border:0;border-radius:16px;padding:15px;font-family:inherit;
      font-size:16.5px;font-weight:800;color:#fff;background:#FF6B4A;cursor:pointer;
      box-shadow:0 8px 18px rgba(232,83,47,.32),inset 0 -3px 0 rgba(0,0,0,.12);transition:transform .12s,background .15s}
    .rl-go:hover{background:#E8532F}
    .rl-go:active{transform:translateY(2px)}
    .rl-go[disabled]{opacity:.5;cursor:default;box-shadow:none;transform:none}
    .rl-ghost{width:100%;margin-top:8px;border:0;background:none;color:#8A8FB0;font-family:inherit;
      font-size:13.5px;font-weight:700;padding:8px;cursor:pointer}
    .rl-note{font-size:11.5px;font-weight:600;color:#8A8FB0;margin-top:10px;line-height:1.5}

    /* 결과 */
    .rl-res{margin-top:16px;background:#fff;border-radius:20px;padding:18px 18px 16px;
      box-shadow:0 8px 20px rgba(34,37,76,.1);animation:rlUp .4s cubic-bezier(.2,.9,.3,1.2)}
    @keyframes rlUp{from{opacity:0;transform:translateY(14px)}}
    .rl-res>img{width:52px;height:52px;object-fit:contain;margin:0 auto 8px}
    .rl-res b{display:block;font-size:19px;font-weight:800;letter-spacing:-.5px;color:#22254C}
    .rl-res p{margin:6px 0 0;font-size:13px;font-weight:600;color:#5A5E86;line-height:1.6}

    /* 당첨 안내 */
    .rl-slip{margin-top:16px;background:#fff;border-radius:20px;padding:18px;text-align:left;
      box-shadow:0 8px 20px rgba(34,37,76,.1);animation:rlUp .4s cubic-bezier(.2,.9,.3,1.2)}
    .rl-slip h4{margin:0 0 12px;font-size:16px;font-weight:800;color:#22254C;text-align:center}
    .rl-row{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;font-weight:700;
      padding:9px 0;border-bottom:1px solid #F3E9DC}
    .rl-row span{color:#8A8FB0;flex:0 0 auto}
    .rl-row b{color:#22254C;text-align:right;word-break:break-all}
    .rl-row:last-of-type{border-bottom:0}
    .rl-slip label{display:block;font-size:12px;font-weight:700;color:#8A8FB0;margin:12px 0 5px}
    .rl-slip input{width:100%;box-sizing:border-box;border:1.5px solid #EADFCE;border-radius:12px;
      padding:11px 13px;font-size:15px;font-family:inherit;background:#fff;color:#22254C}
    .rl-slip input:focus{outline:none;border-color:#FF6B4A}
    .rl-guide{background:#FFF4E8;border-radius:14px;padding:13px 15px;margin-top:14px;
      font-size:12.5px;font-weight:600;color:#8A5A12;line-height:1.75}
    .rl-err{color:#B4402C;font-size:13px;font-weight:700;margin-top:9px}

    @media (prefers-reduced-motion:reduce){
      .rl-dim,.rl,.rl-res,.rl-slip,.rl-stage.won .rl-hub{transition:none;animation:none}
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
    const text = s.label.split('\n').map((t, k) =>
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
      <div class="rl-note">당첨되면 본사에서 연락드려 일정을 잡아드려요.</div>
      <div class="rl-out" aria-live="polite"></div>
    </div>`;

  const wheel = dim.querySelector('.rl-wheel');
  const pin = dim.querySelector('.rl-pin');
  const stage = dim.querySelector('.rl-stage');
  const go = dim.querySelector('.rl-go');
  const note = dim.querySelector('.rl-note');
  const out = dim.querySelector('.rl-out');

  let spinning = false, done = false;
  const close = () => { dim.classList.remove('in'); setTimeout(() => dim.remove(), 300); };
  dim.querySelector('.x').onclick = () => { if (!spinning) close(); };
  dim.addEventListener('click', (e) => { if (e.target === dim && !spinning && !done) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dim.isConnected && !spinning) close(); });

  // ── 회전 ─────────────────────────────────────────────────────────────
  let angle = 0;
  const setAngle = (deg) => { angle = deg; wheel.style.transform = `rotate(${deg}deg)`; };

  // 매 프레임 직접 그린다. CSS transition 하나로는 감아뒀다 튕겨 나가는 맛이 안 난다.
  const tween = (to, ms, ease) => new Promise((res) => {
    const from = angle, delta = to - from, t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      setAngle(from + delta * ease(t));
      if (t < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });

  const easeOut2 = (t) => 1 - (1 - t) * (1 - t);

  // 던져진 원판의 곡선. 앞 10%는 가속하고, 나머지는 마찰로 속도가 지수적으로 줄어든다.
  // 제곱 감속(1-(1-t)^5)은 후반이 너무 평평해서 멈춘 것처럼 보인다 —
  // 지수 감쇠는 마지막 0.5초에도 한 칸쯤 더 넘어가며 천천히 멎는다.
  const launch = (t) => {
    const a = 0.10;
    if (t < a) { const u = t / a; return 0.04 * u * u; }
    const u = (t - a) / (1 - a);
    return 0.04 + 0.96 * (1 - Math.exp(-3 * u)) / (1 - Math.exp(-3));
  };

  // 칸이 바늘을 지날 때마다 톡 튕긴다. 소리 없이도 '넘어가는' 느낌을 준다.
  let ticking = false, lastSeg = -1;
  function watchTicks() {
    ticking = true;
    const loop = () => {
      if (!ticking) return;
      const seg = Math.floor((((-angle % 360) + 360) % 360) / STEP);
      if (seg !== lastSeg) {
        lastSeg = seg;
        pin.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(0deg)' }],
          { duration: 130, easing: 'ease-out' },
        );
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  async function spin(targetIndex) {
    // 바늘은 12시에 고정 — 뽑힌 칸의 한가운데가 바늘 아래로 오게 원판을 돌린다.
    // 매번 같은 자리에 서면 티가 나므로 칸 안에서 조금씩 흔든다.
    const jitter = (Math.random() - 0.5) * (STEP * 0.5);
    const final = 360 * 7 - (targetIndex * STEP + STEP / 2) + jitter;

    if (REDUCED) { setAngle(final); return; }

    watchTicks();
    await tween(-16, 420, easeOut2);          // ① 뒤로 살짝 감았다가
    await tween(final + 6, 5200, launch);     // ② 튕겨 나가 길게 감속 — 목표를 살짝 지나친다
    await tween(final, 620, easeOut2);        // ③ 지나친 만큼 되돌아와 멎는다
    ticking = false;
  }

  // ── 뽑기 ─────────────────────────────────────────────────────────────
  function draw() {
    const total = SEGMENTS.reduce((a, s) => a + s.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < N; i++) { r -= SEGMENTS[i].weight; if (r < 0) return i; }
    return N - 1;
  }

  const newCode = () => 'DALLY-' + rand(5) + rand(3);

  go.onclick = async () => {
    if (spinning) return;
    if (done) return close();

    spinning = true;
    go.disabled = true;
    go.textContent = '돌리는 중…';

    const i = draw();
    const seg = SEGMENTS[i];
    await spin(i);

    spinning = false;
    done = true;
    finish(seg);
  };

  function finish(seg) {
    const rec = load();
    rec.last = todayKST();
    rec.history = [...(rec.history || []).slice(-29), { d: todayKST(), title: seg.title }];

    if (seg.kind === 'miss') {
      save(rec);
      out.innerHTML = `<div class="rl-res">
        <img src="icons/icon-gift.webp" alt="">
        <b>오늘은 아쉽게 꽝</b>
        <p>내일 다시 돌릴 수 있어요.<br>그동안 다낭·방콕 특가부터 둘러보세요.</p></div>`;
      go.disabled = false;
      go.textContent = '호텔 보러 가기';
      go.onclick = () => { close(); document.getElementById('searchForm')?.scrollIntoView(); };
      return;
    }

    stage.classList.add('won');
    const prize = { kind: seg.kind, title: seg.title, place: seg.place, code: newCode(), won: todayKST(), claimed: false };
    rec.prizes = [...(rec.prizes || []), prize];
    save(rec);

    out.innerHTML = `<div class="rl-res">
      <img src="${ICON[seg.kind]}" alt="">
      <b>${esc(seg.title)} 당첨</b>
      <p>${esc(seg.place)}${ro(seg.place)} 떠날 준비가 됐어요.<br>아래에서 당첨 안내를 확인해주세요.</p></div>`;
    go.disabled = false;
    go.textContent = '당첨 안내 보기';
    go.onclick = () => claimForm(prize);
  }

  // ── 당첨 안내 · 연락처 접수 ─────────────────────────────────────────
  function claimForm(prize) {
    const rec = load();
    const id = memberId(rec);
    const user = account().user;

    note.style.display = 'none';
    go.style.display = 'none';
    out.innerHTML = `
      <div class="rl-slip">
        <h4>당첨을 축하드려요</h4>
        <div class="rl-row"><span>회원 아이디</span><b>${esc(id)}</b></div>
        ${user?.name ? `<div class="rl-row"><span>회원명</span><b>${esc(user.name)}</b></div>` : ''}
        <div class="rl-row"><span>당첨 번호</span><b>${esc(prize.code)}</b></div>
        <div class="rl-row"><span>당첨 상품</span><b>${esc(prize.title)}</b></div>

        <label for="rlName">이름</label>
        <input id="rlName" placeholder="홍길동" autocomplete="name" value="${esc(user?.name || '')}">
        <label for="rlEmail">이메일</label>
        <input id="rlEmail" type="email" placeholder="you@example.com" autocomplete="email">

        <div class="rl-guide">
          남겨주신 연락처로 담당자가 연락드려 <b>여행 일정을 함께 조정</b>해드립니다.<br>
          이 상품은 달리트립 본사가 마련한 이벤트로 제공됩니다.<br>
          앞으로도 달리를 많이 사랑해주세요.
        </div>
        <button class="rl-go" id="rlSend">연락처 남기기</button>
        <button class="rl-ghost" id="rlLater">나중에 하기</button>
        <div class="rl-err" id="rlErr"></div>
      </div>`;

    const $ = (s) => out.querySelector(s);
    $('#rlLater').onclick = close;
    $('#rlSend').onclick = async () => {
      const name = $('#rlName').value.trim();
      const email = $('#rlEmail').value.trim();
      const err = $('#rlErr');
      if (!name) { err.textContent = '이름을 입력해주세요.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = '이메일 주소를 확인해주세요.'; return; }

      const btn = $('#rlSend');
      btn.disabled = true; btn.textContent = '접수 중…'; err.textContent = '';

      let r;
      try {
        r = await fetch(CLAIM, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY, apikey: KEY },
          body: JSON.stringify({
            code: prize.code, prize: prize.title, prizeKind: prize.kind,
            memberId: id, memberName: user?.name || null, name, email,
          }),
        }).then((x) => x.json());
      } catch { r = { error: '연결에 실패했어요. 잠시 후 다시 시도해주세요.' }; }

      if (r.error) {
        btn.disabled = false; btn.textContent = '연락처 남기기';
        err.textContent = r.error; return;
      }

      const rec2 = load();
      const p = (rec2.prizes || []).find((x) => x.code === prize.code);
      if (p) { p.claimed = true; p.name = name; p.email = email; save(rec2); }
      thanks(prize, name);
    };
  }

  function thanks(prize, name) {
    out.innerHTML = `
      <div class="rl-slip" style="text-align:center">
        <img src="${ICON[prize.kind]}" alt="" style="width:56px;height:56px;object-fit:contain;margin:0 auto 10px">
        <h4>접수가 끝났어요, ${esc(name)} 님</h4>
        <div class="rl-guide" style="text-align:left">
          <b>${esc(prize.title)}</b> 당첨을 다시 한번 축하드립니다.<br>
          담당자가 남겨주신 이메일로 연락드려 <b>여행 일정을 함께 조정</b>해드립니다.<br>
          이 상품은 달리트립 본사가 마련한 이벤트로 제공됩니다.<br>
          앞으로도 달리를 많이 사랑해주세요.
        </div>
        <div class="rl-row" style="margin-top:14px"><span>당첨 번호</span><b>${esc(prize.code)}</b></div>
        <button class="rl-go" id="rlDone">확인</button>
      </div>`;
    out.querySelector('#rlDone').onclick = close;
  }

  // 페이지가 먼저 그려진 뒤에 띄운다.
  // rAF는 배경 탭에서 멈춘다 — 그러면 모달이 투명한 채로 남으므로 타이머를 쓴다.
  setTimeout(() => {
    document.body.appendChild(dim);
    setTimeout(() => dim.classList.add('in'), 20);
  }, DEV_ALWAYS_OPEN ? 400 : (forced ? 200 : 1400));
})();
