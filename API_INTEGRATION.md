# DallyTrip — 실제 API 연동 가이드

> 호텔 · 항공권 · 교통 데이터를 실제 공급사 API에서 가져오는 가장 쉬운 길.

---

## 0. 핵심 결정: 우리는 어떤 모델인가?

DallyTrip은 **$1 토큰 전용 결제 OTA**라서 일반 OTA와 살짝 다릅니다. 세 가지 모델 중 선택:

| 모델 | 한 줄 설명 | 장점 | 단점 |
|---|---|---|---|
| **A. Affiliate** | 검색은 우리 사이트, 예약 클릭 시 Booking/Skyscanner로 redirect | 코딩 거의 없음 · 즉시 시작 가능 | $1 결제 안 됨 (외부 사이트에서 카드 결제) · commission만 |
| **B. Wholesale (B2B)** | 도매가 API로 net rate 받음, 우리가 직접 예약/결제 처리 | $1 결제 가능 · 진짜 OTA | 계약 필요, 정산·CS 부담, 보증금 필요한 곳도 있음 |
| **C. 하이브리드 (추천)** | 검색은 무료 API(Amadeus Self-Service), 1차에는 우리가 직접 등록한 인벤토리만 예약 가능 | 1차 MVP는 빠르고, 2차에 확장 가능 | API quota 신경 써야 함 |

DallyTrip FSD에서도 **"1차는 API 없이 관리자가 직접 등록 → 2차에 API 연동"** 으로 명시되어 있습니다. 그래서 추천 순서:

1. **지금 (1차):** Amadeus Self-Service로 검색·가격만 보여주기. 예약은 admin이 등록한 인벤토리로.
2. **다음 (2차):** Duffel(항공) + Hotelbeds(호텔) 계약해서 진짜 예약·결제.

---

## 1. 항공권 (Flights)

### ⭐ 1순위: Amadeus Self-Service — 가장 쉽고 무료 quota 큼

- **링크:** https://developers.amadeus.com/register
- **가격:** 무료 quota 월 500~2,000 요청 (테스트 환경 무제한)
- **카드 등록:** 불필요 (free tier)
- **소요 시간:** 가입 ~ 첫 호출까지 **10분**

**가입 단계**
1. https://developers.amadeus.com/register 가입 (이메일만)
2. 로그인 후 **"My Self-Service Workspace"** → **"Create new app"**
3. `API Key` + `API Secret` 발급 (즉시)
4. https://developers.amadeus.com/self-service/category/flights 에서 Flight Offers Search 문서 보기

**가장 흔히 쓰는 엔드포인트**
- `GET /v2/shopping/flight-offers` — 출발지 → 도착지 검색
- `POST /v1/shopping/flight-offers/pricing` — 좌석 가격 확인
- `POST /v1/booking/flight-orders` — 실제 예약 (production tier 필요)

**JavaScript 예시 (Node 또는 Cloudflare Worker)**
```js
// 1) 토큰 받기
const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=client_credentials&client_id=${KEY}&client_secret=${SECRET}`
});
const { access_token } = await tokenRes.json();

