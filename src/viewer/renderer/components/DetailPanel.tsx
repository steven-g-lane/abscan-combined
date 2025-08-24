import React from 'react';

interface DetailSection {
  title: string;
  items: { label: string; value: string | number }[];
}

interface DetailPanelProps {
  selectedItem?: any;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ selectedItem }) => {
  // Placeholder data matching the mockup
  const summarySection: DetailSection = {
    title: 'Summary',
    items: [
      { label: 'File Count:', value: '1' },
      { label: 'Creation Date:', value: '5/12/2025' },
      { label: 'Creation Time:', value: '3:05:31 PM' },
      { label: 'FileMaker Version:', value: '21.1.1' },
      { label: 'XML Type:', value: 'Summary' },
    ],
  };

  const grandTotalsSection: DetailSection = {
    title: 'Grand Totals',
    items: [
      { label: 'Base Tables:', value: '22' },
      { label: 'Table Occurrences:', value: '53' },
      { label: 'Relationships:', value: '30' },
      { label: 'Accounts:', value: '2' },
      { label: 'Privileges:', value: '3' },
      { label: 'Extended Privileges:', value: '11' },
      { label: 'File Access:', value: '2' },
      { label: 'Layouts:', value: '41' },
      { label: 'Scripts:', value: '109' },
      { label: 'Value Lists:', value: '10' },
      { label: 'Custom Functions:', value: '247' },
      { label: 'File References:', value: '0' },
      { label: 'Custom Menu Sets:', value: '1' },
      { label: 'Custom Menus:', value: '24' },
    ],
  };

  const metadataSection: DetailSection = {
    title: 'Metadata',
    items: [
      { label: 'Base Tables:', value: '22' },
      { label: 'Table Occurrences:', value: '53' },
      { label: 'Relationships:', value: '30' },
      { label: 'Accounts:', value: '2' },
      { label: 'Privileges:', value: '3' },
    ],
  };

  const sections = [summarySection, grandTotalsSection, metadataSection];

  const renderSection = (section: DetailSection) => (
    <div key={section.title} className="bg-background-secondary rounded border border-border-secondary">
      <div className="p-3 border-b border-border-primary bg-background-tertiary">
        <h3 className="font-semibold text-foreground-primary">{section.title}</h3>
      </div>
      <div className="p-2">
        {section.items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center py-1 px-2 hover:bg-background-tertiary rounded"
          >
            <span className="text-sm text-foreground-secondary">{item.label}</span>
            <span className="text-sm text-foreground-primary font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background-primary">
      {/* Header */}
      <div className="p-3 border-b border-border-primary bg-background-secondary">
        <h2 className="font-semibold text-foreground-primary">
          {selectedItem?.name || 'Summary'}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-3">
          {sections.map(renderSection)}
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;