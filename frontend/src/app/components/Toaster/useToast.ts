'use client';

import { useCallback } from 'react';
import { useToastContext } from './ToastContext';
import type { ToastOptions } from './types';

export interface UseToastReturn {
  toast: (options: ToastOptions) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const useToast = (): UseToastReturn => {
  const { toast, dismiss, dismissAll } = useToastContext();

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'success' }),
    [toast],
  );

  const error = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'error' }),
    [toast],
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'warning' }),
    [toast],
  );

  const info = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'info' }),
    [toast],
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  };
};
