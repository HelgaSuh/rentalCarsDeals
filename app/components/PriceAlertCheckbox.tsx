'use client'
import React from 'react';
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
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white select-none mt-7 lg:mt-0">
          <button
            {...rest}
            ref={ref}
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => onChange(!value)}
            className={`${
                value ? 'bg-slate-950' : 'bg-slate-700'
            } relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
          >
              <span className="sr-only">Toggle setting</span>
              <span
                  aria-hidden="true"
                  className={`${
                      value ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#e2e8f0] shadow ring-0 transition duration-200 ease-in-out`}
              />
          </button>
          Alert me when price drops
        </label>
      )}
    />
  )
}
