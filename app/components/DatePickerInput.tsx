'use client'

import { useState, useRef, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import dynamic from 'next/dynamic'
import 'react-day-picker/style.css'

const DayPicker = dynamic(
  () => import('react-day-picker').then((m) => ({ default: m.DayPicker })),
  { ssr: false }
)
import type { SearchFormValues } from '@/lib/types'
import { FieldError } from './FieldError'

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${mo}-${day}`
}

interface DatePickerInputProps {
  name: 'pickupDate' | 'returnDate'
  label: string
  control: Control<SearchFormValues>
  minDate?: Date
  rules?: object
  error?: string
  variant?: 'flat'
}

export function DatePickerInput({ name, label, control, minDate, rules, error, variant }: DatePickerInputProps) {
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
    <div className="flex flex-col group rounded-lg transition-colors">
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <>
            <div ref={containerRef} className="relative">
              {error && <FieldError message={error} id={errorId} />}

              <button
                type="button"
                aria-describedby={errorId}
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => setOpen((o) => !o)}
                className={`w-full px-3 py-3 text-left text-sm font-medium text-gray-900 transition-colors focus:outline-none ${
                  variant === 'flat' 
                    ? 'bg-transparent' 
                    : 'bg-white rounded-lg focus:ring-2 focus:ring-blue-500'
                }`}
              >
                <label className="mt-1 text-xs font-medium text-gray-500">{label}</label>
                {field.value
                  ? <div>{formatDate(field.value)}</div>
                  : <div className="text-gray-400">Select date</div>
                }
              </button>
              {open && (
                <div
                  role="dialog"
                  aria-label={label}
                  className="absolute left-0 top-full z-30 mt-1 mx-1 my-2 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
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
            </div>
          </>
        )}
      />
    </div>
  )
}