// 2) 항공권 검색
const r = await fetch(
  'https://test.api.amadeus.com/v2/shopping/flight-offers' +
  '?originLocationCode=ICN&destinationLocationCode=DAD' +
  '&departureDate=2026-06-12&adults=2&currencyCode=USD',
  { headers: { Authorization: `Bearer ${access_token}` } }
);
const data = await r.json();
console.log(data.data); // 항공편 리스트
```

### 2순위: Duffel — 현대적 UX, 진짜 예약/결제

- **링크:** https://duffel.com/
- **가격:** Test 무제한 무료, Live는 사용량당 청구
- **특징:** Stripe같은 깔끔한 SDK, 가입 즉시 테스트 가능
- **추천 시점:** 2차 — 진짜 예약+결제를 시작할 때
- **문서:** https://duffel.com/docs/getting-started

### 3순위 (Affiliate만): Travelpayouts

- **링크:** https://www.travelpayouts.com/
- **가격:** 무료, 예약당 commission
- **특징:** Aviasales/Skyscanner 흰색 라벨, 코딩 거의 필요 없는 위젯
- **언제:** 코드 손 안 대고 검색만 시작하고 싶을 때

---

## 2. 호텔 (Hotels)

### ⭐ 1순위: Amadeus Hotel Search — 항공권과 같은 계정으로

- **링크:** https://developers.amadeus.com/self-service/category/hotels
- **장점:** 위에서 받은 같은 키로 바로 호출
- **엔드포인트:**
  - `GET /v3/shopping/hotel-offers?cityCode=DAD&checkInDate=2026-06-12&adults=2`
  - `GET /v2/e-reputation/hotel-sentiments` (리뷰 점수)
- **호텔 수:** 글로벌 150,000+

### 2순위 (도매 wholesale): Hotelbeds APITUDE

- **링크:** https://developer.hotelbeds.com/
- **가격:** Test 무료, Live는 매출 기반 계약
- **장점:** 동남아 인벤토리 매우 강함 (다낭, 푸꾸옥, 나트랑 ←DallyTrip 타겟에 딱)
- **단점:** 계약서 + 최소 매출 약정 있을 수 있음
- **언제:** 베트남 위주 사업 본격화될 때

### 3순위 (Affiliate): Booking.com Affiliate

- **링크:** https://www.booking.com/affiliate-program/v2/index.html
- **가격:** 무료, commission 4~6%
- **장점:** 가장 큰 인벤토리, 위젯/딥링크만으로 시작 가능
- **단점:** API 직접 접근은 Demand Partner 가입 필요 (~3주 심사)

### 4순위 (암호화폐 친화): Travala B2B

- **링크:** https://www.travala.com/business
- **장점:** 이미 crypto 결제 OTA — DallyTrip과 컨셉 유사
- **단점:** 파트너십 협상 필요, 공개 SDK는 제한적

---

## 3. 교통 / 공항 픽업 (Transport)

### ⭐ 1순위: GetTransfer

- **링크:** https://gettransfer.com/en/api
- **장점:** 글로벌 공항 픽업, 간단한 REST API
- **가격:** 가입 후 commission rate 협상

### 2순위: Booking.com Taxi

- **링크:** https://taxis.booking.com/partner
- **장점:** Booking 계정과 통합 가능, 매우 신뢰성 높음

### 3순위 (액티비티 + 픽업): Klook · GetYourGuide

- Klook B2B: https://www.klook.com/en/affiliate-page/
- GetYourGuide Supplier: https://supplier.getyourguide.com/
- **장점:** 동남아 강함, 도시별 액티비티 + 픽업 모두 다룸
- **단점:** 파트너십 승인 필요

---

## 4. 우리 아키텍처에 어떻게 연결할까?

```
┌─────────────────┐                                    ┌─────────────────┐
│  DallyTrip 웹앱  │  ① 검색 요청 (예: "다낭 호텔")     │  Cloudflare      │
│  (브라우저)       │ ─────────────────────────────────▶ │  Worker / Pages  │
│                  │                                    │  Functions       │
│  /app.html       │ ◀───────────────────────────────── │  (서버 함수)      │
└─────────────────┘  ④ 통일된 JSON 응답                └────────┬────────┘
                                                                 │
                                          ② API Key 첨부       ▼
                                                       ┌─────────────────┐
                                                       │  Amadeus /      │
                                                       │  Hotelbeds /    │
                                                       │  Duffel API     │
                                                       └─────────────────┘
                                          ③ raw 응답
```

**핵심 원칙**
- **API Key를 클라이언트(브라우저)에 노출 절대 금지** — 항상 서버 함수(Cloudflare Worker / Pages Functions / Supabase Edge Function)를 통해 호출
- **응답 정규화** — Amadeus/Hotelbeds/Duffel 응답 형식이 다르므로, 우리 서버에서 통일된 형태로 변환해 클라에 보냄
- **캐싱** — 같은 검색은 5~15분 캐시 (외부 API quota 보호)

### Cloudflare Pages Functions로 가장 빠르게 시작하기

이미 Cloudflare Pages에 배포 중이므로, `dallytrip/functions/` 폴더만 만들면 서버 함수 자동 활성화됩니다.

```
dallytrip/
├── index.html
├── app.html
└── functions/
    └── api/
        ├── flights/
        │   └── search.js     ← GET /api/flights/search?from=ICN&to=DAD
        └── hotels/
            └── search.js     ← GET /api/hotels/search?city=DAD
