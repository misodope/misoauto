'use client';

import { DropdownMenu as RadixDropdownMenu } from '@radix-ui/themes';
import { ReactNode } from 'react';

export interface DropdownMenuItem {
  id: string;
  name: string;
  onClick: () => void;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  trigger: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export default function DropdownMenu({
  items,
  trigger,
  side = 'bottom',
  align = 'end',
}: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {trigger}
        </button>
      </RadixDropdownMenu.Trigger>

      <RadixDropdownMenu.Content side={side} align={align} sideOffset={5}>
        {items.map((item) => (
          <RadixDropdownMenu.Item key={item.id} onSelect={item.onClick}>
            {item.name}
          </RadixDropdownMenu.Item>
        ))}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Root>
  );
}
