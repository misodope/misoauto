import { ReactNode } from 'react';

export interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** Title displayed in the drawer header */
  title?: string;
  /** Description displayed below the title */
  description?: string;
  /** Content to render inside the drawer */
  children: ReactNode;
  /** Width of the drawer. Default: 400 */
  width?: number | string;
  /** Side the drawer slides in from. Default: 'right' */
  side?: 'left' | 'right';
}
