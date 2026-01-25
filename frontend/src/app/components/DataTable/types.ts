import type { ReactNode } from 'react';

/** Visual style variants */
export type TableVariant = 'surface' | 'bordered' | 'borderless' | 'ghost';

/** Sort direction */
export type SortDirection = 'asc' | 'desc' | null;

/** Sort state for a column */
export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface Column<T> {
  /** Unique identifier for the column */
  id: string;
  /** Header text or element to display */
  header: ReactNode;
  /** Key to access the data value, or a function to extract it */
  accessor: keyof T | ((row: T) => unknown);
  /** Optional custom cell renderer */
  cell?: (value: unknown, row: T) => ReactNode;
  /** Optional column width */
  width?: string;
  /** Align cell content */
  align?: 'left' | 'center' | 'right';
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
}

export interface DataTableProps<T> {
  /** Array of data objects to display */
  data: T[];
  /** Column configuration */
  columns: Column<T>[];
  /** Optional key extractor for row identification */
  getRowKey?: (row: T, index: number) => string | number;
  /** Optional class name for the table */
  className?: string;
  /** Show loading state */
  loading?: boolean;
  /** Message to display when data is empty */
  emptyMessage?: string;
  /** Enable striped rows */
  striped?: boolean;
  /** Enable hover effect on rows */
  hoverable?: boolean;
  /** Table size variant */
  size?: '1' | '2' | '3';
  /** Visual style variant */
  variant?: TableVariant;

  // Feature variants - Sortable
  /** Enable sorting (columns must also have sortable: true) */
  sortable?: boolean;
  /** Controlled sort state */
  sort?: SortState;
  /** Callback when sort changes */
  onSortChange?: (sort: SortState) => void;
  /** Default sort state for uncontrolled mode */
  defaultSort?: SortState;

  // Feature variants - Selectable
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string | number>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: Set<string | number>) => void;
  /** Enable select all checkbox in header */
  selectAll?: boolean;

  // Feature variants - Expandable
  /** Enable expandable rows */
  expandable?: boolean;
  /** Render function for expanded content */
  renderExpandedRow?: (row: T) => ReactNode;
  /** Expanded row keys */
  expandedKeys?: Set<string | number>;
  /** Callback when expanded rows change */
  onExpandedChange?: (expandedKeys: Set<string | number>) => void;
}
