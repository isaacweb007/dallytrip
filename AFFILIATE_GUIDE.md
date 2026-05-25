# DallyTrip — 수익형 제휴(Affiliate) API 가이드

> 우리 앱에서 사용자가 예약하면 **commission이 들어오는** API들. 가입부터 키 받기까지 단계별로 정리.

---

## 🏆 가장 먼저 가입해야 할 곳: Travelpayouts (한 곳에서 다 됨)

**왜 1순위:**
- Aviasales(항공) + Hotellook(호텔) + Rentalcars(렌트카) + GetYourGuide(액티비티) + Booking + Skyscanner 등 **70+ 브랜드를 키 1개로** 사용
- 가입 즉시 자동 승인 (심사 없음)
- 카드/사업자 등록 불필요
- 한국에서 가입 OK, 페이아웃은 PayPal/Webmoney/계좌이체

**가입 단계 (10분)**
1. 👉 https://www.travelpayouts.com/?marker=dallytrip 접속
2. 우측 상단 **Sign Up** 클릭 → 이메일·비밀번호 입력
3. 인증 메일 클릭 → 로그인
4. 대시보드에서 **"Tools" → "API Access"** 메뉴
5. **`API Token`** 복사 (이게 모든 브랜드 공통 키)
6. **"My Performance" → "Marker"** 메뉴에서 자기 ID 확인 (예: `dallytrip`) — 모든 링크에 `?marker=dallytrip` 붙이면 본인 추적

**수익 모델**
| 브랜드 | commission | 정산 |
|---|---|---|
| Aviasales (항공) | 1.6~3% | 60일 후 |
| Hotellook (호텔) | 6~7% | 1일~30일 후 |
| Booking.com | 4~5% | 체크아웃 후 |
| Rentalcars | 6~8% | 픽업 후 |
| GetYourGuide | 8% | 7일 후 |

**우리 앱에 붙이는 방법**
- **위젯:** 가장 빠름. 검색 form HTML 코드 복사 → app.html에 붙여넣기
- **딥링크:** `https://www.aviasales.com/search?marker=dallytrip&...` 형식으로 우리 카드의 "예약하기" 버튼 href에 박기
- **데이터 API:** Aviasales Flights Data API로 실제 가격 받아와 우리 UI에 렌더

---

## ✈️ 항공권 (Flights) — 분야별 직접 제휴

### 1️⃣ Aviasales (Travelpayouts 산하) ⭐ 가장 쉬움
- 위에 포함됨. 별도 가입 불필요.
- 단독 가입 원하면: https://www.travelpayouts.com/programs/100/

### 2️⃣ Skyscanner Travel API
- 👉 https://www.partners.skyscanner.net/products
- **단계:**
  1. 사이트에서 **"Apply for partner"** 클릭
  2. 사업 정보 입력 → 1~2주 심사
  3. 승인 시 API key 발급
- **수익:** Skyscanner 통한 항공권 redirect commission
- **언제 필요:** Travelpayouts보다 fresh data가 필요한 경우

### 3️⃣ Duffel ⭐ 직접 판매 + 마진
- 👉 https://duffel.com/
- **단계:**
  1. **Sign up** → 이메일·회사명만
  2. 대시보드에서 **API access** 메뉴
  3. **Test mode API key** 즉시 발급 (무료, 무제한 테스트)
  4. Live 가려면 **business verification** (~3일)
- **수익:** commission 아니라 **직접 마진** — 우리가 가격 결정해서 차익 가져감 ($1 토큰 컨셉에 가장 잘 맞음)
- **문서:** https://duffel.com/docs

---

## 🏨 호텔 / 숙박 (Hotels)

### 1️⃣ Booking.com Affiliate Partner ⭐ 글로벌 1위
- 👉 https://www.booking.com/affiliate-program/v2/index.html
- **단계:**
  1. **"Sign up now"** 클릭
  2. 웹사이트 URL(`https://dallytrip.com`), 사업 유형 입력
  3. **즉시 승인** (대부분)
  4. 대시보드 → **"API & feed"** → API ID 발급
  5. 검색 위젯 / 딥링크 / Demand Partner API 중 선택
- **수익:** Booking이 받는 commission의 **25~40%** (≈ 호텔비의 4~6%)
- **정산:** 매월, 최소 €100 누적

