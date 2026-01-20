'use client';

import * as Toast from '@radix-ui/react-toast';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useToastContext } from './ToastContext';
import type { ToastVariant } from './types';
import styles from './Toaster.module.scss';

const getVariantClass = (variant: ToastVariant): string => {
  switch (variant) {
    case 'success':
      return styles.toastSuccess;
    case 'error':
      return styles.toastError;
    case 'warning':
      return styles.toastWarning;
    case 'info':
    default:
      return styles.toastInfo;
  }
};

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToastContext();

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          className={`${styles.toast} ${getVariantClass(toast.variant ?? 'info')}`}
          duration={toast.duration}
          onOpenChange={(open) => {
            if (!open) {
              dismiss(toast.id);
            }
          }}
        >
          <Toast.Title className={styles.title}>{toast.title}</Toast.Title>
          {toast.description && (
            <Toast.Description className={styles.description}>
              {toast.description}
            </Toast.Description>
          )}
          <Toast.Action className={styles.action} asChild altText="Close">
            <button
              className={styles.closeButton}
              onClick={() => dismiss(toast.id)}
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Toast.Action>
        </Toast.Root>
      ))}
      <Toast.Viewport className={styles.viewport} />
    </Toast.Provider>
  );
};
