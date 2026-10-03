import React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { btnGhost } from './ui';

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div role="status" className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
    <Loader2 className="w-8 h-8 animate-spin text-orange-500" aria-hidden="true" />
    <span>{label}...</span>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden="true" />
    <p className="text-red-300">{message}</p>
    {onRetry && <button type="button" className={btnGhost} onClick={onRetry}>Try again</button>}
  </div>
);

export const EmptyState: React.FC<{ message: string; hint?: string }> = ({ message, hint }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-400">
    <Inbox className="w-8 h-8 text-gray-600" aria-hidden="true" />
    <p className="text-gray-300">{message}</p>
    {hint && <p className="text-sm">{hint}</p>}
  </div>
);
