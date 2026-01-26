'use client';

import { Dialog, Flex, IconButton } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import styles from './Drawer.module.scss';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export const Drawer = ({
  open,
  onOpenChange,
  title,
  children,
}: DrawerProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className={styles.panel}>
        <Flex justify="between" align="start" mb="4">
          <Dialog.Title size="5">{title}</Dialog.Title>
          <Dialog.Close>
            <IconButton variant="ghost" size="1">
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
