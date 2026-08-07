import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Eye, EyeOff } from 'lucide-react';

const Input = React.forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  type = 'text',
  className,
  containerClassName,
  required = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
          {required && <span className="text-[var(--loss)] ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            <Icon size={18} />
          </div>
        )}

        <input
          ref={ref}
          type={inputType}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg text-sm',
            'bg-[var(--bg-input)] text-[var(--text-primary)]',
            'border border-[var(--border-primary)]',
            'placeholder:text-[var(--text-tertiary)]',
            'transition-all duration-200',
            'hover:border-[var(--border-secondary)]',
            'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]',
            'focus:shadow-[0_0_0_3px_rgba(0,82,255,0.1)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            Icon && 'pl-10',
            (IconRight || isPassword) && 'pr-10',
            error && 'border-[var(--loss)] focus:border-[var(--loss)] focus:ring-[var(--loss)]',
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {IconRight && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            <IconRight size={18} />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--loss)] flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-[var(--loss)]" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;