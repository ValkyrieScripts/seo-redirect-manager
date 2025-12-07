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
              'peer h-4 w-4 shrink-0 appearance-none rounded border border-gray-300 bg-white checked:border-primary-600 checked:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:checked:border-primary-500 dark:checked:bg-primary-500',
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute left-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100" />
        </div>
        {label && (
          <label
            htmlFor={id}
            className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
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
