# Car Rental Search Form — Design Spec
**Date:** 2026-06-30  
**Assignment:** Frontend Developer Test Assignment  
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4

---

## 1. Goal

Build a responsive, production-quality car rental search form that:
- Lets users pick up/return locations via Kayak autocomplete
- Collects dates, times, and optional price alert preference
- Validates all inputs client-side with clear error feedback
- Submits as `FormData` to the redirect endpoint

---

## 2. Architecture

### Approach
Feature-oriented components (Approach B): each UI concern is its own file; `SearchForm` wires them together via react-hook-form. No monolithic file, no over-abstracted hooks layer.

### File Structure

```
app/
  page.tsx                        ← Server Component; hero layout
  globals.css                     ← CSS custom properties, base styles
  components/
    SearchForm.tsx                 ← Client Component; react-hook-form root
    LocationInput.tsx              ← autocomplete input + dropdown
    DatePickerInput.tsx            ← react-day-picker calendar popup
    TimeSelect.tsx                 ← styled <select> for time slots
    PriceAlertCheckbox.tsx         ← checkbox with label
    FieldError.tsx                 ← red tooltip error display
  api/
    autocomplete/
      route.ts                     ← server-side proxy (ready; used if CORS blocks direct fetch)
  lib/
    autocomplete.ts                ← fetch + debounce + in-memory cache
    buildRedirectParams.ts         ← maps form values → RedirectParams + FormData
    types.ts                       ← shared TypeScript interfaces
docs/
  superpowers/specs/               ← design specs
```

### Data Flow

1. `page.tsx` renders hero + `<SearchForm />` (client boundary here)
2. `SearchForm` holds the react-hook-form context; all fields register into it
3. `LocationInput` manages its own autocomplete state internally; reports selected location object to form via `Controller`
4. `DatePickerInput` and `TimeSelect` are also `Controller`-wrapped
5. On submit: `buildRedirectParams(values)` produces `FormData`; `fetch` POSTs to the redirect endpoint

---

## 3. Page Layout

### Hero Section (`page.tsx`)
- Full-viewport-width section with a background road/car photograph
- Semi-transparent dark overlay (`bg-black/40`) for text legibility
- White headline: **"Compare & Save on Car Rental"**
- `SearchForm` card sits inside the hero, centered, with `max-w-5xl`
- Below the hero: a static strip of partner/vendor logos

### Search Card
- White background, `rounded-2xl`, `shadow-lg`
- `border-2 border-amber-400` (yellow/gold border matching reference)
- Padding: `p-4` on mobile, `p-6` on desktop
- Contains: "Same drop-off" toggle row, the field grid, Price Alert checkbox, Search button

---

## 4. Component Design

### 4.1 `LocationInput`

**Props:** `name`, `label`, `placeholder`, `control` (react-hook-form)

**Internal state:**
```ts
inputText: string           // raw typed value
results: LocationResult[]   // autocomplete suggestions
status: 'idle' | 'loading' | 'error' | 'open'
```

**Behaviour:**
- < 3 chars typed → status `idle`, no fetch, dropdown hidden
- ≥ 3 chars → 500ms debounce → status `loading` (spinner in trailing slot) → fetch
- Fetch hits `lib/autocomplete.ts` (direct Kayak URL; falls back to `/api/autocomplete` if CORS blocked)
- Success → status `open`, dropdown renders results
- User selects → sets form value to full `LocationResult` object, sets `inputText` to display name, closes dropdown
- User edits after selecting → clears form value (forces re-selection; satisfies "must select from list" rule)
- Keyboard: `ArrowDown`/`ArrowUp` navigate, `Enter` selects focused item, `Escape` closes

**Dropdown item:**
- Airplane icon (`lucide-react` `Plane`) for airports; `MapPin` for cities
- Location name (bold) + country/region (muted gray)

**States rendered:**
- Loading: spinner inside input
- Empty: "No results found" in dropdown
- Error: "Could not load suggestions — try again" in dropdown

### 4.2 `DatePickerInput`

**Props:** `name`, `label`, `control`, `minDate?`, `maxDate?`

- Renders a styled button showing the selected date ("Sun 5 Jul") with a calendar icon
- Clicking opens a `react-day-picker` `<DayPicker>` in a `popover` (absolute-positioned panel)
- Closes on outside click or date selection
- Passes `disabled` dates to DayPicker (dates before `minDate`)

### 4.3 `TimeSelect`

**Props:** `name`, `label`, `control`

- Styled `<select>` with a clock icon in the leading slot
- Options: 00:00 → 23:30 in 30-minute increments (48 options)
- Default value: `"10:00"`

### 4.4 `PriceAlertCheckbox`

- Simple `<input type="checkbox">` + label: "Alert me when price drops"
- Registered into react-hook-form (value only; no validation needed)

### 4.5 `FieldError`

**Props:** `message: string`

