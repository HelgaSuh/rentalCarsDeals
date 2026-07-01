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
