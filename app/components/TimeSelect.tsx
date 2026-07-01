'use client'

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
    variant?: 'flat'
}

export function TimeSelect({ name, label, control, rules, error, variant }: TimeSelectProps) {
    const errorId = error ? `${name}-error` : undefined

    return (
        <div className="flex flex-col relative h-full">
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field }) => (
                    <>
                        <div className={variant === 'flat' ? 'flex flex-col px-3 py-3 h-full' : 'flex flex-col rounded-lg border border-gray-200 bg-white px-3 py-3 h-full'}>
                            {error && <FieldError message={error} id={errorId} />}
                            <label htmlFor={`${name}-select`} className="mt-0.75 text-xs font-medium text-gray-500">
                                {label}
                            </label>
                            <select
                                {...field}
                                id={`${name}-select`}
                                aria-describedby={errorId}
                                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none cursor-pointer appearance-none"
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