### 2️⃣ Agoda Partner Hub ⭐ 아시아 강함
- 👉 https://partners.agoda.com/
- **단계:**
  1. **"Join now"** → 가입
  2. **Partner Hub** 로그인
  3. **Affiliate ID** 발급 (자동 승인)
  4. 위젯/딥링크/XML API 선택
- **수익:** 약 5% per booking
- **DallyTrip 적합도:** 베트남·동남아 인벤토리가 매우 좋음

### 3️⃣ Hotels.com / Expedia Affiliate (TAAP)
- 👉 https://welcome.travelagentaffiliates.com/
- **단계:**
  1. **Apply now** → 사업체 정보 입력 → ~3~7일 심사
  2. 승인 시 EAN(Expedia Affiliate Network) 자격
  3. https://developers.expediagroup.com/ 에서 Rapid API key 발급

### 4️⃣ Trip.com Affiliate ⭐ 중화권 강함
- 👉 https://www.trip.com/partners/ap/
- **단계:**
  1. **Become a partner** → 가입
  2. 즉시 affiliate ID 발급
  3. 위젯/딥링크 사용 가능

### 5️⃣ Hotelbeds APItude ⭐ 도매 (B2B) — 진짜 OTA
- 👉 https://developer.hotelbeds.com/
- **단계:**
  1. **Register** → 회사 정보 입력
  2. 영업팀과 1~2주 협의 (이메일/콜)
  3. 계약 후 **APItude key** 발급
  4. 테스트 환경 무료, 실제 예약은 deposit 또는 매출 정산
- **수익:** commission이 아니라 **net rate(도매가)** 받음 → 우리가 가격 결정 → $1 토큰으로 마진 가져감
- **추천 시점:** 베트남 위주 본격 사업 시작할 때 (2차)

### 6️⃣ Travala B2B (암호화폐 OTA)
- 👉 https://www.travala.com/business
- **특징:** 이미 BTC/USDT 등 받는 OTA — DallyTrip과 컨셉 같음, 협업/화이트라벨 가능성
- **단계:** 사이트의 contact form으로 partnership 문의

---

## 🚗 렌트카 (Car Rental)

### 1️⃣ DiscoverCars Affiliate ⭐ 가장 쉬움
- 👉 https://www.discovercars.com/affiliate
- **단계:**
  1. **Join now** → 가입 (이메일만)
  2. 즉시 승인 + 위젯/딥링크/API 액세스
  3. 대시보드에서 **API key** 발급
- **수익:** commission의 **70%** 공유 (≈ 렌트카비의 5~8%)
- **정산:** 월 1회, 최소 $50

### 2️⃣ Rentalcars.com Affiliate (Booking 산하)
- 👉 https://www.rentalcars.com/Affiliates.do
- Booking Affiliate에 이미 포함됨 (위 §호텔 1번)
- 별도 가입 원하면 위 링크에서 신청

### 3️⃣ Auto Europe Affiliate
- 👉 https://www.autoeurope.com/affiliate-program/
- 유럽 강함

### 4️⃣ EconomyBookings / GetTransfer 등
- 👉 https://www.economybookings.com/affiliate-program
- 다양한 wholesale 옵션 보유

---

## 🎟 액티비티 / 투어 / 픽업 (Activities)

### 1️⃣ GetYourGuide Affiliate ⭐ 가장 인기
- 👉 https://www.getyourguide.com/affiliate
- **단계:**
  1. **Become a partner** → 가입
  2. 사이트 URL 입력, 1~3일 심사
  3. 승인 후 partner key 발급
  4. 검색 위젯 / 딥링크 / API 선택
- **수익:** **8%** per booking
- **DallyTrip 추천도:** 다낭 바나힐스, 하롱베이 크루즈 등 우리 인벤토리와 90% 겹침

### 2️⃣ Viator Partner Program (TripAdvisor 산하)
- 👉 https://www.viator.com/affiliates
- **단계:**
  1. **Sign up** → 즉시 승인
  2. Marketing tools에서 위젯·딥링크
- **수익:** 8% per booking

### 3️⃣ Klook Affiliate ⭐ 아시아 강함
- 👉 https://www.klook.com/en/affiliate-page/
- **단계:**
  1. **Become a partner** → 가입
  2. ~3일 심사 → API/위젯 액세스
- **수익:** 2~5%
- **DallyTrip 추천도:** 베트남·태국 액티비티 압도적

