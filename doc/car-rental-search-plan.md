# Car Rental Search Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive car rental search form with Kayak autocomplete, client-side validation, and FormData submission to the redirect endpoint.

**Architecture:** Feature-oriented components — `LocationInput`, `DatePickerInput`, `TimeSelect` are independent UI units; `SearchForm` wires them together via react-hook-form. Pure logic lives in `lib/` and is unit-tested separately from the UI.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, react-hook-form, react-day-picker, lucide-react, Vitest + React Testing Library.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/types.ts` | Create | Shared TypeScript interfaces |
| `lib/autocomplete.ts` | Create | Fetch + 500ms debounce + in-memory cache |
| `lib/buildRedirectParams.ts` | Create | Form values → `FormData` matching `RedirectParams` |
| `lib/__tests__/autocomplete.test.ts` | Create | Unit tests for autocomplete |
| `lib/__tests__/buildRedirectParams.test.ts` | Create | Unit tests for redirect params builder |
| `app/globals.css` | Modify | Add CSS custom properties (colors) |
| `app/components/FieldError.tsx` | Create | Floating red error tooltip |
| `app/components/TimeSelect.tsx` | Create | Styled time `<select>` with clock icon |
| `app/components/PriceAlertCheckbox.tsx` | Create | Price alert checkbox |
| `app/components/DatePickerInput.tsx` | Create | react-day-picker calendar popup |
| `app/components/LocationInput.tsx` | Create | Autocomplete combobox input |
| `app/components/SearchForm.tsx` | Create | Form root — validation, layout, submission |
| `app/api/autocomplete/route.ts` | Create | CORS proxy for Kayak API |
| `app/page.tsx` | Modify | Hero section with background image |
| `vitest.config.mts` | Create | Vitest configuration |
| `public/hero-bg.jpg` | Create | Hero background photo (see Task 14) |

---

## Task 1: Install dependencies + read Next.js 16 docs

**Files:**
- Modify: `package.json` (via npm)
- Create: `vitest.config.mts`

- [ ] **Step 1: Read the Next.js 16 App Router overview**

```bash
cat node_modules/next/dist/docs/01-app/index.md | head -60
```

Pay attention to any changed conventions vs Next.js 13–15.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install react-hook-form react-day-picker lucide-react
```

Expected: 3 packages added, no peer dependency warnings.

- [ ] **Step 3: Install dev dependencies for Vitest**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @testing-library/user-event
```

- [ ] **Step 4: Create `vitest.config.mts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 5: Add test script to `package.json`**

Open `package.json` and add `"test": "vitest run"` and `"test:watch": "vitest"` to the `scripts` section. The scripts section should look like:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 6: Verify Vitest runs (empty run)**

```bash
npm test
```

Expected: `No test files found` or `0 tests passed` — not an error.

- [ ] **Step 7: Check installed react-day-picker version and skim its docs**

```bash
cat node_modules/react-day-picker/package.json | python3 -c "import sys,json; p=json.load(sys.stdin); print(p['version'])"
```

If version is 8.x: CSS import is `import 'react-day-picker/dist/style.css'`  
If version is 9.x+: CSS import is `import 'react-day-picker/style.css'`  
Note the version — you will use the correct import in Task 9.

---

## Task 2: Define shared TypeScript types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```ts
export interface LocationResult {
  displayName: string
  id: string
  type: 'airport' | 'city'
  countryCode?: string
  stateCode?: string
}

export interface SearchFormValues {
  pickupLocation: LocationResult | null
  dropoffLocation: LocationResult | null
  sameDropoff: boolean
  pickupDate: Date | null
  returnDate: Date | null
  pickupTime: string
  returnTime: string
  priceAlert: boolean
}

export interface RedirectParams {
  vert: 'cars'
  tab: 'front'
  lng: string
  'rental-duration': number
  'pickup-time': string
  'pickup-t': string
  'drop-off-time': string
  'drop-off-t': string
  dta: number
  'pickup-destination': string
  'pickup-destination-id': string
  'pickup-destination-key': 'airport' | 'city'
  'drop-off-destination'?: string
  'drop-off-destination-id'?: string
  'drop-off-destination-key'?: 'airport' | 'city'
  'country-code'?: string
  'state-code'?: string
}
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: no output (no errors).

