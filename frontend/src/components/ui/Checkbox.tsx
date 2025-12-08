import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            className={cn(
              'peer h-5 w-5 shrink-0 appearance-none rounded-md border border-slate-600/50 bg-slate-800/50',
              'checked:border-primary-500 checked:bg-primary-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'hover:border-slate-500/50 hover:bg-slate-800/70',
              'transition-all duration-200',
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute left-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        {label && (
          <label
            htmlFor={id}
            className="ml-2.5 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