- Absolutely positioned above the field (`bottom-full mb-1`)
- Red background (`#dc2626`), white text, `text-sm`, `rounded-md`, `px-3 py-2`
- Small downward-pointing CSS arrow (`::after` pseudo-element)
- Wrapping field container uses `relative` positioning

---

## 5. Form Layout — Responsive

### Mobile (320px+) and Tablet (768px+)
Based on reference mobile screenshot:
```
┌─────────────────────────────┐
│ ○ Same drop-off             │
├─────────────────────────────┤
│ 🔍 Pick-up location         │
├──────────────┬──────────────┤
│ 📅 Pick-up   │ 🕐 Time      │
├──────────────┼──────────────┤
│ 📅 Drop-off  │ 🕐 Time      │
├─────────────────────────────┤
│       [Search]              │  ← blue, full-width
└─────────────────────────────┘
```
When "Different drop-off" is enabled, a second `LocationInput` appears between the location row and the date rows.

### Desktop (1024px+)
Single horizontal row matching the first reference screenshot:
```
[ Pick-up location ] [ Pick-up Date ] [ Time ] [ Return Date ] [ Time ] [Search]
```
"Same drop-off" toggle sits above the bar (checked = same location, default). When unchecked, a drop-off location field appears inline in the row.

---

## 6. Validation Rules

| Field | Rule |
|---|---|
| Pick-up location | Required; value must be a `LocationResult` object (not raw text) |
| Drop-off location | Required when "Different drop-off" enabled; must be a `LocationResult` |
| Pick-up date | Required; must be today or later |
| Return date | Required; must be ≥ pick-up date |
| Pick-up time | Required |
| Return time | Required; combined pick-up datetime + 1 hour ≤ combined return datetime |

**Error display:** tooltip above the offending field, red bg, white text. Shown after first submit attempt; cleared as soon as the field value satisfies its rule.

---

## 7. Autocomplete — `lib/autocomplete.ts`

```ts
const cache = new Map<string, LocationResult[]>()

export async function fetchLocations(query: string): Promise<LocationResult[]>
```

- Checks `cache.get(query)` first; returns immediately if hit
- Otherwise fetches: `https://www.il.kayak.com/mvm/smartyv2/search?f=j&s=car&where={query}`
- On CORS error: retries via `/api/autocomplete?where={query}` (the proxy route)
- Parses response into `LocationResult[]`, writes to cache, returns

**`LocationResult` type (`lib/types.ts`):**
```ts
interface LocationResult {
  displayName: string
  id: string
  type: 'airport' | 'city'
  countryCode?: string
  stateCode?: string
}
```

---

## 8. Redirect Submission — `lib/buildRedirectParams.ts`

Maps validated form values to `RedirectParams` and returns a `FormData`:

- `pickup-time` / `drop-off-time`: ISO string with local timezone offset
- `dta`: `Math.floor((pickupDate - today) / 86_400_000)`
- `rental-duration`: days between pickup and return dates
- `lng`: `navigator.language ?? 'en'`
- Drop-off fields omitted entirely when "Same drop-off" is active
- `vert: "cars"`, `tab: "front"` always included

Submission in `SearchForm.onSubmit`:
```ts
const body = buildRedirectParams(values)
await fetch('https://api.int.therentalradar.com/v1/cars/redirect', {
  method: 'POST',
  body,           // FormData — browser sets Content-Type + boundary
  redirect: 'follow',
})
```
Search button shows a spinner while in flight. A brief error message appears below the button if the request fails.

---

## 9. Libraries to Add

| Package | Purpose |
|---|---|
| `react-hook-form` | Form state, validation, Controller |
| `react-day-picker` | Calendar popup |
| `lucide-react` | Icons (MapPin, Plane, Calendar, Clock, Search) |

No other runtime dependencies beyond what is already installed.

---

## 10. Color Reference

```css
--primary:       #2563eb;   /* Search button, focus rings, toggles */
--primary-hover: #1d4ed8;
--success:       #059669;
--error:         #dc2626;   /* Error tooltips */
--warning:       #d97706;
--gray-50:       #f9fafb;
--gray-100:      #f3f4f6;
--gray-200:      #e5e7eb;
--gray-500:      #6b7280;
--gray-900:      #111827;
```

---

## 11. Accessibility

- All inputs have associated `<label>` elements (or `aria-label`)
- Autocomplete dropdown uses `role="listbox"` / `role="option"`, `aria-expanded`, `aria-activedescendant`
- Date picker popup traps focus; `Escape` closes it
- Error tooltips linked via `aria-describedby`
- Full keyboard navigation: Tab through fields, arrow keys in autocomplete and date picker
- Color contrast meets WCAG AA for all text/background combos

---

## 12. Performance

- Autocomplete: 500ms debounce + in-memory cache (no duplicate fetches for repeated queries)
- react-hook-form: uncontrolled internals avoid unnecessary re-renders on every keystroke
- `react-day-picker` loaded only when the date input is first focused (dynamic import)
- No external font loads; Tailwind purges unused CSS at build time
