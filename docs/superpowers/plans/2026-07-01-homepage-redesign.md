# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the car rental homepage to match the target design — fixed navbar, new hero background (`7414.jpeg`), trust badges in the search form, dark navy promo banner, and a scrolling partner logo strip.

**Architecture:** Approach A — minimal file changes. Two new components (`Navbar`, `PartnerStrip`) added alongside existing ones. `SearchForm.tsx`, `layout.tsx`, `page.tsx`, and `globals.css` each get targeted edits. Logo images downloaded to `public/logos/`. The scroll animation is a plain CSS `@keyframes` rule referenced via Tailwind's arbitrary `animate-[...]` class.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, Vitest + @testing-library/react (jsdom)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `public/logos/kayak.svg` | Create | Kayak partner logo asset |
| `public/logos/budget.gif` | Create | Budget partner logo asset |
| `public/logos/enterprise.png` | Create | Enterprise partner logo asset |
| `public/logos/alamo.png` | Create | Alamo partner logo asset |
| `public/logos/expedia.svg` | Create | Expedia partner logo asset |
| `public/logos/orbitz.png` | Create | Orbitz partner logo asset |
| `public/logos/hertz.png` | Create | Hertz partner logo asset |
| `app/globals.css` | Modify | Add `@keyframes scroll-left` for marquee animation |
| `app/components/Navbar.tsx` | Create | Fixed top nav with "Rental Cars Deals" branding |
| `app/components/Navbar.test.tsx` | Create | Unit tests for Navbar |
| `app/layout.tsx` | Modify | Mount `<Navbar />`, add `pt-12` to body |
| `app/components/PartnerStrip.tsx` | Create | Auto-scrolling logo marquee |
| `app/components/PartnerStrip.test.tsx` | Create | Unit tests for PartnerStrip |
| `app/components/SearchForm.tsx` | Modify | Add trust badges row below form card |
| `app/components/SearchForm.test.tsx` | Create | Tests for trust badge rendering |
| `app/page.tsx` | Modify | New background, heading tweak, promo banner, `<PartnerStrip />` |

---

### Task 1: Download logo assets

**Files:**
- Create: `public/logos/kayak.svg`
- Create: `public/logos/budget.gif`
- Create: `public/logos/enterprise.png`
- Create: `public/logos/alamo.png`
- Create: `public/logos/expedia.svg`
- Create: `public/logos/orbitz.png`
- Create: `public/logos/hertz.png`

- [ ] **Step 1: Create directory and download all 7 logos**

```bash
mkdir -p public/logos
curl -L "https://t-cf.bstatic.com/design-assets/assets/v3.155.0/images-brand/KayakLogo.svg" -o public/logos/kayak.svg
curl -L "https://cdn2.rcstatic.com/images/supplier_logos/budget_logo_lrg.gif" -o public/logos/budget.gif
curl -L "https://www.enterprise.com/content/dam/ecom/logo-enterprise.png" -o public/logos/enterprise.png
curl -L "https://www.alamo.com/content/dam/alamo/functional/alamo-brand-logos/alamo_site_logo.png" -o public/logos/alamo.png
curl -L "https://www.expedia.com/_dms/header/logo.svg?locale=en_US&siteid=1&2" -o public/logos/expedia.svg
curl -L "https://1000logos.net/wp-content/uploads/2021/05/Orbitz-logo-500x281.png" -o public/logos/orbitz.png
curl -L "https://1000logos.net/wp-content/uploads/2023/03/Hertz-logo-500x281.png" -o public/logos/hertz.png
```

- [ ] **Step 2: Verify all files downloaded successfully**

```bash
ls -lh public/logos/
```
Expected: 7 files listed, each > 0 bytes.

---

### Task 2: Add scroll animation to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Append `@keyframes scroll-left` to `app/globals.css`**

Add at the end of the file:

```css
@keyframes scroll-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

- [ ] **Step 2: Confirm build still succeeds**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled` with no CSS errors.

---

### Task 3: Create Navbar component

**Files:**
- Create: `app/components/Navbar.tsx`
- Create: `app/components/Navbar.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `app/components/Navbar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Navbar } from './Navbar'

