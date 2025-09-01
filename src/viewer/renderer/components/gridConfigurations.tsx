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