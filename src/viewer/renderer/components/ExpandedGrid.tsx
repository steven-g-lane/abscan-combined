import React from 'react';

interface GridColumn {
  key: string;
  title: string;
  width?: string;
}

interface GridRow {
  id: string;
  [key: string]: any;
}

interface ExpandedGridProps {
  data?: GridRow[];
  selectedItem?: any;
}

const ExpandedGrid: React.FC<ExpandedGridProps> = ({ data = [], selectedItem }) => {
  // Placeholder columns similar to the mockup
  const columns: GridColumn[] = [
    { key: 'name', title: 'Name', width: 'minmax(200px, 1fr)' },
    { key: 'size', title: 'XML Size (MB)', width: '120px' },
    { key: 'baseTables', title: 'Base Tables', width: '100px' },
    { key: 'tableOccurrences', title: 'Table Occurrences', width: '130px' },
    { key: 'relationships', title: 'Relationships', width: '120px' },
    { key: 'accounts', title: 'Accounts', width: '100px' },
    { key: 'privileges', title: 'Privileges', width: '100px' },
  ];

  // Placeholder data matching the mockup
  const placeholderData: GridRow[] = [
    {
      id: '1',
      name: 'AI.fmp12',
      size: '7.1950016',
      baseTables: '22',
      tableOccurrences: '53',
      relationships: '30',
      accounts: '2',
      privileges: '3',
    }
  ];

  const displayData = data.length > 0 ? data : placeholderData;

  return (
    <div className="h-full flex flex-col bg-background-tertiary">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border-primary bg-background-secondary">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground-secondary">
            {displayData.length} Item{displayData.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-foreground-muted">
            0 Selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="🔍 Name"
            className="px-2 py-1 text-sm bg-background-primary border border-border-secondary rounded focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div
          className="grid gap-0 text-sm"
          style={{
            gridTemplateColumns: columns.map(col => col.width || '1fr').join(' '),
          }}
        >
          {/* Header Row */}
          {columns.map((column) => (
            <div
              key={column.key}
              className="p-2 font-medium bg-background-secondary border-b border-r border-border-primary text-foreground-secondary last:border-r-0"
            >
              {column.title}
            </div>
          ))}
          
          {/* Data Rows */}
          {displayData.map((row) => (
            columns.map((column) => (
              <div
                key={`${row.id}-${column.key}`}
                className="p-2 border-b border-r border-border-primary bg-background-secondary hover:bg-background-tertiary text-foreground-primary last:border-r-0"
              >
                {column.key === 'name' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60">📄</span>
                    <span>{row[column.key] || '-'}</span>
                  </div>
                ) : (
                  <span>{row[column.key] || '-'}</span>
                )}
              </div>
            ))
          ))}
        </div>
        
        {displayData.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <span className="text-foreground-muted">No data to display</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandedGrid;