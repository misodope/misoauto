'use client';

import { DropdownMenu, IconButton } from '@radix-ui/themes';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { ReactNode } from 'react';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  color?: 'red' | 'blue' | 'green' | 'gray';
  disabled?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export default function ActionMenu({
  items,
  side = 'bottom',
  align = 'end',
}: ActionMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton variant="ghost" size="1">
          <DotsVerticalIcon />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content side={side} align={align}>
        {items.map((item) => (
          <DropdownMenu.Item
            key={item.id}
            color={item.color}
            disabled={item.disabled}
            onSelect={item.onClick}
          >
            {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
