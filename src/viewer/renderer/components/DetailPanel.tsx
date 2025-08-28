import React from 'react';

interface DetailPanelProps {
  selectedItem?: {
    item_name?: string;
    name?: string;
    metadata?: any;
    [key: string]: any;
  } | null;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ selectedItem }) => {
  const getItemName = (item: any): string => {
    return item?.item_name || item?.name || 'Unknown Item';
  };

  const renderMetadataValue = (value: any, key: string = ''): JSX.Element => {
    if (value === null || value === undefined) {
      return <span className="text-foreground-muted italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-foreground-primary font-mono">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-foreground-primary font-mono">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-foreground-primary">{value}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-foreground-muted italic">[]</span>;
      }
      return (
        <div className="ml-4">
          <span className="text-foreground-secondary">[</span>
          {value.map((item, index) => (
            <div key={index} className="ml-2 py-1">
              <span className="text-foreground-muted text-sm">{index}: </span>
              {renderMetadataValue(item, `${key}[${index}]`)}
            </div>
          ))}
          <span className="text-foreground-secondary">]</span>
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="text-foreground-muted italic">{'{}'}</span>;
      }
      return (
        <div className="ml-4">
          {entries.map(([k, v]) => (
            <div key={k} className="py-1 border-l border-border-secondary pl-3 ml-2">
              <div className="flex flex-wrap gap-2">
                <span className="text-foreground-secondary font-medium text-sm">{k}:</span>
                <div className="flex-1 min-w-0">
                  {renderMetadataValue(v, `${key}.${k}`)}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-foreground-primary">{String(value)}</span>;
  };

  const renderMetadataSection = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center h-32">
          <span className="text-foreground-muted text-center">
            Select an item to view details
          </span>
        </div>
      );
    }

    if (!selectedItem.metadata) {
      return (
        <div className="flex items-center justify-center h-32">
          <span className="text-foreground-muted text-center">
            No metadata available
          </span>
        </div>
      );
    }

    const metadata = selectedItem.metadata;
    const entries = Object.entries(metadata);

    if (entries.length === 0) {
      return (
        <div className="flex items-center justify-center h-32">
          <span className="text-foreground-muted text-center">
            No metadata available
          </span>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-background-secondary rounded border border-border-secondary">
            <div className="p-3 border-b border-border-primary bg-background-tertiary">
              <h4 className="font-medium text-foreground-primary text-sm">{key}</h4>
            </div>
            <div className="p-3">
              {renderMetadataValue(value, key)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background-primary">
      {/* Header */}
      <div className="p-3 border-b border-border-primary bg-background-secondary">
        <h2 className="font-semibold text-foreground-primary text-sm">
          {selectedItem ? getItemName(selectedItem) : 'Item Details'}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          {renderMetadataSection()}
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;