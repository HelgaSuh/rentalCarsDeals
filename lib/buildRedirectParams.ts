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
