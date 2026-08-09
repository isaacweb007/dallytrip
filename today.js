/* 달리트립 — 오늘의 달리
 *
 * 매일 달리가 다른 도시에 가 있고, 1인칭으로 그 도시를 들려준다.
 * 룰렛이 '운'이라면 이건 '영감'이다 — 성격이 겹치지 않게 나눠 뒀다.
 *
 * 도시는 한국 시간 날짜로 정해진다. 같은 날이면 모두가 같은 도시를 본다.
 * 도시 그림은 브랜드 클레이 일러스트(img/city/)를 쓰고, 최저가만 hotels-search에서
 * 빌려와 하루치를 브라우저에 캐시한다.
 *
 * 마크업까지 이 파일이 직접 만든다 — index.html이 디자인 작업으로 재생성돼도
 * <script src="js/today.js?v=N"> 한 줄만 살아 있으면 된다.
 * (파일을 고치면 N을 올릴 것 — Cloudflare가 .js를 4시간 캐시한다)
 */
(() => {
  const SEARCH = 'https://hzwxeyxnlpmauyeqscim.supabase.co/functions/v1/hotels-search';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d3hleXhubHBtYXV5ZXFzY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODM1NzMsImV4cCI6MjEwMTY1OTU3M30.ccyV9CPuAfR1OvvgjIgaDORkKMNjPNeoyiHbLoKQGF4';
  const CACHE = 'dallytrip_today';

  // 달리가 1인칭으로 들려준다. "아름다운 해변" 같은 말은 쓰지 않는다 —
  // 그 도시에 가야만 알 수 있는 구체적인 것 하나가 사람을 떠나게 만든다.
  const CITIES = [
    { city: '호이안', country: '베트남', art: 'img/city/city-hoian.webp', q: '호이안',
      story: '해가 지면 강가에 등불이 하나씩 켜져요. 배를 타고 등불을 강에 띄우면 소원이 이뤄진댔어요. 저는 세 번째 등불을 띄웠어요.',
      only: ['등불 배 타고 소원 띄우기', '재봉소에서 하루 만에 옷 맞추기', '자전거로 구시가 한 바퀴'] },
    { city: '다낭', country: '베트남', art: 'img/city/city-danang.webp', q: '다낭',
      story: '아침 다섯 시 반에 미케 비치에 나가 봤어요. 어부들이 동그란 바구니 배를 밀고 나가는 걸 보고 있으면 해가 바다에서 올라와요.',
      only: ['새벽 미케 비치에서 해 뜨는 것 보기', '바나힐 골든브리지 손 위 걷기', '오행산 동굴 안 사원 오르기'] },
    { city: '나트랑', country: '베트남', art: 'img/city/city-nhatrang.webp',
      story: '섬으로 가는 케이블카가 바다 위를 6킬로미터나 지나가요. 발밑이 전부 물이라 조금 무서운데, 자꾸 아래를 보게 돼요.',
      only: ['바다 위 케이블카 타고 섬 가기', '진흙 온천에 몸 담그기', '밤에 야시장에서 반쎄오 먹기'], q: '나트랑' },
    { city: '푸꾸옥', country: '베트남', art: 'img/city/city-phuquoc.webp', q: '푸꾸옥',
      story: '해변 모래가 밀가루처럼 고와서 발이 푹푹 들어가요. 저녁엔 후추 농장에서 갓 딴 후추 냄새가 바람에 실려 와요.',
      only: ['사오 비치 흰 모래 밟기', '후추 농장에서 갓 딴 후추 사기', '느억맘 공장에서 진짜 피시소스 맛보기'] },
    { city: '하노이', country: '베트남', art: 'img/city/city-hanoi.webp', q: '하노이',
      story: '기찻길 바로 옆에 카페가 붙어 있어요. 기차가 올 시간이 되면 다들 의자를 안으로 들이고, 지나가면 다시 내놔요.',
      only: ['기찻길 카페에서 기차 지나가는 것 보기', '에그커피 마시기', '호안끼엠 호수 새벽 체조 구경'] },
    { city: '호치민', country: '베트남', art: 'img/city/city-hochiminh.webp', q: '호치민',
      story: '오토바이가 강물처럼 흘러가요. 처음엔 못 건널 줄 알았는데, 천천히 걸어가면 오토바이가 알아서 저를 피해 가더라고요.',
      only: ['벤탄 시장에서 흥정하기', '옥상 바에서 오토바이 물결 내려다보기', '골목 반미 노점 줄 서기'] },
    { city: '방콕', country: '태국', art: 'img/city/city-bangkok.webp', q: '방콕',
      story: '강을 건너는 배가 버스처럼 다녀요. 30바트를 내고 올라타면 사원들이 하나씩 지나가는데, 택시보다 빠르고 훨씬 시원해요.',
      only: ['짜오프라야 수상버스로 사원 순회', '새벽 수산시장에서 아침 먹기', '마사지 받고 망고밥 먹기'] },
    { city: '치앙마이', country: '태국', art: 'img/city/city-chiangmai.webp', q: '치앙마이',
      story: '산속 절까지 300개 계단을 올라갔어요. 다 오르니 도시가 통째로 발밑에 있었고, 종소리가 계속 울렸어요.',
      only: ['도이수텝 계단 300개 오르기', '일요일 밤 워킹스트리트 걷기', '코끼리 보호소에서 하루 보내기'] },
    { city: '푸껫', country: '태국', art: 'img/city/city-phuket.webp', q: '푸껫',
      story: '섬 사이를 배로 다니는데, 물이 너무 맑아서 배 그림자가 바닥에 그대로 비쳐요. 물 위에 떠 있는 건지 공중에 뜬 건지 헷갈려요.',
      only: ['피피섬 배 타고 건너가기', '올드타운 파스텔 건물 사이 걷기', '해 질 때 프롬텝 곶에 앉아 있기'] },
    { city: '세부', country: '필리핀', art: 'img/city/city-cebu.webp', q: '세부',
      story: '고래상어가 저보다 훨씬 컸어요. 무섭지 않냐고요? 눈이 아주 작고 순해서, 옆에 있으면 오히려 조용해져요.',
      only: ['고래상어와 나란히 헤엄치기', '카와산 폭포에서 뛰어내리기', '레촌 통째로 구운 것 맛보기'] },
    { city: '보라카이', country: '필리핀', art: 'img/city/city-boracay.webp', q: '보라카이',
      story: '해변 모래가 발에 안 붙어요. 걸어도 신발이 깨끗해서 신기했어요. 해 질 무렵엔 하늘이 4킬로미터 내내 주황색이에요.',
      only: ['화이트비치 4킬로미터 걷기', '돛단배 타고 노을 보기', '푸카조개 목걸이 만들기'] },
    { city: '발리', country: '인도네시아', art: 'img/city/city-bali.webp', q: '발리',
      story: '계단처럼 생긴 논이 산을 통째로 덮고 있어요. 아침엔 안개가 논 사이에 고여 있다가 해가 뜨면 천천히 걷혀요.',
      only: ['뜨갈랄랑 계단식 논 사이 걷기', '바다 위 절벽 사원에서 해넘이 보기', '아침 요가 하고 과일 먹기'] },
    { city: '싱가포르', country: '싱가포르', art: 'img/city/city-singapore.webp', q: '싱가포르',
      story: '나무처럼 생긴 철탑에서 밤마다 빛이 쏟아져요. 사람들이 다 바닥에 누워서 봐요. 저도 누웠어요.',
      only: ['가든스 바이 더 베이 밤 조명쇼 보기', '호커센터에서 치킨라이스 먹기', '동물원에서 밤 사파리 타기'] },
    { city: '쿠알라룸푸르', country: '말레이시아', art: 'img/city/city-kualalumpur.webp', q: '쿠알라룸푸르',
      story: '쌍둥이 빌딩 사이에 다리가 걸려 있어요. 41층 높이에서 창밖을 보면 구름이 눈높이에 있어요.',
      only: ['페트로나스 41층 스카이브리지 건너기', '동굴 사원 272개 계단 오르기', '잘란 알로 야시장에서 사테 먹기'] },
    { city: '코타키나발루', country: '말레이시아', art: 'img/city/city-kotakinabalu.webp', q: '코타키나발루',
      story: '세상에서 노을이 가장 예쁜 곳 중 하나래요. 해가 바다로 떨어질 때 하늘이 분홍에서 보라로 천천히 넘어가요.',
      only: ['탄중아루 해변에서 노을 보기', '섬 다섯 개 배로 건너다니기', '반딧불이 강 밤 투어'] },
    { city: '루앙프라방', country: '라오스', art: 'img/city/city-luangprabang.webp', q: '루앙프라방',
      story: '새벽 여섯 시에 스님들이 맨발로 줄지어 걸어와요. 사람들이 길에 앉아 밥을 조금씩 나눠 드려요. 아무도 말을 안 해요.',
      only: ['새벽 탁발 행렬 보기', '옥빛 꽝시 폭포에서 물놀이', '메콩강 배 타고 동굴 사원 가기'] },
    { city: '시엠립', country: '캄보디아', art: 'img/city/city-siemreap.webp', q: '시엠립',
      story: '나무뿌리가 돌 사원을 통째로 감싸 안고 있어요. 몇백 년 동안 서로 붙어 자란 거래요. 뭐가 먼저였는지 알 수가 없어요.',
      only: ['앙코르와트 일출 기다리기', '나무가 삼킨 타프롬 사원 걷기', '수상 마을 배 타고 들어가기'] },
    { city: '타이베이', country: '대만', art: 'img/city/city-taipei.webp', q: '타이베이',
      story: '산속 마을에 등불을 날렸어요. 소원을 붓으로 쓰고 불을 붙이면 하늘로 올라가요. 제 등불은 꽤 오래 보였어요.',
      only: ['핑시에서 소원 등불 날리기', '지우펀 붉은 등롱 골목 걷기', '야시장에서 버블티 원조 마시기'] },
    { city: '오사카', country: '일본', art: 'img/city/city-osaka.webp', q: '오사카',
      story: '밤에 강가로 나가면 간판들이 물에 비쳐서 거리가 두 개처럼 보여요. 사람들이 다 서서 뭔가를 먹고 있어요.',
      only: ['도톤보리 강가에서 간판 구경', '서서 타코야키 먹기', '오사카성 해자 따라 한 바퀴'] },
    { city: '후쿠오카', country: '일본', art: 'img/city/city-fukuoka.webp', q: '후쿠오카',
      story: '해가 지면 길가에 포장마차가 하나씩 세워져요. 천막 안에 여덟 명쯤 어깨를 붙이고 앉아서 라멘을 먹어요.',
      only: ['나카스 포장마차에서 라멘 먹기', '온천 마을까지 기차로 가기', '아침 시장에서 명란 사기'] },
  ];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 한국 시간 기준 날짜. 같은 날이면 누구나 같은 도시를 본다.
  const kst = () => new Date(Date.now() + 9 * 3600e3);
  const dayNo = () => Math.floor(kst().getTime() / 86400000);
  const today = () => kst().toISOString().slice(0, 10);
  const fmt = (d) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;

  const load = () => { try { return JSON.parse(localStorage.getItem(CACHE)) || {}; } catch { return {}; } };
  const save = (v) => { try { localStorage.setItem(CACHE, JSON.stringify(v)); } catch { /* 시크릿 모드 */ } };

  // ── 모양 ─────────────────────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    #today{margin:0 auto 8px}
    .td-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px}
    .td-head h2{margin:0;font-size:26px;font-weight:800;letter-spacing:-.7px;color:var(--ink,#22254C)}
    .td-when{font-size:13.5px;font-weight:700;color:var(--ink-soft,#5A5E86)}
    .td-nav{margin-left:auto;display:flex;gap:6px}
    .td-nav button{width:34px;height:34px;border-radius:50%;border:1.5px solid var(--line,#F0E7DB);
      background:var(--card,#fff);color:var(--ink-soft,#5A5E86);font-size:15px;font-weight:800;
      font-family:inherit;cursor:pointer;transition:.15s}
    .td-nav button:hover:not([disabled]){border-color:#FFD9CC;color:var(--ink,#22254C)}
    .td-nav button[disabled]{opacity:.35;cursor:default}

    .td-card{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);
      background:var(--card,#fff);border-radius:var(--r-lg,24px);overflow:hidden;
      box-shadow:var(--shadow,0 10px 30px rgba(34,37,76,.10))}
    .td-photo{position:relative;min-height:300px;background:linear-gradient(135deg,var(--sky,#EAF4FF),#FDEFE0)}
    .td-photo img{width:100%;height:100%;object-fit:cover;display:block}
    .td-place{position:absolute;left:18px;bottom:18px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.45)}
    .td-place b{display:block;font-size:27px;font-weight:800;letter-spacing:-.8px;line-height:1.15}
    .td-place span{font-size:13px;font-weight:700;opacity:.92}
    .td-price{position:absolute;right:16px;top:16px;background:rgba(255,255,255,.94);border-radius:12px;
      padding:7px 12px;font-size:13px;font-weight:800;color:var(--ink,#22254C);
      box-shadow:0 4px 14px rgba(34,37,76,.18)}

    .td-body{padding:26px 28px;display:flex;flex-direction:column}
    .td-say{display:flex;gap:12px;align-items:flex-start}
    .td-say img{width:44px;height:44px;flex:0 0 auto;border-radius:50%;background:#FFF2E4;
      object-fit:contain;padding:3px;box-shadow:0 3px 10px rgba(34,37,76,.12)}
    .td-say p{margin:0;font-size:15.5px;line-height:1.78;font-weight:600;color:var(--ink,#22254C)}
    .td-only{margin-top:20px}
    .td-only b{display:block;font-size:11.5px;font-weight:800;letter-spacing:.7px;color:var(--coral,#FF6B4A);
      text-transform:uppercase;margin-bottom:9px}
    .td-only li{list-style:none;font-size:14px;font-weight:600;color:var(--ink-soft,#5A5E86);
      line-height:1.5;padding:6px 0 6px 18px;position:relative}
    .td-only ul{margin:0;padding:0}
    .td-only li::before{content:'';position:absolute;left:0;top:14px;width:6px;height:6px;
      border-radius:50%;background:var(--gold,#F5B301)}
    .td-go{margin-top:auto;padding-top:20px}
    .td-go button{width:100%;border:0;border-radius:15px;padding:14px;font-family:inherit;
      font-size:15.5px;font-weight:800;color:#fff;background:var(--coral,#FF6B4A);cursor:pointer;
      box-shadow:0 8px 18px rgba(232,83,47,.28);transition:background .15s}
    .td-go button:hover{background:var(--coral-deep,#E8532F)}

    @media (max-width:860px){
      .td-card{grid-template-columns:1fr}
      .td-photo{min-height:210px}
      .td-body{padding:22px 20px}
      .td-head h2{font-size:22px}
    }`;
  document.head.appendChild(css);

  // ── 그리기 ───────────────────────────────────────────────────────────
  const base = dayNo();
  let back = 0;                                   // 0이면 오늘, 1이면 어제…
  const MAX_BACK = 6;                             // 지난 이야기는 일주일치까지

  const pick = (b) => CITIES[((base - b) % CITIES.length + CITIES.length) % CITIES.length];

  const section = document.createElement('section');
  section.id = 'today';
  section.className = 'rv show';

  function paint() {
    const c = pick(back);
    const d = new Date(kst().getTime() - back * 86400e3);
    section.innerHTML = `
      <div class="td-head">
        <h2>오늘의 달리</h2>
        <div class="td-when">${esc(fmt(d))}${back ? ' · 지난 이야기' : ''}</div>
        <div class="td-nav">
          <button id="tdPrev" ${back >= MAX_BACK ? 'disabled' : ''} aria-label="지난 이야기">‹</button>
          <button id="tdNext" ${back === 0 ? 'disabled' : ''} aria-label="다음 이야기">›</button>
        </div>
      </div>
      <div class="td-card">
        <div class="td-photo" id="tdPhoto">
          <img src="${esc(c.art)}" alt="${esc(c.city)} 클레이 일러스트" decoding="async">
          <div class="td-place"><b>${esc(c.city)}</b><span>${esc(c.country)}</span></div>
        </div>
        <div class="td-body">
          <div class="td-say">
            <img src="icons/dally-face.webp" alt="달리">
            <p>${esc(c.story)}</p>
          </div>
          <div class="td-only">
            <b>여기서만 할 수 있는 것</b>
            <ul>${c.only.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>
          <div class="td-go"><button id="tdGo">${esc(c.city)} 호텔 보기</button></div>
        </div>
      </div>`;

    section.querySelector('#tdPrev').onclick = () => { if (back < MAX_BACK) { back++; paint(); } };
    section.querySelector('#tdNext').onclick = () => { if (back > 0) { back--; paint(); } };
    section.querySelector('#tdGo').onclick = () => go(c);
    fillPhoto(c);
  }

  // 검색폼을 채우고 그대로 검색한다 — 꿈만 꾸고 끝나지 않게
  function go(c) {
    const f1 = document.getElementById('f1'), f2 = document.getElementById('f2'), f3 = document.getElementById('f3');
    if (!f1) return;
    const tab = document.querySelector('.tab[data-t="hotel"]');
    if (tab && !tab.classList.contains('on')) tab.click();
    f1.value = c.q;
    if (!f2.value) f2.value = plus(30);
    if (!f3.value) f3.value = plus(32);
    document.getElementById('searchForm')?.dispatchEvent(new Event('submit'));
  }

  const plus = (n) => new Date(Date.now() + n * 86400e3).toISOString().slice(0, 10);

  // 최저가만 이미 도는 호텔 검색에서 빌려 온다.
  // 도시는 하루 종일 같으므로 하루치를 캐시해 호출을 아낀다.
  async function fillPhoto(c) {
    const box = section.querySelector('#tdPhoto');
    const key = `${today()}|${c.q}`;
    const cache = load();

    const put = (v) => {
      if (!v || !v.from || pick(back).q !== c.q) return;       // 그새 다른 날짜로 넘겼으면 무시
      box.insertAdjacentHTML('beforeend', `<div class="td-price">${esc(v.from)}부터</div>`);
    };

    if (cache[key]) return put(cache[key]);

    try {
      const r = await fetch(SEARCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY, apikey: KEY },
        body: JSON.stringify({ destination: c.q, checkin: plus(30), checkout: plus(32), adults: 2 }),
      }).then((x) => x.json());

      if (!(r.hotels || []).length) return;
      const cheapest = r.hotels.reduce((a, b) => (a.total_usd <= b.total_usd ? a : b));
      const v = { from: `$${Math.round(cheapest.total_usd / 2)}` };   // 2박 검색이라 1박 기준으로 나눈다

      const next = load();
      for (const k of Object.keys(next)) if (!k.startsWith(today())) delete next[k];   // 어제 것은 버린다
      next[key] = v; save(next);
      put(v);
    } catch { /* 사진이 없어도 이야기는 읽힌다 */ }
  }

  // 검색창 바로 아래, '인기 여행지' 위에 놓는다 — 읽고 나서 바로 검색으로 이어지게
  const anchor = document.getElementById('dest');
  if (!anchor) return;
  anchor.parentNode.insertBefore(section, anchor);
  paint();
})();
