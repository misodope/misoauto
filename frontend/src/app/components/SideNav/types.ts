import type { ReactNode } from 'react';

export interface NavItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label */
  label: string;
  /** Navigation path (makes item a link) */
  href?: string;
  /** Icon element or emoji */
  icon?: ReactNode;
  /** Click handler (for non-link items) */
  onClick?: () => void;
  /** Nested items for collapsible sections */
  children?: NavItem[];
  /** Whether item is disabled */
  disabled?: boolean;
  /** Badge content to show next to label */
  badge?: ReactNode;
}

export interface NavSection {
  /** Optional section title */
  title?: string;
  /** Items in this section */
  items: NavItem[];
}

export interface SideNavProps {
  /** Navigation items - can be flat array or sections */
  items: NavItem[] | NavSection[];
  /** Header content (logo, brand, etc.) */
  header?: ReactNode;
  /** Footer content (custom ReactNode) */
  footer?: ReactNode;
  /** Footer nav items (will collapse properly with icons) */
  footerItems?: NavItem[];
  /** Whether the sidenav is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Width of the sidenav when expanded */
  width?: number;
  /** Width of the sidenav when collapsed */
  collapsedWidth?: number;
  /** Optional class name */
  className?: string;
  /** Visual variant */
  variant?: 'default' | 'floating' | 'inset';
}
