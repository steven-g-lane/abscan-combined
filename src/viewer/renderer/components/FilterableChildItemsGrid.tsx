import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import ChildItemsGrid, { GridItem, GridColumnConfig } from './ChildItemsGrid';
import { SortingState } from '@tanstack/react-table';

interface FilterableChildItemsGridProps<T = GridItem> {
  data: T[];
  columns: GridColumnConfig<T>[];
  defaultSorting?: SortingState;
  className?: string;
  onRowClick?: (item: T, rowIndex: number) => void;
  // Filter configuration
  filterPlaceholder?: string;
  filterColumn?: string; // Column ID to filter on (defaults to first column)
}

const FilterableChildItemsGrid = <T extends GridItem>({
  data,
  columns,
  defaultSorting = [],
  className = '',
  onRowClick,
  filterPlaceholder = 'Name',
  filterColumn
}: FilterableChildItemsGridProps<T>) => {
  const [filterText, setFilterText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear filter when data changes
  useEffect(() => {
    setFilterText('');
  }, [data]);

  // Determine which column to filter on
  const targetFilterColumn = useMemo(() => {
    if (filterColumn) return filterColumn;
    return columns.length > 0 ? columns[0].id : '';
  }, [filterColumn, columns]);

  // Filter data based on search input
  const filteredData = useMemo(() => {
    if (!filterText.trim()) return data;

    const lowerFilter = filterText.toLowerCase();

    return data.filter(item => {
      // Find the column configuration for the target filter column
      const columnConfig = columns.find(col => col.id === targetFilterColumn);
      if (!columnConfig) return false;

      // Extract the value using the same logic as the column configuration
      let value = '';

      if (columnConfig.accessorKey) {
        // Use accessorKey for simple property access
        const keys = columnConfig.accessorKey.split('.');
        let current = item;
        for (const key of keys) {
          if (current && typeof current === 'object') {
            current = (current as any)[key];
          } else {
            current = undefined;
            break;
          }
        }
        value = String(current || '');
      } else if (columnConfig.accessorFn) {
        // Use accessorFn for complex value extraction
        try {
          const result = columnConfig.accessorFn(item);
          value = String(result || '');
        } catch (error) {
          console.warn('Error in filter accessorFn:', error);
          value = '';
        }
      } else {
        // Fallback to item name properties
        value = String(item.name || item.item_name || '');
      }

      return value.toLowerCase().includes(lowerFilter);
    });
  }, [data, filterText, columns, targetFilterColumn]);

  return (
    <div className="h-full flex flex-col">
      {/* Search Input - smaller and right-aligned */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-border-primary bg-background-secondary">
        <div className="flex justify-end">
          <div className="relative w-[30%] min-w-[200px]">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-foreground-muted pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              placeholder={filterPlaceholder}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-background-primary border border-border-primary rounded
                       text-foreground-primary placeholder-foreground-muted
                       focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                       transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 min-h-0">
        <ChildItemsGrid
          data={filteredData}
          columns={columns}
          defaultSorting={defaultSorting}
          className={className}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
};

export default FilterableChildItemsGrid;