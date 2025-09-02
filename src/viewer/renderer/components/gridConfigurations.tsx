import React from 'react';
import { Folder, icons } from 'lucide-react';
import { GridColumnConfig } from './ChildItemsGrid';

// Directory/File grid item interface based on MillerColumnEntry
interface DirectoryGridItem {
  name?: string;
  item_name?: string;
  children?: DirectoryGridItem[];
  metadata?: {
    fullPath: string;
    modificationTime: Date;
    size?: number;
    owner?: string | null;
    group?: string | null;
    permissions: string;
    isSymlink: boolean;
    symlinkTarget?: string;
    extension?: string;
    fileTypeInfo?: {
      isBinaryFile: boolean;
      mimeType: string;
    };
  };
  icon?: string;
}

// Utility functions for data formatting
export const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return '-';
  
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i === 0) return `${bytes} B`;
  
  return `${(bytes / Math.pow(k, i)).toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
};

export const formatTimestamp = (date: Date): string => {
  if (!date) return '-';
  
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return date.toString();
  }
};

export const formatPermissions = (permissions: string): string => {
  return permissions || '---------';
};

export const formatOwnership = (owner?: string | null, group?: string | null): string => {
  const ownerStr = owner || 'unknown';
  const groupStr = group || 'unknown';
  return `${ownerStr}:${groupStr}`;
};

// Icon rendering function - reuse Miller columns logic
export const renderFileIcon = (item: DirectoryGridItem) => {
  const iconName = item.icon || 'folder';
  
  try {
    // Convert kebab-case to PascalCase (e.g., 'circle-arrow-right' -> 'CircleArrowRight')
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    const IconComponent = icons[pascalCase as keyof typeof icons] as React.ComponentType<any>;
    
    if (IconComponent) {
      return <IconComponent size={14} className="text-foreground-muted" />;
    }
  } catch (error) {
    // Fallback silently
  }
  
  // Fallback to folder icon
  return <Folder size={14} className="text-foreground-muted" />;
};

// Directory grid configuration for file system items
export const directoryGridColumns: GridColumnConfig<DirectoryGridItem>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.name || row.item_name || 'Unnamed',
    cell: ({ row }) => {
      const item = row.original;
      const name = item.name || item.item_name || 'Unnamed';
      
      return (
        <div className="flex items-center gap-2">
          <span className="shrink-0">
            {renderFileIcon(item)}
          </span>
          <span className="truncate">{name}</span>
          {item.metadata?.isSymlink && (
            <span className="text-foreground-muted text-xs">→ {item.metadata.symlinkTarget}</span>
          )}
        </div>
      );
    },
    size: 250,
    minSize: 150,
  },
  {
    id: 'lastModified',
    header: 'Last Modified',
    accessorFn: (row) => {
      try {
        return row.metadata?.modificationTime || new Date(0);
      } catch (error) {
        return new Date(0);
      }
    },
    cell: ({ getValue }) => {
      try {
        return formatTimestamp(getValue() as Date);
      } catch (error) {
        return '-';
      }
    },
    size: 140,
    minSize: 120,
  },
  {
    id: 'size',
    header: 'Size',
    accessorFn: (row) => {
      try {
        // For directories, return special value for sorting
        if (row.children !== undefined) {
          return -1; // Directories sort before files when sorting by size
        }
        return row.metadata?.size || 0;
      } catch (error) {
        return 0;
      }
    },
    cell: ({ row, getValue }) => {
      try {
        // Show item count for directories, file size for files
        if (row.original.children !== undefined) {
          const count = row.original.children.length;
          return count === 0 ? '-' : `${count} items`;
        }
        return formatFileSize(getValue() as number);
      } catch (error) {
        return '-';
      }
    },
    size: 80,
    minSize: 60,
  },
  {
    id: 'owner',
    header: 'Owner',
    accessorFn: (row) => {
      try {
        return row.metadata?.owner || 'unknown';
      } catch (error) {
        return 'unknown';
      }
    },
    cell: ({ getValue }) => {
      try {
        return getValue() as string;
      } catch (error) {
        return 'unknown';
      }
    },
    size: 80,
    minSize: 60,
  },
  {
    id: 'group',
    header: 'Group',
    accessorFn: (row) => {
      try {
        return row.metadata?.group || 'unknown';
      } catch (error) {
        return 'unknown';
      }
    },
    cell: ({ getValue }) => {
      try {
        return getValue() as string;
      } catch (error) {
        return 'unknown';
      }
    },
    size: 80,
    minSize: 60,
  },
  {
    id: 'permissions',
    header: 'Permissions',
    accessorFn: (row) => {
      try {
        return row.metadata?.permissions || '---------';
      } catch (error) {
        return '---------';
      }
    },
    cell: ({ getValue }) => {
      try {
        return (
          <span className="font-mono text-xs">{formatPermissions(getValue() as string)}</span>
        );
      } catch (error) {
        return <span className="font-mono text-xs">---------</span>;
      }
    },
    size: 90,
    minSize: 80,
  },
];

// Simplified single-column grid configuration for featureless children
export const featurelessGridColumns: GridColumnConfig<DirectoryGridItem>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.name || row.item_name || 'Unnamed',
    cell: ({ row }) => {
      const item = row.original;
      const name = item.name || item.item_name || 'Unnamed';
      
      return (
        <div className="flex items-center gap-2">
          <span className="shrink-0">
            {renderFileIcon(item)}
          </span>
          <span className="truncate">{name}</span>
        </div>
      );
    },
    size: 400,
    minSize: 200,
  },
];

// Class summary grid item interface
interface ClassSummaryGridItem {
  name?: string;
  item_name?: string;
  children?: ClassSummaryGridItem[];
  metadata?: {
    name: string;
    sourceFilename?: string;
    sourceLOC?: number;
    referenceCount?: number;
    isLocal: boolean;
  };
  icon?: string;
}

// Class summary grid configuration for root Classes selection
export const classSummaryGridColumns: GridColumnConfig<ClassSummaryGridItem>[] = [
  {
    id: 'className',
    header: 'Class Name',
    accessorFn: (row) => row.metadata?.name || row.name || row.item_name || 'Unnamed',
    cell: ({ row }) => {
      const item = row.original;
      const name = item.metadata?.name || item.name || item.item_name || 'Unnamed';
      
      return (
        <div className="flex items-center gap-2">
          <span className="shrink-0">
            {renderFileIcon(item)}
          </span>
          <span className="truncate font-medium">{name}</span>
          {item.metadata?.isLocal === false && (
            <span className="text-foreground-muted text-xs">(imported)</span>
          )}
        </div>
      );
    },
    size: 200,
    minSize: 150,
  },
  {
    id: 'sourceFile',
    header: 'Source File',
    accessorFn: (row) => row.metadata?.sourceFilename || '-',
    cell: ({ getValue }) => {
      const filename = getValue() as string;
      return filename === '-' ? 
        <span className="text-foreground-muted">-</span> : 
        <span className="truncate font-mono text-sm">{filename}</span>;
    },
    size: 150,
    minSize: 100,
  },
  {
    id: 'sourceLOC',
    header: 'Source LOC',
    accessorFn: (row) => row.metadata?.sourceLOC || 0,
    cell: ({ getValue }) => {
      const loc = getValue() as number;
      return loc > 0 ? 
        <span className="font-mono text-sm text-right block">{loc.toLocaleString()}</span> : 
        <span className="text-foreground-muted text-right block">-</span>;
    },
    size: 100,
    minSize: 80,
  },
  {
    id: 'references',
    header: 'References',
    accessorFn: (row) => row.metadata?.referenceCount || 0,
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return count > 0 ? 
        <span className="font-mono text-sm text-right block">{count.toLocaleString()}</span> : 
        <span className="text-foreground-muted text-right block">0</span>;
    },
    size: 100,
    minSize: 80,
  },
];

// Method grid item interface for Methods section display
interface MethodGridItem {
  name?: string;
  item_name?: string;
  children?: MethodGridItem[];
  metadata?: {
    type: string;
    sourceFile: string;
    startLine: number;
    endLine?: number;
    methodName: string;
    method: any; // Full method data
  };
  icon?: string;
}

// Method grid configuration for Methods section
export const methodGridColumns: GridColumnConfig<MethodGridItem>[] = [
  {
    id: 'methodName',
    header: 'Method Name',
    accessorFn: (row) => row.metadata?.methodName || row.name || row.item_name || 'Unknown',
    cell: ({ row }) => {
      const item = row.original;
      const methodName = item.metadata?.methodName || item.name || item.item_name || 'Unknown';
      const method = item.metadata?.method;
      
      // Build method signature display
      let signature = methodName;
      if (method) {
        const paramStr = method.parameters?.map((p: any) => 
          `${p.name}${p.displayType ? `: ${p.displayType}` : ''}`
        ).join(', ') || '';
        signature = `${methodName}(${paramStr})`;
        
        if (method.displayReturnType) {
          signature += `: ${method.displayReturnType}`;
        }
        
        const modifiers = [
          method.isStatic ? 'static' : '',
          method.isAbstract ? 'abstract' : '',
          method.visibility !== 'public' ? method.visibility : ''
        ].filter(Boolean).join(' ');
        
        if (modifiers) {
          signature += ` (${modifiers})`;
        }
      }
      
      return (
        <div className="flex items-center gap-2">
          <span className="shrink-0">
            {renderFileIcon(item)}
          </span>
          <span className="truncate font-mono text-sm">{signature}</span>
        </div>
      );
    },
    size: 350,
    minSize: 200,
  },
  {
    id: 'loc',
    header: 'LOC',
    accessorFn: (row) => {
      const method = row.metadata?.method;
      if (!method?.location) return 0;
      return (method.location.endLine || method.location.line) - method.location.line + 1;
    },
    cell: ({ getValue }) => {
      const loc = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {loc}
        </span>
      );
    },
    size: 80,
    minSize: 60,
  },
  {
    id: 'referenceCount',
    header: 'References',
    accessorFn: (row) => row.metadata?.method?.referenceCount || 0,
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {count}
        </span>
      );
    },
    size: 100,
    minSize: 80,
  },
];

// Method reference grid item interface
interface MethodReferenceGridItem {
  name?: string;
  item_name?: string;
  children?: MethodReferenceGridItem[];
  metadata?: {
    type: string;
    sourceFile: string;
    line: number;
    contextLine: string;
    context?: string;
    referenceIndex?: number;
  };
  icon?: string;
}

// Method reference grid configuration for References section
export const methodReferenceGridColumns: GridColumnConfig<MethodReferenceGridItem>[] = [
  {
    id: 'sourceFileName',
    header: 'Source File',
    accessorFn: (row) => {
      const filePath = row.metadata?.sourceFile || '';
      return filePath.split('/').pop() || 'Unknown';
    },
    cell: ({ getValue }) => {
      const filename = getValue() as string;
      return <span className="font-mono text-sm">{filename}</span>;
    },
    size: 150,
    minSize: 100,
  },
  {
    id: 'lineNumber',
    header: 'Line',
    accessorFn: (row) => row.metadata?.line || 0,
    cell: ({ getValue }) => {
      const line = getValue() as number;
      return <span className="font-mono text-sm text-right block">{line}</span>;
    },
    size: 80,
    minSize: 60,
  },
  {
    id: 'contextLine',
    header: 'Context',
    accessorFn: (row) => row.metadata?.contextLine || '',
    cell: ({ getValue, row }) => {
      const contextLine = getValue() as string;
      const context = row.original.metadata?.context;
      return (
        <div className="flex flex-col">
          <span className="font-mono text-xs truncate">{contextLine}</span>
          {context && (
            <span className="text-foreground-muted text-xs">{context}</span>
          )}
        </div>
      );
    },
    size: 300,
    minSize: 200,
  },
];