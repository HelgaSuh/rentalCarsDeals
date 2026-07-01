# Car Rental Search Form — Design Spec
**Date:** 2026-06-30  
**Assignment:** Frontend Developer Test Assignment  
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4

---

## 1. Goal

Build a responsive, production-quality car rental search form that:
- Lets users select pick-up/return locations via Kayak autocomplete
- Collects dates, times, and optional price alert preference
- Validates all inputs client-side with clear error feedback
- Submits as `FormData` to the redirect endpoint

---

## 2. Architecture

### Approach
Feature-oriented components: each UI concern is its own file; `SearchForm` wires them together via react-hook-form. No monolithic file, no over-abstracted hooks layer.

### File Structure

```
app/
  page.tsx                        ← Server Component; hero layout
  globals.css                     ← CSS custom properties, base styles
  components/
    SearchForm.tsx                 ← "use client"; react-hook-form root
    LocationInput.tsx              ← autocomplete input + dropdown
    DatePickerInput.tsx            ← react-day-picker calendar popup
    TimeSelect.tsx                 ← styled <select> for time slots
    PriceAlertCheckbox.tsx         ← checkbox with label
    FieldError.tsx                 ← red tooltip error display
  api/
    autocomplete/
      route.ts                     ← server-side proxy (ready; activated if CORS blocks direct fetch)
  lib/
    autocomplete.ts                ← fetch + debounce + in-memory cache
    buildRedirectParams.ts         ← maps form values → RedirectParams + FormData
    types.ts                       ← shared TypeScript interfaces
```

### Data Flow

1. `page.tsx` renders hero + `<SearchForm />` (client boundary here)
2. `SearchForm` holds the react-hook-form context; all fields register via `Controller`
3. `LocationInput` manages its own autocomplete state; reports the selected `LocationResult` object to the form
4. `DatePickerInput` and `TimeSelect` are also `Controller`-wrapped
5. On submit: `buildRedirectParams(values)` produces `FormData`; `fetch` POSTs to the redirect endpoint

---

## 3. Page Layout

### Hero Section (`page.tsx`)
- Full-viewport-width section with a background road/car photograph
- Semi-transparent dark overlay (`bg-black/40`) for text legibility
- White headline: **"Compare & Save on Car Rental"**
- `SearchForm` card sits inside the hero, centered, `max-w-5xl`
- Below the hero: a static strip of partner/vendor logos (Budget, Hertz, Avis, Expedia, Orbitz, etc.)

### Search Card
- White background, `rounded-2xl`, `shadow-lg`
- `border-2 border-amber-400` (yellow/gold border matching reference)
- Padding: `p-4` mobile, `p-6` desktop
- Contains: "Same drop-off" toggle row → field grid → Price Alert checkbox → Search button

---

## 4. Component Design

### 4.1 `LocationInput`

**Props:** `name`, `label`, `placeholder`, `control`

**Internal state:**
```ts
inputText: string           // raw typed value shown in the text input
results: LocationResult[]   // autocomplete suggestions from API
status: 'idle' | 'loading' | 'error' | 'open'
```

**Behaviour:**
- < 3 chars → status `idle`, dropdown hidden, no fetch
- ≥ 3 chars → 500ms debounce → status `loading` (spinner in trailing slot) → fetch
- Fetch calls `lib/autocomplete.ts` (direct Kayak URL first; proxy fallback on CORS error)
- Success → status `open`, dropdown renders results
- User selects item → form value set to full `LocationResult` object, `inputText` set to display name, dropdown closes
- User edits after selecting → form value cleared (forces re-selection; satisfies "must select from list" rule)
- Keyboard: `ArrowDown`/`ArrowUp` navigate list, `Enter` selects focused item, `Escape` closes

**Dropdown item:**
- `Plane` icon (lucide-react) for airports; `MapPin` for cities
- Location name in bold + country/region in muted gray

**States rendered:**
- Loading: spinner inside the input's trailing slot
- Empty: "No results found" message in dropdown
- Error: "Could not load suggestions — try again" message in dropdown

### 4.2 `DatePickerInput`

**Props:** `name`, `label`, `control`, `minDate?`

- Styled button displaying the selected date (e.g. "Sun 5 Jul") with a `Calendar` icon
- Click opens a `react-day-picker` `<DayPicker>` in an absolute-positioned popover panel
- Closes on outside click or date selection
- Dates before `minDate` are disabled in the picker

### 4.3 `TimeSelect`

**Props:** `name`, `label`, `control`

- Styled `<select>` with a `Clock` icon in the leading slot
- Options: `00:00` → `23:30` in 30-minute increments (48 options)
- Default value: `"10:00"`

### 4.4 `PriceAlertCheckbox`

- `<input type="checkbox">` + label: "Alert me when price drops"
- Registered into react-hook-form; no validation rule needed

### 4.5 `FieldError`

**Props:** `message: string`

