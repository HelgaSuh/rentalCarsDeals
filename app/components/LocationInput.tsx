'use client'

import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { MapPin, Plane } from 'lucide-react'
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
  variant?: 'flat'
}

export function LocationInput({ name, label, placeholder, control, rules, error, variant }: LocationInputProps) {
  const [inputText, setInputText] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listboxId = useId()
  const errorId = error ? `${name}-error` : undefined

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

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
      <div className="relative flex flex-col h-full group">
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field }) => (
                <>
                  {error && <FieldError message={error} id={errorId} />}

                  <div className="relative flex-1 flex flex-col">
                    <div className={variant === 'flat' ? 'px-3 py-2 h-full transition-colors' : 'px-3 py-3 h-full rounded-lg bg-white transition-colors border border-gray-200'}>
                      <label htmlFor={`${name}-input`} className="mb-1 text-xs font-medium text-gray-500">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">

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
                                selectResult(results[activeIndex], field.onChange as (v: LocationResult) => void)
                              } else if (e.key === 'Escape') {
                                setStatus('idle')
                              }
                            }}
                        />
                      </div>
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
                                        selectResult(r, field.onChange as (v: LocationResult) => void)
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
                          <p className="text-sm text-red-600">
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
