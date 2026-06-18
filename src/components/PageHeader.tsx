import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * Consistent page header used across all inner pages.
 * Provides title, optional subtitle and an optional action button (e.g. "Nova Venda").
 */
export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-graphite-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-graphite-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
