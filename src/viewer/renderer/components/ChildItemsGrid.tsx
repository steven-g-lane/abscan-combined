import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Generic grid item interface - can be extended for different item types
export interface GridItem {
  [key: string]: any;
}

// Truncation configuration for individual columns
export interface TruncationConfig {
  enabled: boolean;
  maxLength?: number;
}

// Column configuration for different item types
export interface GridColumnConfig<T = GridItem> {
  id: string;
  header: string;
  accessorKey?: string;
  accessorFn?: (row: T) => any;
  cell?: (info: any) => React.ReactNode;
  size?: number;
  minSize?: number;
  maxSize?: number;
  truncation?: TruncationConfig;
}

interface ChildItemsGridProps<T = GridItem> {
  data: T[];
  columns: GridColumnConfig<T>[];
  defaultSorting?: SortingState;
  className?: string;
  // Grid row click handler - receives the original item and its row index (for selection highlighting)
  onRowClick?: (item: T, rowIndex: number) => void;
  // Grid row double-click handler - receives the original item and its row index (for navigation)
  onRowDoubleClick?: (item: T, rowIndex: number) => void;
}

const ChildItemsGrid = <T extends GridItem>({
  data,
  columns,
  defaultSorting = [],
  className = '',
  onRowClick,
  onRowDoubleClick
}: ChildItemsGridProps<T>) => {
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting);
  const [selectedRowIndex, setSelectedRowIndex] = React.useState<number | null>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('ChildItemsGrid received data:', {
      dataLength: data?.length,
      columnsLength: columns?.length,
      firstItem: data?.[0],
      columns: columns.map(c => c.id)
    });
  }, [data, columns]);

  // Convert our column config to TanStack Table column definitions
  const tanstackColumns = useMemo<ColumnDef<T>[]>(() => {
    return columns.map((col) => ({
      id: col.id,
      header: col.header,
      accessorKey: col.accessorKey,
      accessorFn: col.accessorFn,
      cell: col.cell ? ({ getValue, row }) => col.cell!({ getValue, row }) : undefined,
      size: col.size,
      minSize: col.minSize,
      maxSize: col.maxSize,
    }));
  }, [columns]);

  const table = useReactTable({
    data: data || [],
    columns: tanstackColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handle potential rendering errors
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-foreground-muted text-sm">No data available</span>
      </div>
    );
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-foreground-muted text-sm">No columns configured</span>
      </div>
    );
  }

  try {
    return (
      <div className={`h-full overflow-auto ${className}`}>
        <div>
          <table className="w-full text-xs font-mono table-fixed">
            <thead className="sticky top-0 bg-background-secondary border-b border-border-primary">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="text-left px-3 py-2 text-foreground-primary font-medium cursor-pointer hover:bg-background-tertiary select-none"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </span>
                        {header.column.getIsSorted() && (
                          <span className="text-foreground-muted">
                            {header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronUp size={12} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => {
                const isSelected = selectedRowIndex === row.index;
                return (
                  <tr
                    key={row.id}
                    className={`${row.index % 2 === 1 ? 'bg-white/5' : ''} hover:bg-background-tertiary transition-colors ${
                      isSelected ? 'bg-blue-500/20 border-l-2 border-blue-500' : ''
                    } ${(onRowClick || onRowDoubleClick) ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      // Single-click: highlight/select row (no navigation)
                      setSelectedRowIndex(row.index);
                      if (onRowClick) {
                        onRowClick(row.original, row.index);
                      }
                    }}
                    onDoubleClick={() => {
                      // Double-click: trigger navigation
                      if (onRowDoubleClick) {
                        onRowDoubleClick(row.original, row.index);
                      }
                    }}
                  >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-3 py-2 text-foreground-primary align-top"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                );
              })}
            </tbody>
          </table>
          
          {data.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-foreground-muted text-sm">No items to display</span>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ChildItemsGrid rendering error:', error);
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-foreground-muted text-sm">
          Error displaying grid: {error instanceof Error ? error.message : 'Unknown error'}
        </span>
      </div>
    );
  }
};

export default ChildItemsGrid;