---

## Task 3: Implement `lib/autocomplete.ts` + unit tests

**Files:**
- Create: `lib/autocomplete.ts`
- Create: `lib/__tests__/autocomplete.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `lib/__tests__/autocomplete.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchLocations, clearAutocompleteCache } from '../autocomplete'

const MOCK_RAW = [
  { displayname: 'Miami, Florida', apicode: 'MIA', type: 'city', countrycode: 'US', statecode: 'FL' },
  { displayname: 'Miami Intl Airport', apicode: 'MIA', type: 'airport', countrycode: 'US', statecode: 'FL' },
]

beforeEach(() => {
  clearAutocompleteCache()
  vi.restoreAllMocks()
})

describe('fetchLocations', () => {
  it('parses and returns results from direct fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_RAW,
    }))

    const results = await fetchLocations('miami')

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({
      displayName: 'Miami, Florida',
      id: 'MIA',
      type: 'city',
      countryCode: 'US',
      stateCode: 'FL',
    })
  })

  it('caches results and avoids duplicate fetches', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => MOCK_RAW })
    vi.stubGlobal('fetch', mockFetch)

    await fetchLocations('miami')
    await fetchLocations('miami')

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('falls back to proxy when direct fetch throws (CORS)', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_RAW })
    vi.stubGlobal('fetch', mockFetch)

    const results = await fetchLocations('miami')

    expect(results).toHaveLength(2)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect((mockFetch.mock.calls[1] as [string])[0]).toContain('/api/autocomplete')
  })

  it('returns empty array when response is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'bad' }),
    }))

    const results = await fetchLocations('xyz')
    expect(results).toEqual([])
  })
})
```

- [ ] **Step 2: Run the tests — verify they all FAIL**

```bash
npm test
```

Expected: 4 failing tests with `Cannot find module '../autocomplete'`.

- [ ] **Step 3: Create `lib/autocomplete.ts`**

```ts
import type { LocationResult } from './types'

const DIRECT_URL = 'https://www.il.kayak.com/mvm/smartyv2/search'
const PROXY_URL = '/api/autocomplete'

const cache = new Map<string, LocationResult[]>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseResponse(data: unknown): LocationResult[] {
  if (!Array.isArray(data)) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).flatMap((item) => {
    const displayName: string = item.displayname ?? item.name ?? ''
    const id: string = item.apicode ?? item.code ?? ''
    if (!displayName || !id) return []
    return [
      {
        displayName,
        id,
        type: item.type === 'airport' ? ('airport' as const) : ('city' as const),
        countryCode: item.countrycode ?? undefined,
        stateCode: item.statecode ?? undefined,
      },
    ]
  })
}

