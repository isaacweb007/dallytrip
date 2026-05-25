# DallyTrip — Travel with $1

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Languages: 4](https://img.shields.io/badge/i18n-KO%20%C2%B7%20EN%20%C2%B7%20JA%20%C2%B7%20ZH-blue.svg)]()

> **DallyTrip** is a TON Chain–based Web3 travel booking web app where every hotel, tour and activity is paid **only with the $1 Token**. Liquid Glass UI. Built as a no-build static MVP.

---

## ✨ Features

- **$1 Token only** — no cards, no banks, no other crypto. One token, one tap.
- **TonConnect-ready** — TON wallet UX wired in (demo mode by default).
- **Three apps in one repo:**
  - **Landing page** (`index.html`) — brand intro + CTA.
  - **User web app** (`app.html`) — Home / Search / Product / Checkout / Booking success / Bookings / Wallet / Profile.
  - **Admin panel** (`admin.html`) — Dashboard, Products, Bookings, Payments, Users, Banners, Settings.
- **Liquid Glass design system** — translucent glass cards, capsule buttons, mint·blue gradients, iridescent glows.
- **Full i18n** — 4 languages (한국어, English, 日本語, 中文) with one-click language switcher in every header.
- **Fully responsive** — desktop · tablet · mobile (with sticky bottom nav).
- **Zero build step** — pure HTML/CSS/JS, served by any static server.

## 🏗 Stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework, no build)
- **Fonts:** Pretendard (KR) + Inter/SF Pro/Manrope (EN/JA/ZH)
- **State:** `localStorage` (mock wallet, bookings, admin entities)
- **Future:** TonConnect SDK, Supabase or Postgres, Telegram Mini App wrapper

## 🚀 Run locally

```bash
# clone and serve
git clone https://github.com/isaacweb007/dallytrip.git
cd dallytrip
python3 -m http.server 8000
# → open http://localhost:8000/
```

Or just open `index.html` directly in your browser (some browsers may block CSS/JS from `file://` — a static server is recommended).

## 🗂 Project structure

```
dallytrip/
├── index.html            # Landing page
├── app.html              # User web app (hash-routed SPA)
├── admin.html            # Admin panel (hash-routed SPA)
├── assets/
│   ├── styles.css        # Liquid Glass design system
│   └── i18n.js           # 4-language dictionary + switcher
└── README.md
```

## 🌐 i18n

Open any page and use the 🌐 button in the header (or in the admin sidebar) to switch between **한국어 / English / 日本語 / 中文**. The choice is remembered via `localStorage`.

| Key | KO | EN | JA | ZH |
|-----|----|----|----|----|
| `hero.titleA` | $1으로 | Travel | $1で | 用 $1 |
| `btn.payWithDollar` | $1로 결제 | Pay with $1 | $1で支払う | 用 $1 支付 |
| `status.Confirmed` | 예약확정 | Confirmed | 確定 | 已确认 |

To add a new language, extend each entry in `assets/i18n.js` and add the code to `SUPPORTED`.

## 🎨 Design tokens

```css
--token-green:     #26D07C;   /* $1 token color */
--ocean-blue:      #22B8FF;
--travel-orange:   #FF8A3D;
--premium-purple:  #7C5CFF;
--glass-white:     rgba(255, 255, 255, 0.42);
--grad-main-cta:   linear-gradient(135deg, #22B8FF 0%, #26D07C 100%);
```

## 📜 Booking statuses

`Payment Completed → Pending Confirmation → Confirmed → Completed`, plus `Cancel Requested` / `Cancelled` / `Refunded`. Admins change status via a dropdown in `/admin/bookings`.

## 🛣 Roadmap

- [ ] TonConnect SDK integration (production)
- [ ] Supabase backend (auth, products, bookings)
- [ ] Promotion codes, reviews, map view
- [ ] Telegram Mini App wrapper
- [ ] Travala / hotel-supplier API in v2

## 📄 License

MIT © DallyTrip
