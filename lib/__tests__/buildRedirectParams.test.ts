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
