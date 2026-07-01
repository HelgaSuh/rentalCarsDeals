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
