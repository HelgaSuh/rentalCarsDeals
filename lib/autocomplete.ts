import type { LocationResult } from './types'

const DIRECT_URL = 'https://www.il.kayak.com/mvm/smartyv2/search'
const PROXY_URL = '/api/autocomplete'

const cache = new Map<string, LocationResult[]>()
const MAX_CACHE_SIZE = 100

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseResponse(data: unknown): LocationResult[] {
  if (!Array.isArray(data)) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).flatMap((item) => {
    const locType: string = item.displayType?.type ?? item.type ?? ''
    if (locType !== 'city' && locType !== 'airport') return []
    const displayName: string = item.displayname ?? item.name ?? ''
    const id: string = item.apicode ?? item.ap ?? item.code ?? item.kayakId ?? item.id ?? ''
    if (!displayName || !id) return []
    return [
      {
        displayName,
        id,
        type: locType === 'airport' ? ('airport' as const) : ('city' as const),
        countryCode: item.countrycode ?? item.cc ?? undefined,
        stateCode: item.statecode ?? item.rc ?? undefined,
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
  const key = query.toLowerCase()
  if (cache.has(key)) return cache.get(key)!

  let results: LocationResult[]
  try {
    results = await fetchDirect(query)
  } catch {
    results = await fetchProxy(query)
  }

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, results)
  return results
}

export function clearAutocompleteCache(): void {
  cache.clear()
}
