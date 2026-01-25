'use client';

import { useState, useMemo, useCallback, Fragment } from 'react';
import { Table, Checkbox } from '@radix-ui/themes';
import {
  CaretSortIcon,
  CaretUpIcon,
  CaretDownIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@radix-ui/react-icons';
import type { Column, DataTableProps, SortState, SortDirection } from './types';
import styles from './DataTable.module.scss';

const getCellValue = <T,>(row: T, accessor: Column<T>['accessor']): unknown => {
  if (typeof accessor === 'function') {
    return accessor(row);
  }
  return row[accessor];
};

const defaultGetRowKey = <T,>(row: T, index: number): string | number => {
  if (typeof row === 'object' && row !== null && 'id' in row) {
    return (row as { id: string | number }).id;
  }
  return index;
};

const defaultSortFn = <T,>(
  a: T,
  b: T,
  accessor: Column<T>['accessor'],
  direction: SortDirection,
): number => {
  const aVal = getCellValue(a, accessor);
  const bVal = getCellValue(b, accessor);

  let comparison = 0;
  if (aVal === null || aVal === undefined) comparison = 1;
  else if (bVal === null || bVal === undefined) comparison = -1;
  else if (typeof aVal === 'string' && typeof bVal === 'string') {
    comparison = aVal.localeCompare(bVal);
  } else if (typeof aVal === 'number' && typeof bVal === 'number') {
    comparison = aVal - bVal;
  } else {
    comparison = String(aVal).localeCompare(String(bVal));
  }

  return direction === 'desc' ? -comparison : comparison;
};

export const DataTable = <T,>({
  data,
  columns,
  getRowKey = defaultGetRowKey,
  className,
  loading = false,
  emptyMessage = 'No data available',
  striped = false,
  hoverable = true,
  size = '2',
  variant = 'surface',

  // Sortable
  sortable = false,
  sort: controlledSort,
  onSortChange,
  defaultSort,

  // Selectable
  selectable = false,
  selectedKeys: controlledSelectedKeys,
  onSelectionChange,
  selectAll = true,

  // Expandable
  expandable = false,
  renderExpandedRow,
  expandedKeys: controlledExpandedKeys,
  onExpandedChange,
}: DataTableProps<T>) => {
  // Internal state for uncontrolled mode
  const [internalSort, setInternalSort] = useState<SortState | undefined>(
    defaultSort,
  );
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<
    Set<string | number>
  >(new Set());
  const [internalExpandedKeys, setInternalExpandedKeys] = useState<
    Set<string | number>
  >(new Set());

  // Use controlled or internal state
  const currentSort = controlledSort ?? internalSort;
  const selectedKeySet = controlledSelectedKeys ?? internalSelectedKeys;
  const expandedKeySet = controlledExpandedKeys ?? internalExpandedKeys;

  // Handle sort change
  const handleSortChange = useCallback(
    (columnId: string) => {
      const newDirection: SortDirection =
        currentSort?.columnId === columnId
          ? currentSort.direction === 'asc'
            ? 'desc'
            : currentSort.direction === 'desc'
              ? null
              : 'asc'
          : 'asc';

      const newSort: SortState = { columnId, direction: newDirection };

      if (onSortChange) {
        onSortChange(newSort);
      } else {
        setInternalSort(newSort);
      }
    },
    [currentSort, onSortChange],
  );

  // Handle selection change
  const handleSelectionChange = useCallback(
    (key: string | number, checked: boolean) => {
      const newSet = new Set(selectedKeySet);
      if (checked) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }

      if (onSelectionChange) {
        onSelectionChange(newSet);
      } else {
        setInternalSelectedKeys(newSet);
      }
    },
    [selectedKeySet, onSelectionChange],
  );

  // Handle select all
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const newSet = checked
        ? new Set(data.map((row, index) => getRowKey(row, index)))
        : new Set<string | number>();

      if (onSelectionChange) {
        onSelectionChange(newSet);
      } else {
        setInternalSelectedKeys(newSet);
      }
    },
    [data, getRowKey, onSelectionChange],
  );

  // Handle expand toggle
  const handleExpandToggle = useCallback(
    (key: string | number) => {
      const newSet = new Set(expandedKeySet);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }

      if (onExpandedChange) {
        onExpandedChange(newSet);
      } else {
        setInternalExpandedKeys(newSet);
      }
    },
    [expandedKeySet, onExpandedChange],
  );

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortable || !currentSort?.direction) return data;

    const column = columns.find((col) => col.id === currentSort.columnId);
    if (!column) return data;

    return [...data].sort((a, b) => {
      if (column.sortFn) {
        return column.sortFn(a, b, currentSort.direction);
      }
      return defaultSortFn(a, b, column.accessor, currentSort.direction);
    });
  }, [data, sortable, currentSort, columns]);

  // Calculate total columns (including selection and expand columns)
  const totalColumns =
    columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0);

  // Check if all rows are selected
  const allSelected =
    data.length > 0 &&
    data.every((row, index) => selectedKeySet.has(getRowKey(row, index)));
  const someSelected =
    data.some((row, index) => selectedKeySet.has(getRowKey(row, index))) &&
    !allSelected;

  const tableClasses = [
    styles.dataTable,
    styles[variant],
    hoverable && styles.hoverable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const renderSortIcon = (column: Column<T>) => {
    if (!sortable || !column.sortable) return null;

    const isActive = currentSort?.columnId === column.id;
    const direction = isActive ? currentSort?.direction : null;

    return (
      <span className={styles.sortIcon}>
        {direction === 'asc' ? (
          <CaretUpIcon />
        ) : direction === 'desc' ? (
          <CaretDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </span>
    );
  };

  return (
    <Table.Root size={size} className={tableClasses}>
      <Table.Header>
        <Table.Row>
          {selectable && (
            <Table.ColumnHeaderCell className={styles.checkboxCell}>
              {selectAll && (
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? 'indeterminate' : false
                  }
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked === true)
                  }
                />
              )}
            </Table.ColumnHeaderCell>
          )}
          {expandable && (
            <Table.ColumnHeaderCell className={styles.expandCell} />
          )}
          {columns.map((column) => (
            <Table.ColumnHeaderCell
              key={column.id}
              style={{ width: column.width }}
              align={column.align}
              className={
                sortable && column.sortable ? styles.sortableHeader : undefined
              }
              onClick={
                sortable && column.sortable
                  ? () => handleSortChange(column.id)
                  : undefined
              }
            >
              <span className={styles.headerContent}>
                {column.header}
                {renderSortIcon(column)}
              </span>
            </Table.ColumnHeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedData.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={totalColumns} className={styles.emptyCell}>
              {emptyMessage}
            </Table.Cell>
          </Table.Row>
        ) : (
          sortedData.map((row, rowIndex) => {
            const rowKey = getRowKey(row, rowIndex);
            const isSelected = selectedKeySet.has(rowKey);
            const isExpanded = expandedKeySet.has(rowKey);

            return (
              <Fragment key={rowKey}>
                <Table.Row
                  className={[
                    striped && rowIndex % 2 === 1
                      ? styles.stripedRow
                      : undefined,
                    isSelected ? styles.selectedRow : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {selectable && (
                    <Table.Cell className={styles.checkboxCell}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectionChange(rowKey, checked === true)
                        }
                      />
                    </Table.Cell>
                  )}
                  {expandable && (
                    <Table.Cell className={styles.expandCell}>
                      <button
                        type="button"
                        className={styles.expandButton}
                        onClick={() => handleExpandToggle(rowKey)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                      >
                        {isExpanded ? (
                          <ChevronDownIcon />
                        ) : (
                          <ChevronRightIcon />
                        )}
                      </button>
                    </Table.Cell>
                  )}
                  {columns.map((column) => {
                    const value = getCellValue(row, column.accessor);
                    const displayValue = column.cell
                      ? column.cell(value, row)
                      : String(value ?? '');

                    return (
                      <Table.Cell key={column.id} align={column.align}>
                        {displayValue}
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
                {expandable && isExpanded && renderExpandedRow && (
                  <Table.Row className={styles.expandedRow}>
                    <Table.Cell colSpan={totalColumns}>
                      {renderExpandedRow(row)}
                    </Table.Cell>
                  </Table.Row>
                )}
              </Fragment>
            );
          })
        )}
      </Table.Body>
    </Table.Root>
  );
};