describe('Navbar', () => {
  it('renders "Rental" brand text', () => {
    render(<Navbar />)
    expect(screen.getByText('Rental')).toBeInTheDocument()
  })

  it('renders "Cars Deals" brand text', () => {
    render(<Navbar />)
    expect(screen.getByText('Cars Deals')).toBeInTheDocument()
  })

  it('renders as a nav landmark', () => {
    render(<Navbar />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm 3 failures**

```bash
npm test -- --reporter=verbose Navbar
```
Expected: 3 tests fail with `Cannot find module './Navbar'`.

- [ ] **Step 3: Create `app/components/Navbar.tsx`**

```tsx
import { Car } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center bg-white px-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <Car className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <span className="text-base font-bold text-[#1a56db]">Rental</span>
        <span className="text-base font-bold text-amber-500">Cars Deals</span>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run tests — confirm 3 pass**

```bash
npm test -- --reporter=verbose Navbar
```
Expected: 3 tests pass.

---

### Task 4: Mount Navbar in layout.tsx

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add Navbar import and update the body element**

Open `app/layout.tsx`. Make two changes:

Add import after the existing imports (before `"./globals.css"`):
```tsx
import { Navbar } from './components/Navbar'
```

Replace the `<body>` element:
```tsx
<body className="min-h-full flex flex-col pt-12">
  <Navbar />
  {children}
</body>
```

- [ ] **Step 2: Run full test suite — confirm no regressions**

```bash
npm test
```
Expected: all tests pass.

---

### Task 5: Create PartnerStrip component

**Files:**
- Create: `app/components/PartnerStrip.tsx`
- Create: `app/components/PartnerStrip.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `app/components/PartnerStrip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { PartnerStrip } from './PartnerStrip'

describe('PartnerStrip', () => {
  it('renders Kayak logo', () => {
    render(<PartnerStrip />)
    expect(screen.getAllByAltText('Kayak').length).toBeGreaterThan(0)
  })

  it('renders Budget logo', () => {
    render(<PartnerStrip />)
    expect(screen.getAllByAltText('Budget').length).toBeGreaterThan(0)
  })

  it('renders Hertz logo', () => {
    render(<PartnerStrip />)
    expect(screen.getAllByAltText('Hertz').length).toBeGreaterThan(0)
  })

  it('renders Enterprise logo', () => {
    render(<PartnerStrip />)
    expect(screen.getAllByAltText('Enterprise').length).toBeGreaterThan(0)
  })

  it('renders Expedia logo', () => {
    render(<PartnerStrip />)
    expect(screen.getAllByAltText('Expedia').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests — confirm 5 failures**

```bash
npm test -- --reporter=verbose PartnerStrip
```
Expected: 5 tests fail with `Cannot find module './PartnerStrip'`.

- [ ] **Step 3: Create `app/components/PartnerStrip.tsx`**

```tsx
const LOGOS = [
  { name: 'Kayak',      src: '/logos/kayak.svg' },
  { name: 'Budget',     src: '/logos/budget.gif' },
  { name: 'Enterprise', src: '/logos/enterprise.png' },
  { name: 'Alamo',      src: '/logos/alamo.png' },
  { name: 'Expedia',    src: '/logos/expedia.svg' },
  { name: 'Orbitz',     src: '/logos/orbitz.png' },
  { name: 'Hertz',      src: '/logos/hertz.png' },
]

export function PartnerStrip() {
  return (
    <section className="overflow-hidden bg-white py-4" aria-label="Our partners">
      <div className="flex w-max animate-[scroll-left_20s_linear_infinite]">
        {[...LOGOS, ...LOGOS].map((logo, i) => (
          <img
            key={i}
            src={logo.src}
            alt={logo.name}
            className="mx-8 h-8 object-contain"
          />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests — confirm 5 pass**

```bash
npm test -- --reporter=verbose PartnerStrip
```
Expected: 5 tests pass.

---

### Task 6: Add trust badges to SearchForm

**Files:**
- Modify: `app/components/SearchForm.tsx`
- Create: `app/components/SearchForm.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `app/components/SearchForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { SearchForm } from './SearchForm'

describe('SearchForm trust badges', () => {
  it('shows free cancellation badge', () => {
    render(<SearchForm />)
    expect(screen.getByText(/free cancellation on most bookings/i)).toBeInTheDocument()
  })

  it('shows locations badge', () => {
    render(<SearchForm />)
    expect(screen.getByText(/60,000\+ locations/i)).toBeInTheDocument()
  })

  it('shows customer support badge', () => {
    render(<SearchForm />)
    expect(screen.getByText(/customer support in 30\+ languages/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm 3 failures**

```bash
npm test -- --reporter=verbose SearchForm
```
Expected: 3 tests fail with text not found in document.

- [ ] **Step 3: Add trust badges to `app/components/SearchForm.tsx`**

Find this block near the bottom of the `<form>`:

```tsx
      {/* Price alert below the card */}
      <div className="mt-3 flex justify-end">
        <PriceAlertCheckbox control={control} />
      </div>
```

Replace it with:

```tsx
      {/* Trust badges */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {[
          '✓ Free cancellation on most bookings',
          '✓ 60,000+ locations',
          '✓ Customer support in 30+ languages',
        ].map((badge) => (
          <span key={badge} className="text-xs text-white/90">{badge}</span>
        ))}
      </div>

      {/* Price alert below the card */}
      <div className="mt-3 flex justify-end">
        <PriceAlertCheckbox control={control} />
      </div>
```

- [ ] **Step 4: Run tests — confirm 3 pass**

```bash
npm test -- --reporter=verbose SearchForm
```
Expected: 3 tests pass.

---

### Task 7: Update page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the contents of `app/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { SearchForm } from './components/SearchForm'
import { PartnerStrip } from './components/PartnerStrip'

export const metadata: Metadata = {
  title: 'Car Rental — Compare & Save',
  description: 'Search and compare car rental deals worldwide.',
}

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero section */}
      <section
        className="relative flex min-h-[480px] flex-col items-center justify-center bg-cover bg-center px-4 py-16"
        style={{ backgroundImage: "url('/car.png')" }}
      >
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-5xl">
          <h1 className="mb-8 text-center text-3xl font-bold leading-tight text-white drop-shadow-md md:text-5xl">
            Compare &amp; Save on<br />
            <span className="font-extrabold">Car Rental</span>
          </h1>
          <SearchForm />
        </div>
      </section>

      {/* Promo banner */}
      <section className="bg-[#1e2a4a] py-3 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-white">
          Find the best car rental deals and book now!
        </p>
      </section>

      {/* Partner logos */}
      <PartnerStrip />
    </main>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 3: Start dev server and visually verify**

```bash
npm run dev
```

Open http://localhost:3000 and confirm:
- Fixed white navbar at top with car icon + "Rental Cars Deals" branding
- Hero uses the mountain/sunset SUV photo (`7414.jpeg`)
- Heading: "Compare & Save on **Car Rental**" in white
- Search form card: amber border, blue Search button, trust badges below the card, price alert checkbox
- Dark navy promo banner: "FIND THE BEST CAR RENTAL DEALS AND BOOK NOW!"
- Scrolling partner logos strip (Kayak, Budget, Enterprise, Alamo, Expedia, Orbitz, Hertz)