- Absolutely positioned above the field (`bottom-full mb-2`)
- Red background (`#dc2626`), white text, `text-sm`, `rounded-md`, `px-3 py-2`
- Small downward-pointing CSS arrow via `::after` pseudo-element
- The wrapping field container must have `position: relative`

---

## 5. Form Layout — Responsive

### Mobile (320px+) and Tablet (768px+)

```
┌─────────────────────────────────┐
│  ○ Same drop-off  (toggle)      │
├─────────────────────────────────┤
│  🔍  Pick-up location           │
│  🔍  Drop-off location  ← only  │
│       when toggle is off        │
├─────────────────┬───────────────┤
│  📅 Pick-up date│  🕐 Time      │
├─────────────────┼───────────────┤
│  📅 Return date │  🕐 Time      │
├─────────────────────────────────┤
│  ☐  Alert me when price drops   │
├─────────────────────────────────┤
│         [  Search  ]            │  ← blue (#2563eb), full-width
└─────────────────────────────────┘
```

### Desktop (1024px+)

Single horizontal row matching the first reference screenshot:
```
[ Pick-up location ] [ Pick-up Date ] [ Time ] [ Return Date ] [ Time ] [ Search ]
```
"Same drop-off" toggle sits above the bar (checked = same location, default).  
When unchecked, a drop-off location field appears inline in the row.  
Price Alert checkbox sits below the bar on the right.

---

## 6. Validation Rules

| Field | Rule |
|---|---|
| Pick-up location | Required; value must be a `LocationResult` object (not raw text) |
| Drop-off location | Required when "Same drop-off" is **off**; must be a `LocationResult` |
| Pick-up date | Required; must be today or later |
| Return date | Required; must be ≥ pick-up date |
| Pick-up time | Required |
| Return time | Required; combined pick-up datetime + 1 hour ≤ combined return datetime |

**Error display:** red tooltip floating above the offending field (`#dc2626` bg, white text).  
Errors shown only after first submit attempt; cleared as soon as the field satisfies its rule.

---

## 7. Autocomplete — `lib/autocomplete.ts`

```ts
const cache = new Map<string, LocationResult[]>()

export async function fetchLocations(query: string): Promise<LocationResult[]>
```

- Checks `cache.get(query)` first; returns immediately on hit
- Otherwise fetches: `https://www.il.kayak.com/mvm/smartyv2/search?f=j&s=car&where={query}`
- On CORS error: retries via `/api/autocomplete?where={query}` (the proxy route)
- Parses response into `LocationResult[]`, writes to cache, returns

**`LocationResult` (in `lib/types.ts`):**
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

Maps validated form values to the `RedirectParams` shape and returns a `FormData`:

- `pickup-time` / `drop-off-time` → ISO string with local timezone offset
- `pickup-t` / `drop-off-t` → time-only string, e.g. `"10:00"`
- `dta` → `Math.floor((pickupDate - today) / 86_400_000)`
- `rental-duration` → days between pickup and return
- `lng` → `navigator.language ?? 'en'`
- `country-code` / `state-code` → from selected location if available
- Drop-off fields omitted entirely when "Same drop-off" is active
- `vert: "cars"`, `tab: "front"` always present

**Submission in `SearchForm.onSubmit`:**
```ts
const body = buildRedirectParams(values)
await fetch('https://api.int.therentalradar.com/v1/cars/redirect', {
  method: 'POST',
  body,           // FormData — browser sets Content-Type + boundary automatically
  redirect: 'follow',
})
```
Search button shows a spinner while the request is in-flight.  
A brief inline error message appears below the button if the request fails.

---

## 9. Libraries to Add

| Package | Purpose |
|---|---|
| `react-hook-form` | Form state, validation, `Controller` wrapper |
| `react-day-picker` | Calendar popup component |
| `lucide-react` | Icons: `MapPin`, `Plane`, `Calendar`, `Clock`, `Search` |

No other runtime dependencies beyond what is already installed.

---

## 10. Color Reference

```css
--primary:       #2563eb;   /* Search button, focus rings, active toggle */
--primary-hover: #1d4ed8;
--success:       #059669;
--error:         #dc2626;   /* Error tooltip background */
--warning:       #d97706;
--gray-50:       #f9fafb;
--gray-100:      #f3f4f6;
--gray-200:      #e5e7eb;
--gray-500:      #6b7280;
--gray-900:      #111827;
```

---

## 11. Accessibility

- All inputs have an associated `<label>` or `aria-label`
- Autocomplete dropdown uses `role="listbox"` / `role="option"`, `aria-expanded`, `aria-activedescendant`
- Date picker popup: `Escape` closes, focus returns to trigger button
- Error tooltips linked via `aria-describedby`
- Full keyboard navigation: `Tab` through fields, arrow keys in autocomplete
- Color contrast meets WCAG AA

---

## 12. Performance

- Autocomplete: 500ms debounce + in-memory `Map` cache (no duplicate fetches for repeated queries)
- react-hook-form uncontrolled internals avoid re-renders on every keystroke
- `react-day-picker` loaded via dynamic import only when first opened
- Tailwind CSS v4 purges unused styles at build time
