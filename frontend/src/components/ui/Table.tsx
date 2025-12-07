import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead className={cn('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400 [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'p-4 align-middle text-gray-900 dark:text-gray-100 [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

// Empty state component for tables
interface TableEmptyProps {
  message?: string;
  colSpan: number;
}

export function TableEmpty({ message = 'No data found', colSpan }: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-gray-500">
        {message}
      </TableCell>
    </TableRow>
  );
}