### 4️⃣ Tiqets Affiliate
- 👉 https://www.tiqets.com/en/affiliates/
- 박물관·전시 등 도시 액티비티 강함

---

## 🌐 종합 네트워크 (한 계정으로 여러 브랜드)

| 네트워크 | 다루는 브랜드 | 가입 링크 |
|---|---|---|
| **Travelpayouts** ⭐ | Aviasales, Booking, Hotellook, Rentalcars, GetYourGuide, Trip.com 등 70+ | https://www.travelpayouts.com/ |
| **CJ Affiliate** | Booking, Expedia, Hotels.com, Hertz, Carnival 등 | https://www.cj.com/ |
| **Awin** | Expedia, Booking, AirBnB, Lonely Planet 등 | https://www.awin.com/ |
| **Impact** | Marriott, Airbnb, Hertz 등 | https://impact.com/ |

→ **결론:** 처음에는 **Travelpayouts** 하나로 시작이 가장 빠릅니다.

---

## 🎯 DallyTrip 추천 로드맵 (수익 관점)

### Phase 1 — 이번 주 (5분 가입 × 3개)
1. **Travelpayouts** 가입 → API token 1개로 항공+호텔+렌트카+액티비티 다 시작
2. **Booking Affiliate** 가입 → Booking 인벤토리 직접 통합 (Travelpayouts보다 좋은 호텔 commission)
3. **DiscoverCars Affiliate** 가입 → 렌트카 (Booking에 빠진 차종 보완)

→ 이 3개만 가입하면 **모든 카테고리의 검색·예약 데이터 + commission 수익 구조 완성**

### Phase 2 — 다음 달 (제대로 OTA화)
4. **Hotelbeds APItude** 영업팀 컨택 → net rate 호텔 (베트남)
5. **Duffel** verification → 항공권 직접 발권 + 마진
6. **GetYourGuide / Klook** 정식 partner → 액티비티 큰 인벤토리

### Phase 3 — 3개월+ ($1 토큰 결제 통합)
7. **Stripe Issuing** 또는 **Marqeta** 가상카드 발급 → 사용자 $1 → 우리가 가상카드로 공급사 결제 자동화
8. **Travala B2B** 협업 검토 — 같은 crypto-OTA 컨셉

---

## 💰 예상 수익 시뮬레이션 (1차 가입만으로)

가정: 월 1,000명 방문, 5% 전환 (= 50건 예약), 평균 예약가 $150

| 카테고리 | commission % | 월 예약 | 평균가 | 월 수익 |
|---|---|---|---|---|
| 호텔 (Booking) | 5% | 25건 | $200 | $250 |
| 항공 (Aviasales) | 2% | 10건 | $300 | $60 |
| 렌트카 (DiscoverCars) | 6% | 8건 | $80 | $38 |
| 액티비티 (GetYourGuide) | 8% | 7건 | $60 | $34 |
| **합계** | | **50건** | | **$382/월** |

월 1,000 방문이 작은 숫자라 commission이 낮아 보이지만, 10,000 방문이면 $3,800/월. SNS·SEO 마케팅 + Telegram 채널 통해 트래픽 늘리면 빠르게 성장 가능.

---

## ⚡ 지금 바로 5분 액션 (가장 빠른 시작)

1. **새 탭** → https://www.travelpayouts.com 접속
2. 우측 상단 **Sign Up** → 이메일·비밀번호 입력 → 인증 메일 클릭
3. 로그인 → **Tools → API Access** → **API Token 복사**
4. **My Performance → Markers** → 본인 marker 확인 (예: `123456`)
5. **이 두 값(API Token, Marker)을 저에게 알려주시면** 제가 `dallytrip/functions/api/` 폴더에 4개 endpoint(flights/hotels/cars/activities)를 만들고 자동 배포까지 완료합니다.

또는 코드 없이 **위젯만 박기**도 가능:
- 위 단계 4 다음 → **Tools → Search forms** → 원하는 위젯(항공/호텔) 디자인 선택 → HTML 코드 복사 → 우리 hero에 붙여넣기

---

## 참고: 가입 시 필요한 사이트 URL

가입 시 거의 모든 affiliate가 "사이트 URL"을 묻습니다. 다음을 사용하세요:

