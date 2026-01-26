'use client';

import { ReactNode } from 'react';
import { Dialog, Flex, Button } from '@radix-ui/themes';

export interface ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  confirmVariant?: 'solid' | 'soft' | 'outline' | 'ghost';
  confirmColor?: 'red' | 'blue' | 'green' | 'gray';
  showFooter?: boolean;
  maxWidth?: number;
}

export default function Modal({
  isOpen,
  onOpenChange,
  title,
  children,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDisabled = false,
  confirmLoading = false,
  confirmVariant = 'solid',
  confirmColor,
  showFooter = true,
  maxWidth = 450,
}: ModalProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth }}>
        <Dialog.Title>{title}</Dialog.Title>

        {children}

        {showFooter && (
          <Flex gap="3" mt="5" justify="end">
            <Button variant="soft" color="gray" onClick={handleCancel}>
              {cancelLabel}
            </Button>
            {onConfirm && (
              <Button
                variant={confirmVariant}
                color={confirmColor}
                onClick={handleConfirm}
                disabled={confirmDisabled || confirmLoading}
              >
                {confirmLoading ? 'Loading...' : confirmLabel}
              </Button>
            )}
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
