'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Search, Loader2, ChevronDown } from 'lucide-react'
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

  const locError = (name: 'pickupLocation' | 'dropoffLocation'): string | undefined =>
    (errors[name] as { message?: string } | undefined)?.message

  const dateError = (name: 'pickupDate' | 'returnDate'): string | undefined =>
    (errors[name] as { message?: string } | undefined)?.message

  return (
      <div className="rounded-2xl bg-blue-950/70 p-4 shadow-lg lg:p-3">
        <div className="mb-4">
          <Controller
              name="sameDropoff"
              control={control}
              render={({ field: { value, onChange } }) => (
                  <label className="flex cursor-pointer items-center gap-1 text-sm font-medium text-white/90 select-none w-fit">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="sr-only"
                    />
                    Same drop-off
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${!value ? 'rotate-180' : ''}`} />
                  </label>
              )}
          />
        </div>
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Search card */}
      <div className="rounded-2xl bg-amber-400 p-2 shadow-lg lg:p-2">

        <div className="flex flex-col gap-2 min-[1109px]:flex-row min-[1109px]:flex-nowrap min-[1109px]:items-stretch min-[1109px]:gap-0">

          {/* Pick-up location */}
          <div className={`rounded-lg border border-gray-200 bg-white min-[1109px]:mx-1 ${sameDropoff ? 'min-[1109px]:flex-[2]' : 'min-[1109px]:flex-[1] min-[1517px]:flex-[2]'}`}>
            <LocationInput
              variant="flat"
              name="pickupLocation"
              label={sameDropoff ? 'Pick-up & Drop-off' : 'Pick-up location'}
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
            <div className="rounded-lg border border-gray-200 bg-white min-[1109px]:flex-[1] min-[1109px]:mx-1 min-[1517px]:flex-[2]">
              <LocationInput
                variant="flat"
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

          {/* Pick-up date + time */}
          <div className="flex items-stretch rounded-lg border border-gray-200 bg-white divide-x divide-gray-200 min-[1109px]:flex-1 min-[1109px]:mx-1">
            <div className="flex-1 min-w-0">
              <DatePickerInput
                variant="flat"
                name="pickupDate"
                label="Pick-Up Date"
                control={control}
                minDate={TODAY}
                rules={{
                  validate: (v: Date | null) => v !== null || 'Pick-up date is required',
                }}
                error={dateError('pickupDate')}
              />
            </div>
            <div className="w-24 shrink-0">
              <TimeSelect
                variant="flat"
                name="pickupTime"
                label="Time"
                control={control}
                rules={{ required: 'Pick-up time is required' }}
                error={errors.pickupTime?.message}
              />
            </div>
          </div>

          {/* Return date + time */}
          <div className="flex items-stretch rounded-lg border border-gray-200 bg-white divide-x divide-gray-200 min-[1109px]:flex-1 min-[1109px]:mx-1">
            <div className="flex-1 min-w-0">
              <DatePickerInput
                variant="flat"
                name="returnDate"
                label="Return Date"
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
            <div className="w-24 shrink-0">
              <TimeSelect
                variant="flat"
                name="returnTime"
                label="Time"
                control={control}
                rules={{
                  validate: (returnTime: string) => {
                    const { pickupDate: pd, returnDate: rd, pickupTime: pt } = getValues()
                    if (!pd || !rd) return true
                    const sameDay =
                      pd.getFullYear() === rd.getFullYear() &&
                      pd.getMonth() === rd.getMonth() &&
                      pd.getDate() === rd.getDate()
                    if (!sameDay) return true
                    const [ph, pm] = pt.split(':').map(Number)
                    const [rh, rm] = returnTime.split(':').map(Number)
                    const pickupMins = ph * 60 + pm
                    const returnMins = rh * 60 + rm
                    return (
                      returnMins - pickupMins >= 60 ||
                      'Return time must be at least one hour after pick-up on the same day'
                    )
                  },
                }}
                error={errors.returnTime?.message}
              />
            </div>
          </div>

          {/* Search button */}
          <div className="flex flex-col justify-center min-[1109px]:shrink-0 min-[1109px]:mx-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 min-[1109px]:w-auto min-[1109px]:whitespace-nowrap"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              Search
            </button>
            {submitError && (
              <p className="mt-1 text-center text-xs text-red-600 min-[1109px]:text-right" role="alert">
                {submitError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        {[
          '✓ Free cancellation on most bookings',
          '✓ 60,000+ locations',
          '✓ Customer support in 30+ languages',
        ].map((badge) => (
            <span key={badge} className="text-xs text-white/90">{badge}</span>
        ))}
        <div className="flex justify-end">
          <PriceAlertCheckbox control={control} />
        </div>
      </div>


    </form>
      </div>
  )
}
