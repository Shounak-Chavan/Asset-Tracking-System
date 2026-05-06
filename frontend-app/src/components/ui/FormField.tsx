import { Input, type InputProps } from './Input'

interface FormFieldProps extends InputProps {
  label: string
  required?: boolean
  hint?: string
}

export function FormField({ label, required, hint, error, ...inputProps }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-gray-400 font-normal">({hint})</span>}
      </label>
      <Input error={error} {...inputProps} />
    </div>
  )
}