```

**`functions/api/flights/search.js` 예시:**
```js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const date = url.searchParams.get('date');

  // 토큰 캐시 (전역 KV에 저장 권장)
  const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${env.AMADEUS_KEY}&client_secret=${env.AMADEUS_SECRET}`
  });
  const { access_token } = await tokenRes.json();

  const apiRes = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${from}&destinationLocationCode=${to}&departureDate=${date}&adults=1&max=10`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const raw = await apiRes.json();

  // 우리 앱이 쓰는 모양으로 정규화
  const offers = (raw.data || []).map(o => ({
    id: o.id,
    price: Math.round(parseFloat(o.price.total)),
    currency: o.price.currency,
    airline: o.validatingAirlineCodes?.[0],
    segments: o.itineraries[0].segments.map(s => ({
      from: s.departure.iataCode, to: s.arrival.iataCode,
      depart: s.departure.at, arrive: s.arrival.at,
      flightNo: s.carrierCode + s.number, duration: s.duration
    }))
  }));

  return new Response(JSON.stringify({ offers }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' }
  });
}
```

**환경변수 등록 (Cloudflare 대시보드):**
1. Workers & Pages → `dallytrip` 프로젝트 → **Settings → Environment variables**
2. `AMADEUS_KEY`, `AMADEUS_SECRET` 추가 (Production / Preview 양쪽)
3. 재배포 → `/api/flights/search?from=ICN&to=DAD&date=2026-06-12` 호출

---

## 5. 결제 흐름 — $1 토큰을 어떻게 연결?

핵심 챌린지: 항공사·호텔은 $1 토큰을 모릅니다 — USD/EUR로 정산해야 합니다.

**권장 흐름:**
1. 유저가 우리 사이트에서 $1 토큰으로 결제 (TonConnect)
2. 우리 서버가 트랜잭션 검증
3. 우리 보유 운영 자금(fiat/USDT)으로 공급사에 즉시 결제 (Amadeus는 가상 카드 발급 가능)
4. 예약 확정 → 유저에게 발권/voucher 전달

**가상 카드 발급 옵션:**
- Stripe Issuing (US/EU)
- Marqeta
- Booking Demand는 자체 가상 카드 지원

이건 2차 단계 — 1차에는 admin이 직접 인벤토리 등록 → 직접 정산이 가장 안전합니다.

---

## 6. 단계별 로드맵 (실제로 이 순서로 진행 권장)

### Phase 1 (지금 ~ 2주)
- ✅ 이미 완료: admin이 직접 상품 등록, $1 결제 흐름, UI
- ⬜ Amadeus Self-Service 가입 → API key 발급
- ⬜ Cloudflare Pages Functions에 `/api/flights/search`, `/api/hotels/search` 추가
- ⬜ app.html에서 mock data 대신 fetch 사용 (admin 등록 상품도 같이 노출)

### Phase 2 (1~2개월)
- ⬜ Duffel 가입 → 항공권 실제 예약 (Order API)
- ⬜ Hotelbeds Demand 계약 → 베트남 호텔 wholesale 가격
- ⬜ Stripe Issuing 또는 가상 카드 발급 솔루션
- ⬜ 결제 자동화 (사용자 $1 → 공급사 fiat)

### Phase 3 (3개월+)
- ⬜ Telegram Mini App 래퍼
- ⬜ GetYourGuide / Klook 액티비티 추가
- ⬜ 자체 호스트 인벤토리(베트남 현지 파트너 직계약)
- ⬜ Travala 또는 다른 crypto-OTA와 데이터 공유

---

## 7. 빠른 시작 — 5분만에 Amadeus 키 받기

1. 브라우저로 https://developers.amadeus.com/register 열기
2. 이메일·이름 입력 → 인증 메일 클릭
3. 로그인 → **"My Self-Service Workspace"** 메뉴
4. **"Create new app"** → 이름 `dallytrip-dev` 입력
5. 다음 페이지에 나오는 **API Key**와 **API Secret** 복사
6. `.env` 또는 Cloudflare 환경변수에 저장
7. 위 6번 섹션의 `functions/api/flights/search.js` 파일을 만들고 push
8. 자동 배포 → `https://dallytrip.com/api/flights/search?from=ICN&to=DAD&date=2026-07-01` 로 테스트

키 받으시면 같이 코드 붙여드릴게요.

---

## 참고 링크 모음

| 분야 | 서비스 | 링크 |
|---|---|---|
| 항공 (무료/쉬움) | Amadeus Self-Service | https://developers.amadeus.com/ |
| 항공 (현대적) | Duffel | https://duffel.com/docs/getting-started |
| 항공 (Affiliate) | Travelpayouts | https://www.travelpayouts.com/ |
| 호텔 (무료) | Amadeus Hotel Search | https://developers.amadeus.com/self-service/category/hotels |
| 호텔 (도매) | Hotelbeds APITUDE | https://developer.hotelbeds.com/ |
| 호텔 (Affiliate) | Booking.com | https://www.booking.com/affiliate-program/v2/ |
| 호텔 (Crypto) | Travala B2B | https://www.travala.com/business |
| 교통 | GetTransfer | https://gettransfer.com/en/api |
| 교통 | Booking Taxi | https://taxis.booking.com/partner |
| 액티비티 | Klook B2B | https://www.klook.com/en/affiliate-page/ |
| 액티비티 | GetYourGuide Supplier | https://supplier.getyourguide.com/ |
| 결제 | Stripe Issuing (가상카드) | https://stripe.com/issuing |
| 결제 | TonConnect (이미 사용) | https://docs.ton.org/develop/dapps/ton-connect/overview |