```
사이트: https://dallytrip.com
설명:   Web3 travel booking platform on TON Chain. Users book hotels,
        flights, car rentals and activities by paying with the $1 Token.
타겟:   Crypto users in Korea, Vietnam, Japan, Thailand
월 트래픽: (초기엔 1,000 미만이라고 적어도 OK — 정직하게)
```

`https://dallytrip.com`은 이미 라이브이므로 영업팀이 사이트 확인해도 정상 OK.

---

## 📈 추가 sub-key 가입으로 commission 더 높이기

Travelpayouts 키 하나로 이미 항공/호텔/렌트카/액티비티 모두 commission 추적됩니다. 다만 **분야별 직접 affiliate**에 추가 가입하면 같은 예약에서 commission이 더 올라갑니다.

### 1) GetYourGuide 직접 partner (액티비티 8%)

**가입 (3분):**
1. 👉 https://partner.getyourguide.com/ 접속
2. **"Become an Affiliate"** 또는 **"Sign up"** 클릭
3. 사이트 URL `https://dallytrip.com` + 사업 정보 입력
4. 1~3일 심사 → 승인 메일
5. 로그인 → **Dashboard → Tracking** → `Partner ID` 복사 (예: `D2N1G7`)

**Cloudflare 환경변수 등록:**
| 이름 | 값 |
|---|---|
| `GETYOURGUIDE_PARTNER_ID` | (받은 Partner ID) |

→ 등록 후 `/api/activities/search` 응답에 `provider: "getyourguide-direct"`로 표시되면 직접 commission 모드 활성화.

### 2) DiscoverCars 직접 affiliate (렌트카 5~8%)

**가입 (즉시 자동 승인):**
1. 👉 https://www.discovercars.com/affiliate 접속
2. **"Join now"** → 이메일·이름 입력
3. 즉시 승인 + 대시보드 로그인
4. **My Affiliate** 페이지에서 `Affiliate ID` (a_aid 값) 복사

**Cloudflare 환경변수:**
| 이름 | 값 |
|---|---|
| `DISCOVERCARS_AFFILIATE_ID` | (받은 a_aid) |

→ 등록 후 `/api/cars/search` 응답에 `provider: "discovercars-direct"`로 표시.

### 3) Booking.com Affiliate (호텔 4~6%) ⭐ 가장 높은 호텔 commission

**가입 (5분, 자동 승인 多):**
1. 👉 https://www.booking.com/affiliate-program/v2/index.html 접속
2. **"Sign up now"** 클릭 → 가입
3. 사이트 정보 입력 → 대부분 즉시 승인
4. 대시보드 → **"API & feed"** 또는 **"Settings"** → `aid`(Affiliate ID) 복사

**Cloudflare 환경변수:**
| 이름 | 값 |
|---|---|
| `BOOKING_AID` | (받은 aid 숫자) |

→ 등록 후 신규 endpoint `https://dallytrip.com/api/booking/search?city=Da+Nang` 호출 시 `provider: "booking-direct"` + Booking 직접 deeplink 반환.

### 4) Skyscanner Travel API (선택 — 항공 fresh data)

**가입 (1~2주 심사):**
1. 👉 https://www.partners.skyscanner.net/products 접속
2. **"Apply for partner"** 양식 작성
3. 1~2주 후 승인 메일 + API key

**Cloudflare 환경변수:**
| 이름 | 값 |
|---|---|
| `SKYSCANNER_API_KEY` | (받은 API key) |

---

## 🎯 단계적 가입 추천 순서

| 우선순위 | 서비스 | 가입 시간 | 추가 commission 효과 |
|---|---|---|---|
| **1차 (지금)** | ✅ Travelpayouts | 5분 (완료) | 모든 카테고리 1.6~8% |
| **2차** | DiscoverCars | 5분 (즉시 자동 승인) | 렌트카 5~8% (Travelpayouts 보다 직접) |
| **3차** | Booking.com Affiliate | 5분 (대부분 즉시 승인) | 호텔 4~6% (가장 큰 인벤토리) |
| **4차** | GetYourGuide Partner | 3분 가입 + 1~3일 심사 | 액티비티 8% (직접) |
| **5차** | Skyscanner Travel | 신청 + 1~2주 심사 | 항공 fresh data + commission 차익 |

각 단계 가입할 때마다 환경변수 1개 추가 → Cloudflare가 자동 재배포 → 코드 수정 없이 즉시 활성화.