async function fetchDirect(query: string): Promise<LocationResult[]> {
  const res = await fetch(`${DIRECT_URL}?f=j&s=car&where=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseResponse(await res.json())
}

async function fetchProxy(query: string): Promise<LocationResult[]> {
  const res = await fetch(`${PROXY_URL}?where=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`)
  return parseResponse(await res.json())
}

export async function fetchLocations(query: string): Promise<LocationResult[]> {
  if (cache.has(query)) return cache.get(query)!

  let results: LocationResult[]
  try {
    results = await fetchDirect(query)
  } catch {
    results = await fetchProxy(query)
  }

  cache.set(query, results)
  return results
}

export function clearAutocompleteCache(): void {
  cache.clear()
}
```

- [ ] **Step 4: Run the tests — verify they all PASS**

```bash
npm test
```

Expected: `4 tests passed`.

---

## Task 4: Implement `lib/buildRedirectParams.ts` + unit tests

**Files:**
- Create: `lib/buildRedirectParams.ts`
- Create: `lib/__tests__/buildRedirectParams.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/buildRedirectParams.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildRedirectParams } from '../buildRedirectParams'
import type { SearchFormValues } from '../types'

const pickupLocation: NonNullable<SearchFormValues['pickupLocation']> = {
  displayName: 'Miami Intl Airport',
  id: 'MIA',
  type: 'airport',
  countryCode: 'US',
  stateCode: 'FL',
}

const dropoffLocation: NonNullable<SearchFormValues['dropoffLocation']> = {
  displayName: 'JFK Airport',
  id: 'JFK',
  type: 'airport',
  countryCode: 'US',
}

const base: SearchFormValues = {
  pickupLocation,
  dropoffLocation: null,
  sameDropoff: true,
  pickupDate: new Date('2026-08-14'),
  returnDate: new Date('2026-08-20'),
  pickupTime: '10:00',
  returnTime: '14:30',
  priceAlert: false,
}

describe('buildRedirectParams', () => {
  it('always includes vert=cars and tab=front', () => {
    const fd = buildRedirectParams(base)
    expect(fd.get('vert')).toBe('cars')
    expect(fd.get('tab')).toBe('front')
  })

  it('calculates rental-duration as 6 for Aug 14→20', () => {
    const fd = buildRedirectParams(base)
    expect(fd.get('rental-duration')).toBe('6')
  })

  it('sets pickup-t and drop-off-t to the raw time strings', () => {
    const fd = buildRedirectParams(base)
    expect(fd.get('pickup-t')).toBe('10:00')
    expect(fd.get('drop-off-t')).toBe('14:30')
  })

  it('sets pickup-destination fields from pickupLocation', () => {
    const fd = buildRedirectParams(base)
    expect(fd.get('pickup-destination')).toBe('Miami Intl Airport')
    expect(fd.get('pickup-destination-id')).toBe('MIA')
    expect(fd.get('pickup-destination-key')).toBe('airport')
  })

  it('omits drop-off fields when sameDropoff is true', () => {
    const fd = buildRedirectParams(base)
    expect(fd.get('drop-off-destination')).toBeNull()
    expect(fd.get('drop-off-destination-id')).toBeNull()
  })

  it('includes drop-off fields when sameDropoff is false', () => {
    const fd = buildRedirectParams({ ...base, sameDropoff: false, dropoffLocation })
    expect(fd.get('drop-off-destination')).toBe('JFK Airport')
    expect(fd.get('drop-off-destination-id')).toBe('JFK')
    expect(fd.get('drop-off-destination-key')).toBe('airport')
  })

  it('includes country-code and state-code from pickup location', () => {
    const fd = buildRedirectParams(base)
    expect(fd.get('country-code')).toBe('US')
    expect(fd.get('state-code')).toBe('FL')
  })

  it('throws when pickupLocation is null', () => {
    expect(() => buildRedirectParams({ ...base, pickupLocation: null })).toThrow()
  })
})
```

- [ ] **Step 2: Run tests — verify all FAIL**

```bash
npm test
```

Expected: 8 failing tests with `Cannot find module '../buildRedirectParams'`.

- [ ] **Step 3: Create `lib/buildRedirectParams.ts`**

```ts
import type { SearchFormValues, RedirectParams } from './types'

function localISOWithOffset(date: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)

  const offsetMin = -d.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const absMin = Math.abs(offsetMin)
  const ohh = String(Math.floor(absMin / 60)).padStart(2, '0')
  const omm = String(absMin % 60).padStart(2, '0')

  const year = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const H = String(d.getHours()).padStart(2, '0')
  const M = String(d.getMinutes()).padStart(2, '0')

  return `${year}-${mo}-${day}T${H}:${M}:00${sign}${ohh}:${omm}`
}

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000)
}

export function buildRedirectParams(values: SearchFormValues): FormData {
  const { pickupLocation, dropoffLocation, sameDropoff, pickupDate, returnDate, pickupTime, returnTime } = values

  if (!pickupLocation || !pickupDate || !returnDate) {
    throw new Error('Missing required form values')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const params: RedirectParams = {
    vert: 'cars',
    tab: 'front',
    lng: typeof navigator !== 'undefined' ? (navigator.language ?? 'en') : 'en',
    'rental-duration': daysBetween(pickupDate, returnDate),
    'pickup-time': localISOWithOffset(pickupDate, pickupTime),
    'pickup-t': pickupTime,
    'drop-off-time': localISOWithOffset(returnDate, returnTime),
    'drop-off-t': returnTime,
    dta: daysBetween(today, pickupDate),
    'pickup-destination': pickupLocation.displayName,
    'pickup-destination-id': pickupLocation.id,
    'pickup-destination-key': pickupLocation.type,
  }

  if (pickupLocation.countryCode) params['country-code'] = pickupLocation.countryCode
  if (pickupLocation.stateCode) params['state-code'] = pickupLocation.stateCode

  if (!sameDropoff && dropoffLocation) {
    params['drop-off-destination'] = dropoffLocation.displayName
    params['drop-off-destination-id'] = dropoffLocation.id
    params['drop-off-destination-key'] = dropoffLocation.type
  }

  const fd = new FormData()
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined) fd.append(key, String(val))
  }
  return fd
}
```

- [ ] **Step 4: Run tests — verify all 12 tests PASS**

```bash
npm test
```

Expected: `12 tests passed`.

---

## Task 5: Update `app/globals.css` with color custom properties

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add color variables and remove dark-mode body colors**

Replace the full contents of `app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --primary:       #2563eb;
  --primary-hover: #1d4ed8;
  --success:       #059669;
  --error:         #dc2626;
  --warning:       #d97706;
  --gray-50:       #f9fafb;
  --gray-100:      #f3f4f6;
  --gray-200:      #e5e7eb;
  --gray-500:      #6b7280;
  --gray-900:      #111827;
}

@theme inline {
  --color-background: #ffffff;
  --color-foreground: var(--gray-900);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

- [ ] **Step 2: Verify the dev server starts cleanly**

```bash
npm run dev
```

Open http://localhost:3000 — the default page should still render without console errors. Stop the server with Ctrl+C.

---

## Task 6: Build `FieldError` component

**Files:**
- Create: `app/components/FieldError.tsx`

- [ ] **Step 1: Create `app/components/FieldError.tsx`**

```tsx
interface FieldErrorProps {
  message: string
  id?: string
}

export function FieldError({ message, id }: FieldErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      className="absolute bottom-full left-0 z-20 mb-2 min-w-max max-w-xs rounded-md px-3 py-2 text-sm text-white shadow-lg"
      style={{ backgroundColor: 'var(--error)' }}
    >
      {message}
      <span
        aria-hidden="true"
        className="absolute left-4 top-full block"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid var(--error)',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 7: Build `TimeSelect` component

**Files:**
- Create: `app/components/TimeSelect.tsx`

- [ ] **Step 1: Create `app/components/TimeSelect.tsx`**

```tsx
'use client'

import { Clock } from 'lucide-react'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import type { SearchFormValues } from '@/lib/types'
import { FieldError } from './FieldError'

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

interface TimeSelectProps {
  name: 'pickupTime' | 'returnTime'
  label: string
  control: Control<SearchFormValues>
  rules?: object
  error?: string
}

export function TimeSelect({ name, label, control, rules, error }: TimeSelectProps) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <div className="relative flex flex-col">
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <>
            {error && <FieldError message={error} id={errorId} />}
            <label htmlFor={`${name}-select`} className="mb-1 text-xs font-medium text-gray-500">
              {label}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3">
              <Clock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              <select
                {...field}
                id={`${name}-select`}
                aria-describedby={errorId}
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none cursor-pointer"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </>
        )}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 8: Build `PriceAlertCheckbox` component

**Files:**
- Create: `app/components/PriceAlertCheckbox.tsx`

- [ ] **Step 1: Create `app/components/PriceAlertCheckbox.tsx`**

```tsx
'use client'

import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import type { SearchFormValues } from '@/lib/types'

interface PriceAlertCheckboxProps {
  control: Control<SearchFormValues>
}

export function PriceAlertCheckbox({ control }: PriceAlertCheckboxProps) {
  return (
    <Controller
      name="priceAlert"
      control={control}
      render={({ field: { value, onChange, ref, ...rest } }) => (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white select-none">
          <input
            {...rest}
            ref={ref}
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
            style={{ accentColor: 'var(--primary)' }}
          />
          Alert me when price drops
        </label>
      )}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 9: Build `DatePickerInput` component

**Files:**
- Create: `app/components/DatePickerInput.tsx`

> **Before coding:** confirm the react-day-picker version you noted in Task 1 Step 7.  
> v8.x → `import 'react-day-picker/dist/style.css'`  
> v9.x+ → `import 'react-day-picker/style.css'`

- [ ] **Step 1: Create `app/components/DatePickerInput.tsx`**

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Calendar } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
// Use the correct import for your installed version (see note above):
import 'react-day-picker/style.css'
import type { SearchFormValues } from '@/lib/types'
import { FieldError } from './FieldError'

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

interface DatePickerInputProps {
  name: 'pickupDate' | 'returnDate'
  label: string
  control: Control<SearchFormValues>
  minDate?: Date
  rules?: object
  error?: string
}

export function DatePickerInput({ name, label, control, minDate, rules, error }: DatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const errorId = error ? `${name}-error` : undefined

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={containerRef} className="relative flex flex-col">
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <>
            {error && <FieldError message={error} id={errorId} />}
            <label className="mb-1 text-xs font-medium text-gray-500">{label}</label>
            <button
              type="button"
              aria-describedby={errorId}
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 text-left text-sm font-medium text-gray-900 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
            >
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              {field.value
                ? <span>{formatDate(field.value)}</span>
                : <span className="text-gray-400">Select date</span>
              }
            </button>
            {open && (
              <div
                role="dialog"
                aria-label={label}
                className="absolute bottom-full left-0 z-30 mb-2 rounded-xl border border-gray-200 bg-white shadow-xl"
              >
                <DayPicker
                  mode="single"
                  selected={field.value ?? undefined}
                  onSelect={(date) => {
                    field.onChange(date ?? null)
                    setOpen(false)
                  }}
                  disabled={minDate ? { before: minDate } : undefined}
                  defaultMonth={field.value ?? minDate ?? new Date()}
                />
              </div>
            )}
          </>
        )}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

If react-day-picker types complain about `disabled` prop shape, check the installed version's types:
```bash
cat node_modules/react-day-picker/dist/types.d.ts 2>/dev/null | grep -A5 'disabled' | head -20
```
Adjust the `disabled` prop accordingly.

---

## Task 10: Build `LocationInput` component

**Files:**
- Create: `app/components/LocationInput.tsx`

- [ ] **Step 1: Create `app/components/LocationInput.tsx`**

```tsx
'use client'

import { useState, useRef, useCallback, useId } from 'react'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Search, MapPin, Plane, Loader2 } from 'lucide-react'
import { fetchLocations } from '@/lib/autocomplete'
import type { SearchFormValues, LocationResult } from '@/lib/types'
import { FieldError } from './FieldError'

type Status = 'idle' | 'loading' | 'open' | 'error'

interface LocationInputProps {
  name: 'pickupLocation' | 'dropoffLocation'
  label: string
  placeholder: string
  control: Control<SearchFormValues>
  rules?: object
  error?: string
}

export function LocationInput({ name, label, placeholder, control, rules, error }: LocationInputProps) {
  const [inputText, setInputText] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listboxId = useId()
  const errorId = error ? `${name}-error` : undefined

  const runSearch = useCallback(async (query: string) => {
    setStatus('loading')
    try {
      const data = await fetchLocations(query)
      setResults(data)
      setStatus('open')
    } catch {
      setStatus('error')
    }
  }, [])

  const selectResult = useCallback(
    (result: LocationResult, onChange: (v: LocationResult) => void) => {
      setInputText(result.displayName)
      onChange(result)
      setStatus('idle')
      setResults([])
      setActiveIndex(-1)
    },
    []
  )

  return (
    <div className="relative flex flex-col">
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <>
            {error && <FieldError message={error} id={errorId} />}
            <label htmlFor={`${name}-input`} className="mb-1 text-xs font-medium text-gray-500">
              {label}
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3">
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" aria-hidden="true" />
                ) : (
                  <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                )}
                <input
                  id={`${name}-input`}
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={status === 'open'}
                  aria-controls={listboxId}
                  aria-activedescendant={
                    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
                  }
                  aria-describedby={errorId}
                  value={inputText}
                  placeholder={placeholder}
                  autoComplete="off"
                  className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none"
                  onChange={(e) => {
                    const val = e.target.value
                    setInputText(val)
                    field.onChange(null)
                    setActiveIndex(-1)
                    if (debounceRef.current) clearTimeout(debounceRef.current)
                    if (val.length < 3) {
                      setStatus('idle')
                      setResults([])
                      return
                    }
                    debounceRef.current = setTimeout(() => runSearch(val), 500)
                  }}
                  onKeyDown={(e) => {
                    if (status !== 'open') return
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setActiveIndex((i) => Math.max(i - 1, 0))
                    } else if (e.key === 'Enter' && activeIndex >= 0) {
                      e.preventDefault()
                      selectResult(results[activeIndex], field.onChange)
                    } else if (e.key === 'Escape') {
                      setStatus('idle')
                    }
                  }}
                />
              </div>

              {status === 'open' && (
                <ul
                  id={listboxId}
                  role="listbox"
                  aria-label={label}
                  className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl"
                >
                  {results.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-gray-500">No results found</li>
                  ) : (
                    results.map((r, i) => (
                      <li
                        key={`${r.id}-${i}`}
                        id={`${listboxId}-option-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          i === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault() // keep input focused
                          selectResult(r, field.onChange)
                        }}
                      >
                        {r.type === 'airport' ? (
                          <Plane className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                        ) : (
                          <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                        )}
                        <div>
                          <span className="font-medium text-gray-900">{r.displayName}</span>
                          {r.countryCode && (
                            <span className="ml-2 text-gray-400">{r.countryCode}</span>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}

              {status === 'error' && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-xl">
                  <p className="text-sm" style={{ color: 'var(--error)' }}>
                    Could not load suggestions — try again
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 11: Build CORS proxy API route

**Files:**
- Create: `app/api/autocomplete/route.ts`

- [ ] **Step 1: Create `app/api/autocomplete/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'

const KAYAK_URL = 'https://www.il.kayak.com/mvm/smartyv2/search'

export async function GET(request: NextRequest) {
  const where = request.nextUrl.searchParams.get('where')
  if (!where || where.length < 3) {
    return NextResponse.json({ error: 'where param missing or too short' }, { status: 400 })
  }

  try {
    const upstream = `${KAYAK_URL}?f=j&s=car&where=${encodeURIComponent(where)}`
    const res = await fetch(upstream, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; car-rental-search/1.0)',
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // cache proxy responses for 5 minutes
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 12: Build `SearchForm` component

**Files:**
- Create: `app/components/SearchForm.tsx`

- [ ] **Step 1: Create `app/components/SearchForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Search, Loader2 } from 'lucide-react'
import type { SearchFormValues, LocationResult } from '@/lib/types'
import { buildRedirectParams } from '@/lib/buildRedirectParams'
import { LocationInput } from './LocationInput'
import { DatePickerInput } from './DatePickerInput'
import { TimeSelect } from './TimeSelect'
import { PriceAlertCheckbox } from './PriceAlertCheckbox'

const TODAY = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

export function SearchForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormValues>({
    defaultValues: {
      pickupLocation: null,
      dropoffLocation: null,
      sameDropoff: true,
      pickupDate: null,
      returnDate: null,
      pickupTime: '10:00',
      returnTime: '10:00',
      priceAlert: false,
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const sameDropoff = watch('sameDropoff')
  const pickupDate = watch('pickupDate')
  const returnMinDate = pickupDate ?? TODAY

  const onSubmit = async (values: SearchFormValues) => {
    setSubmitError(null)
    try {
      const body = buildRedirectParams(values)
      const res = await fetch('https://api.int.therentalradar.com/v1/cars/redirect', {
        method: 'POST',
        body,
        redirect: 'follow',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      setSubmitError('Search failed — please try again.')
    }
  }

  // Helpers to extract error messages from react-hook-form's nested error objects
  const locError = (name: 'pickupLocation' | 'dropoffLocation'): string | undefined =>
    (errors[name] as { message?: string } | undefined)?.message

  const dateError = (name: 'pickupDate' | 'returnDate'): string | undefined =>
    (errors[name] as { message?: string } | undefined)?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Search card */}
      <div className="rounded-2xl border-2 border-amber-400 bg-white p-4 shadow-lg lg:p-6">

        {/* Same drop-off toggle */}
        <div className="mb-4">
          <Controller
            name="sameDropoff"
            control={control}
            render={({ field: { value, onChange, ref, ...rest } }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 select-none">
                <input
                  {...rest}
                  ref={ref}
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: 'var(--primary)' }}
                />
                Same drop-off
              </label>
            )}
          />
        </div>

        {/*
          Layout strategy:
          - Mobile/tablet: flex-col (stacked)
          - Desktop (lg): flex-row — fields become a single horizontal bar
          The two date+time pairs each use `grid grid-cols-2 lg:contents` so that
          on desktop the wrapper disappears and children become direct flex items.
        */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-0 lg:divide-x lg:divide-gray-200">

          {/* Pick-up location */}
          <div className="lg:flex-[2] lg:px-3 lg:first:pl-0">
            <LocationInput
              name="pickupLocation"
              label="Pick-up location"
              placeholder="City or airport"
              control={control}
              rules={{
                validate: (v: LocationResult | null) =>
                  v !== null || 'Pick-up location is required - select from the list',
              }}
              error={locError('pickupLocation')}
            />
          </div>

          {/* Drop-off location (conditional) */}
          {!sameDropoff && (
            <div className="lg:flex-[2] lg:px-3">
              <LocationInput
                name="dropoffLocation"
                label="Drop-off location"
                placeholder="City or airport"
                control={control}
                rules={{
                  validate: (v: LocationResult | null) => {
                    const { sameDropoff: same } = getValues()
                    if (!same && !v) return 'Drop-off location is required — select from the list'
                    return true
                  },
                }}
                error={locError('dropoffLocation')}
              />
            </div>
          )}

          {/* Pick-up date + time — 2-col on mobile, individual flex items on desktop */}
          <div className="grid grid-cols-2 gap-2 lg:contents">
            <div className="lg:flex-1 lg:px-3">
              <DatePickerInput
                name="pickupDate"
                label="Pick-up date"
                control={control}
                minDate={TODAY}
                rules={{
                  validate: (v: Date | null) => v !== null || 'Pick-up date is required',
                }}
                error={dateError('pickupDate')}
              />
            </div>
            <div className="lg:w-32 lg:px-3">
              <TimeSelect
                name="pickupTime"
                label="Time"
                control={control}
                rules={{ required: 'Pick-up time is required' }}
                error={errors.pickupTime?.message}
              />
            </div>
          </div>

          {/* Return date + time */}
          <div className="grid grid-cols-2 gap-2 lg:contents">
            <div className="lg:flex-1 lg:px-3">
              <DatePickerInput
                name="returnDate"
                label="Return date"
                control={control}
                minDate={returnMinDate}
                rules={{
                  validate: (v: Date | null) => {
                    if (!v) return 'Return date is required'
                    const { pickupDate: pd } = getValues()
                    if (pd && v < pd) return 'Return date must be on or after pick-up date'
                    return true
                  },
                }}
                error={dateError('returnDate')}
              />
            </div>
            <div className="lg:w-32 lg:px-3">
              <TimeSelect
                name="returnTime"
                label="Time"
                control={control}
                rules={{
                  validate: (returnTime: string) => {
                    const { pickupDate: pd, returnDate: rd, pickupTime: pt } = getValues()
                    if (!pd || !rd) return true
                    const [ph, pm] = pt.split(':').map(Number)
                    const [rh, rm] = returnTime.split(':').map(Number)
                    const pickupDT = new Date(pd)
                    pickupDT.setHours(ph, pm, 0, 0)
                    const returnDT = new Date(rd)
                    returnDT.setHours(rh, rm, 0, 0)
                    const diffMs = returnDT.getTime() - pickupDT.getTime()
                    return diffMs >= 60 * 60 * 1000 || 'There must be at least one hour between pick-up and drop-off'
                  },
                }}
                error={errors.returnTime?.message}
              />
            </div>
          </div>

          {/* Search button */}
          <div className="lg:ml-2 lg:pl-3">
            {/* Spacer for label row alignment on desktop */}
            <div className="mb-1 hidden text-xs lg:block">&nbsp;</div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition-colors disabled:opacity-70 lg:w-auto lg:whitespace-nowrap"
              style={{ backgroundColor: 'var(--primary)' }}
              onMouseEnter={(e) => {
                if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary-hover)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary)'
              }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <p className="mt-3 text-sm" style={{ color: 'var(--error)' }} role="alert">
            {submitError}
          </p>
        )}
      </div>

      {/* Price alert — below the card, right-aligned */}
      <div className="mt-3 flex justify-end">
        <PriceAlertCheckbox control={control} />
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

If you see errors about `errors.pickupLocation` or `errors.pickupDate` type shape, the cast in the `locError`/`dateError` helpers may need adjustment. Check the actual type reported by TypeScript and adjust the cast accordingly.

---

## Task 13: Update `app/page.tsx` — hero layout

**Files:**
- Modify: `app/page.tsx`
- Create: `public/hero-bg.jpg` (sourced externally — see step 1)

- [ ] **Step 1: Add a hero background image**

Download a free road/car photograph (Unsplash, Pexels, or similar) and save it as `public/hero-bg.jpg`. Minimum size: 1920×1080px. If you don't have one immediately, the CSS gradient fallback in the next step will display instead.

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { SearchForm } from './components/SearchForm'

export const metadata: Metadata = {
  title: 'Car Rental — Compare & Save',
  description: 'Search and compare car rental deals worldwide.',
}

const PARTNER_LOGOS = ['Budget', 'Enterprise', 'Hertz', 'Avis', 'Expedia', 'Orbitz', 'AVIS']

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero section */}
      <section
        className="relative flex min-h-[480px] flex-col items-center justify-center bg-cover bg-center px-4 py-16"
        style={{
          backgroundImage:
            "url('/hero-bg.jpg'), linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0f172a 100%)",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-5xl">
          <h1 className="mb-8 text-center text-3xl font-bold leading-tight text-white drop-shadow-md md:text-5xl">
            Compare &amp; Save on<br />
            <span className="text-amber-300">Car Rental</span>
          </h1>
          <SearchForm />
        </div>
      </section>

      {/* Partner logos strip */}
      <section className="bg-white py-6 px-4" aria-label="Our partners">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8">
          {PARTNER_LOGOS.map((name) => (
            <span
              key={name}
              className="text-base font-bold tracking-widest text-gray-400 uppercase"
            >
              {name}
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Update layout metadata in `app/layout.tsx`**

Change the title in the existing layout to remove the Create Next App default:

```tsx
export const metadata: Metadata = {
  title: 'Car Rental — Compare & Save',
  description: 'Search and compare car rental deals worldwide.',
}
```

- [ ] **Step 4: Run the dev server and verify the page loads**

```bash
npm run dev
```

Open http://localhost:3000. You should see:
- Hero section with dark overlay and headline
- The search card with amber border
- No console errors

Stop the server with Ctrl+C.

---

## Task 14: Manual QA checklist

Run the dev server (`npm run dev`) and test each scenario:

**Autocomplete**
- [ ] Typing 1–2 chars in "Pick-up location" → no API call, no dropdown
- [ ] Typing 3+ chars → spinner appears, then dropdown with results after ~500ms
- [ ] Dropdown shows airplane icon for airports, pin icon for cities
- [ ] Clicking a result fills the input and closes the dropdown
- [ ] Clearing the input after selecting → form value cleared
- [ ] Typing the same query twice → only one network request (cache working) — verify in DevTools Network tab
- [ ] Arrow key navigation + Enter to select works

**Validation**
- [ ] Click Search with empty form → error tooltips appear above each required field in red
- [ ] Error tooltips disappear as fields are corrected
- [ ] Return date set before pick-up date → error on return date field
- [ ] Pick-up and return both on same day, same time → error: "at least one hour"
- [ ] Pick-up 09:00, return 09:30, same day → error: "at least one hour"
- [ ] Pick-up 09:00, return 10:00, same day → no error

**Responsive layout**
- [ ] At 375px width: fields stack vertically, date+time in 2-column pairs, search button full-width
- [ ] At 1024px+: all fields appear in a single horizontal row

**Drop-off toggle**
- [ ] "Same drop-off" checked (default) → no drop-off location field visible
- [ ] Unchecking → drop-off location field appears, is required on submit

**Form submission**
- [ ] With all fields valid → Search button shows spinner, POST is made to the redirect endpoint
- [ ] Check DevTools Network: Content-Type is `multipart/form-data`, all `RedirectParams` keys are present

**Accessibility**
- [ ] Tab through all fields → focus order is logical
- [ ] Screen reader announces error tooltips (role="alert")
- [ ] Autocomplete dropdown has correct ARIA roles (combobox, listbox, option)

**Final check**
- [ ] `npm run build` completes with no errors
- [ ] `npm test` — all 12 unit tests pass
