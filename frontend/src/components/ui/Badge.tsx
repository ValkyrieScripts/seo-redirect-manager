import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-800/50 text-slate-300 border border-slate-700/50',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        error: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode;
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

// Status-specific badge with dot indicator
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    active: {
      variant: 'success' as const,
      dotColor: 'bg-emerald-400',
      label: 'Active',
    },
    inactive: {
      variant: 'error' as const,
      dotColor: 'bg-rose-400',
      label: 'Inactive',
    },
    pending: {
      variant: 'warning' as const,
      dotColor: 'bg-amber-400',
      label: 'Pending',
    },
  };

  const { variant, dotColor, label } = config[status];

  return (
    <Badge variant={variant} className="gap-1.5">
      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', dotColor)} />
      {label}
    </Badge>
  );
}
