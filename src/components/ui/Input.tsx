import { forwardRef, type InputHTMLAttributes, useId } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition-colors',
          'placeholder:text-slate-400',
          'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500',
          'dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500',
          error
            ? 'border-rose-500 dark:border-rose-500'
            : 'border-slate-300 dark:border-slate-700',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  )
})
