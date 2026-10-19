'use client';

import { Dialog, Flex, IconButton } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import type { DrawerProps } from './types';
import styles from './Drawer.module.scss';

export const Drawer = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  width = 400,
  preventClose = false,
}: DrawerProps) => {
  const panelStyle = {
    maxWidth: typeof width === 'number' ? `${width}px` : width,
  };

  const blockClose = (event: Event) => {
    if (preventClose) event.preventDefault();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && preventClose) return;
        onOpenChange(isOpen);
      }}
    >
      <Dialog.Content
        className={styles.panel}
        style={panelStyle}
        onEscapeKeyDown={blockClose}
        onPointerDownOutside={blockClose}
        onInteractOutside={blockClose}
      >
        <Flex justify="between" align="start" mb="4">
          <div>
            <Dialog.Title size="5">{title}</Dialog.Title>
            {description && (
              <Dialog.Description size="2" color="gray" mt="1">
                {description}
              </Dialog.Description>
            )}
          </div>
          <Dialog.Close>
            <IconButton variant="ghost" size="1" disabled={preventClose}>
              <Cross2Icon />
            </IconButton>
          </Dialog.Close>
        </Flex>

        <Flex direction="column" gap="4">
          {children}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default Drawer;
