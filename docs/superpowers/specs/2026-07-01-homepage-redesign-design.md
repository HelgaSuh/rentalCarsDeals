# Homepage Redesign — Pixel-Perfect Target Implementation

**Date:** 2026-07-01  
**Stack:** Next.js 16 + React 19 + Tailwind CSS 4  
**Approach:** A — Minimal file changes

## Goal

Bring the current homepage (`Screenshot (1).png`) to match the target design (`Screenshot 2026-06-30 at 20.24.27.png`) pixel-perfectly. Keep all existing form logic, validation, and API integration intact.

---

## Section 1 — Navbar

**New file:** `app/components/Navbar.tsx`

- Fixed-top white header, height ~48px, `z-50`, subtle bottom shadow (`shadow-sm`)
- Left side only: "Rental" in blue (`#1a56db`) + "Cars Deals" in amber/orange, small car icon SVG inline
- Added to `app/layout.tsx` above `{children}` — applies sitewide
- `<body>` in `layout.tsx` gets `pt-12` to prevent content from hiding under the fixed navbar

---

## Section 2 — Hero Section

**Modified file:** `app/page.tsx`

- Use `public/7414.jpeg` as hero background (`backgroundImage: "url('/7414.jpeg')"`) with `bg-black/40` dark overlay
- Heading: "Compare & Save on **Car Rental**" — "Car Rental" in bold white (drop amber color, keep weight contrast via `font-extrabold`)
- `<SearchForm />` stays centered at `max-w-5xl`

---

## Section 3 — Search Form Changes

**Modified file:** `app/components/SearchForm.tsx`

1. **Search button:** Keep blue (`--primary` / `#2563eb`, hover `--primary-hover` / `#1d4ed8`) — no color change
2. **Trust badges row:** Inserted below the white form card, above the price-alert checkbox:
   - "✓ Free cancellation on most bookings"
   - "✓ 60,000+ locations"
   - "✓ Customer support in 30+ languages"
   - Layout: `flex flex-wrap gap-x-6 gap-y-1 justify-center text-xs text-white/90 mt-2`

---

## Section 4 — Promo Banner

**Modified file:** `app/page.tsx`

- Full-width `<section>` immediately below the hero
- Background: dark navy `bg-[#1e2a4a]`
- Content: single centered line — `"FIND THE BEST CAR RENTAL DEALS AND BOOK NOW!"`
- Style: `text-white font-bold uppercase tracking-widest text-sm py-3 text-center`

---

## Section 5 — Partner Logos Strip

**New file:** `app/components/PartnerStrip.tsx`

**Assets:** Download 7 logos to `public/logos/`:

| Brand    | Source URL |
|----------|-----------|
| Kayak    | https://t-cf.bstatic.com/design-assets/assets/v3.155.0/images-brand/KayakLogo.svg |
| Budget   | https://cdn2.rcstatic.com/images/supplier_logos/budget_logo_lrg.gif |
| Enterprise | https://www.enterprise.com/content/dam/ecom/logo-enterprise.png |
| Alamo    | https://www.alamo.com/content/dam/alamo/functional/alamo-brand-logos/alamo_site_logo.png |
| Expedia  | https://www.expedia.com/_dms/header/logo.svg?locale=en_US&siteid=1&2 |
| Orbitz   | https://1000logos.net/wp-content/uploads/2021/05/Orbitz-logo-500x281.png |
| Hertz    | https://1000logos.net/wp-content/uploads/2023/03/Hertz-logo-500x281.png |

**Implementation:**
- White background strip, `py-4`, `overflow-hidden`
- Inner div: `flex` with two identical sets of logos (duplicate for seamless loop)
- `@keyframes scroll-left` in `globals.css`: translates `-50%` over ~20s linear infinite
- Each `<img>`: `h-8 object-contain mx-6 grayscale-0`
- Wrapper: `animate-[scroll-left_20s_linear_infinite]`

---

## Files Changed / Created

| File | Action |
|------|--------|
| `app/layout.tsx` | Add `<Navbar />`, add `pt-12` to `<body>` |
| `app/page.tsx` | Add promo banner, add `<PartnerStrip />`, hero heading tweak |
| `app/components/Navbar.tsx` | **New** |
| `app/components/PartnerStrip.tsx` | **New** |
| `app/components/SearchForm.tsx` | Add trust badges row |
| `app/globals.css` | Add `@keyframes scroll-left` |
| `public/logos/*.{svg,gif,png}` | **New** — 7 downloaded logo files |

---

## Out of Scope

- No routing changes
- No new pages
- No changes to form validation logic or API integration
- No changes to `LocationInput`, `DatePickerInput`, `TimeSelect`, `PriceAlertCheckbox`
