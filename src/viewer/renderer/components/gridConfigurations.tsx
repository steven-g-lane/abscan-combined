import React from 'react';
import { Folder, icons } from 'lucide-react';
import { GridColumnConfig } from './ChildItemsGrid';
import TruncatedTextWithTooltip from './TruncatedTextWithTooltip';

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
  const iconName = item.icon || (item as any).lucide_icon || 'folder';
  
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
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5">
            {renderFileIcon(item)}
          </span>
          <TruncatedTextWithTooltip text={name} maxLength={40} className="">
            <span className="break-words whitespace-normal leading-relaxed flex-1 min-w-0">{name}</span>
          </TruncatedTextWithTooltip>
          {item.metadata?.isSymlink && (
            <TruncatedTextWithTooltip
              text={item.metadata.symlinkTarget || ''}
              maxLength={20}
              className="text-foreground-muted text-xs"
            >
              <span className="text-foreground-muted text-xs truncate">→ {item.metadata.symlinkTarget}</span>
            </TruncatedTextWithTooltip>
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
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5">
            {renderFileIcon(item)}
          </span>
          <TruncatedTextWithTooltip text={name} maxLength={50} className="">
            <span className="break-words whitespace-normal leading-relaxed flex-1 min-w-0">{name}</span>
          </TruncatedTextWithTooltip>
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
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5">
            {renderFileIcon(item)}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-medium break-words whitespace-normal leading-relaxed">{name}</span>
            {item.metadata?.isLocal === false && (
              <span className="text-foreground-muted text-xs block">(imported)</span>
            )}
          </div>
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
        <span className="font-mono text-sm break-words whitespace-normal leading-relaxed">{filename}</span>;
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

// Method grid configuration for Methods section (Issue #72: Name, Parameters, Source LOC, Reference Count)
export const methodGridColumns: GridColumnConfig<MethodGridItem>[] = [
  {
    id: 'methodName',
    header: 'Name',
    accessorFn: (row) => {
      return row.metadata?.methodName || row.name || row.item_name || 'Unknown';
    },
    cell: ({ row }) => {
      const item = row.original;
      const methodName = item.metadata?.methodName || item.name || item.item_name || 'Unknown';

      return (
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5">
            {renderFileIcon(item)}
          </span>
          <span className="font-mono text-sm break-words whitespace-normal leading-relaxed flex-1 min-w-0">{methodName}</span>
        </div>
      );
    },
    size: 200,
    minSize: 150,
  },
  {
    id: 'parameters',
    header: 'Parameters',
    accessorFn: (row) => {
      const method = row.metadata?.method;
      const parameters = method?.parameters || [];

      if (parameters.length === 0) {
        return '()';
      }

      // Create readable parameter format: (className: string, methodName: string)
      const paramStr = parameters.map(p => {
        let param = p.name || 'param';
        if (p.displayType) {
          param += `: ${p.displayType}`;
        }
        if (p.optional) {
          param += '?';
        }
        if (p.isRest) {
          param = `...${param}`;
        }
        return param;
      }).join(', ');

      return `(${paramStr})`;
    },
    cell: ({ getValue }) => {
      const parameters = getValue() as string;
      return (
        <span className="font-mono text-sm break-words whitespace-normal leading-relaxed">{parameters}</span>
      );
    },
    size: 250,
    minSize: 180,
  },
  {
    id: 'sourceLOC',
    header: 'Source LOC',
    accessorFn: (row) => {
      const method = row.metadata?.method;
      if (!method?.location) return 1;
      return (method.location.endLine || method.location.line) - method.location.line + 1;
    },
    cell: ({ getValue }) => {
      const lineCount = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {lineCount.toLocaleString()}
        </span>
      );
    },
    size: 100,
    minSize: 80,
  },
  {
    id: 'referenceCount',
    header: 'Reference Count',
    accessorFn: (row) => {
      const method = row.metadata?.method;
      return method?.referenceCount || 0;
    },
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {count.toLocaleString()}
        </span>
      );
    },
    size: 120,
    minSize: 100,
  },
];

// Helper function to create simplified signature from parameters
const createSimplifiedSignature = (name: string, parameters: any[]): string => {
  if (!parameters || parameters.length === 0) {
    return `${name}()`;
  }
  
  const paramNames = parameters.map(param => {
    let paramName = param.name || 'param';
    
    // Add optional marker
    if (param.optional) {
      paramName += '?';
    }
    
    // Add rest parameter marker
    if (param.isRest) {
      paramName = `...${paramName}`;
    }
    
    return paramName;
  }).join(', ');
  
  return `${name}(${paramNames})`;
};

// Property grid item interface for Properties section display
interface PropertyGridItem {
  name?: string;
  item_name?: string;
  children?: PropertyGridItem[];
  metadata?: {
    type: string;
    sourceFile: string;
    startLine: number;
    endLine?: number;
    propertyName: string;
    property: any; // Full property data
  };
  icon?: string;
}

// Property grid configuration for Properties section
export const propertyGridColumns: GridColumnConfig<PropertyGridItem>[] = [
  {
    id: 'propertyName',
    header: 'Property Name',
    accessorFn: (row) => {
      return row.metadata?.propertyName || row.name || row.item_name || 'Unknown';
    },
    cell: ({ row }) => {
      const item = row.original;
      const propertyName = item.metadata?.propertyName || item.name || item.item_name || 'Unknown';
      
      return (
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5">
            {renderFileIcon(item)}
          </span>
          <span className="truncate font-mono text-sm">{propertyName}</span>
        </div>
      );
    },
    size: 200,
    minSize: 150,
  },
  {
    id: 'propertyType',
    header: 'Type',
    accessorFn: (row) => {
      const property = row.metadata?.property;
      return property?.displayType || property?.type || 'unknown';
    },
    cell: ({ getValue }) => {
      const type = getValue() as string;
      return (
        <span className="truncate font-mono text-sm">{type}</span>
      );
    },
    size: 150,
    minSize: 100,
  },
  {
    id: 'visibility',
    header: 'Visibility',
    accessorFn: (row) => {
      const property = row.metadata?.property;
      return property?.visibility || 'public';
    },
    cell: ({ getValue }) => {
      const visibility = getValue() as string;
      return (
        <span className="font-mono text-sm">{visibility}</span>
      );
    },
    size: 100,
    minSize: 80,
  },
  {
    id: 'referenceCount',
    header: 'References',
    accessorFn: (row) => {
      const property = row.metadata?.property;
      return property?.referenceCount || 0;
    },
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {count > 0 ? count.toLocaleString() : '0'}
        </span>
      );
    },
    size: 100,
    minSize: 80,
  },
];

// Interface Function grid item interface for interface Functions section display
interface InterfaceFunctionGridItem {
  name?: string;
  item_name?: string;
  children?: InterfaceFunctionGridItem[];
  metadata?: {
    functionName?: string;
    methodName?: string;
    propertyName?: string;
    function?: {
      name: string;
      signature: string;
      parameters?: any[];
      returnType?: string;
      referenceCount?: number;
    };
    method?: {
      name: string;
      parameters?: any[];
      returnType?: string;
      referenceCount?: number;
    };
    property?: {
      name: string;
      type?: string;
      referenceCount?: number;
    };
    type?: string;
  };
  icon?: string;
}

// Interface Function grid configuration for interface Functions section
export const interfaceFunctionGridColumns: GridColumnConfig<InterfaceFunctionGridItem>[] = [
  {
    id: 'functionName',
    header: 'Name',
    accessorFn: (row) => {
      return row.metadata?.functionName || row.metadata?.methodName || row.metadata?.propertyName || row.name || row.item_name || 'Unknown';
    },
    cell: ({ getValue, row }) => {
      const name = getValue() as string;
      const icon = renderFileIcon(row.original as any);
      return (
        <div className="flex items-start gap-2">
          {icon}
          <span className="font-mono text-sm">{name}</span>
        </div>
      );
    },
    size: 150,
    minSize: 120,
  },
  {
    id: 'signature',
    header: 'Params & Return Type',
    accessorFn: (row) => {
      const method = row.metadata?.method;
      const func = row.metadata?.function;
      const property = row.metadata?.property;

      if (method && method.parameters) {
        // For actual method signatures: methodName(param1: type, param2?: type) => returnType
        const params = method.parameters.map(p =>
          `${p.name}${p.optional ? '?' : ''}: ${p.type || 'any'}`
        ).join(', ');
        return `(${params}) => ${method.returnType || 'void'}`;
      } else if (func && func.signature) {
        // For function objects with pre-built signatures
        return func.signature;
      } else if (property && property.type) {
        // For function-type properties: extract signature from type
        return property.type;
      }

      return '() => void';
    },
    cell: ({ getValue }) => {
      const signature = getValue() as string;
      return (
        <TruncatedTextWithTooltip text={signature} maxLength={70} className="font-mono text-sm">
          <span className="truncate font-mono text-sm">{signature}</span>
        </TruncatedTextWithTooltip>
      );
    },
    size: 300,
    minSize: 200,
    truncation: { enabled: true, maxLength: 70 },
  },
  {
    id: 'referenceCount',
    header: 'References',
    accessorFn: (row) => {
      const method = row.metadata?.method;
      const func = row.metadata?.function;
      const property = row.metadata?.property;
      
      return method?.referenceCount || func?.referenceCount || property?.referenceCount || 0;
    },
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {count > 0 ? count.toLocaleString() : '0'}
        </span>
      );
    },
    size: 100,
    minSize: 80,
  },
];

// Function grid item interface for Functions section display
interface FunctionGridItem {
  name?: string;
  item_name?: string;
  children?: FunctionGridItem[];
  metadata?: {
    type?: string;
    name?: string;
    sourceFile?: string;
    sourceFilename?: string;
    sourceLOC?: number;
    referenceCount?: number;
    isExported?: boolean;
    // For full function metadata
    parameters?: any[];
    location?: {
      line: number;
      endLine?: number;
    };
  };
  icon?: string;
}

// Function grid configuration for Functions section (simplified signatures)
export const functionsGridColumns: GridColumnConfig<FunctionGridItem>[] = [
  {
    id: 'functionSignature',
    header: 'Simplified Signature',
    accessorFn: (row) => {
      const name = row.metadata?.name || row.name || row.item_name || 'Unknown';
      const parameters = row.metadata?.parameters || [];
      return createSimplifiedSignature(name, parameters);
    },
    cell: ({ row }) => {
      const item = row.original;
      const name = item.metadata?.name || item.name || item.item_name || 'Unknown';
      const parameters = item.metadata?.parameters || [];
      const signature = createSimplifiedSignature(name, parameters);

      return (
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5">
            {renderFileIcon(item)}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-sm break-words whitespace-normal leading-relaxed">{signature}</span>
            {item.metadata?.isExported && (
              <span className="text-foreground-muted text-xs block">(exported)</span>
            )}
          </div>
        </div>
      );
    },
    size: 200,
    minSize: 150,
  },
  {
    id: 'sourceFile',
    header: 'Source File',
    accessorFn: (row) => {
      const sourceFile = row.metadata?.sourceFile || row.metadata?.sourceFilename || '';
      return sourceFile.split('/').pop() || '-';
    },
    cell: ({ getValue }) => {
      const filename = getValue() as string;
      return filename === '-' ?
        <span className="text-foreground-muted">-</span> :
        <span className="font-mono text-sm break-words whitespace-normal leading-relaxed">{filename}</span>;
    },
    size: 150,
    minSize: 100,
  },
  {
    id: 'lineCount',
    header: 'Line Count',
    accessorFn: (row) => {
      if (row.metadata?.sourceLOC) {
        return row.metadata.sourceLOC;
      }
      
      // Calculate from location if available
      const location = row.metadata?.location;
      if (location && location.endLine) {
        return location.endLine - location.line + 1;
      }
      
      return 1; // Default to 1 line
    },
    cell: ({ getValue }) => {
      const lineCount = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {lineCount}
        </span>
      );
    },
    size: 100,
    minSize: 80,
  },
  {
    id: 'referenceCount',
    header: 'Reference Count',
    accessorFn: (row) => {
      return row.metadata?.referenceCount || 0;
    },
    cell: ({ getValue }) => {
      const refCount = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {refCount}
        </span>
      );
    },
    size: 100,
    minSize: 80,
  },
];

// Component grid item interface for React Components section
interface ComponentGridItem {
  name?: string;
  item_name?: string;
  children?: ComponentGridItem[];
  metadata?: {
    name: string;
    sourceFilename: string;
    sourceLOC?: number;
    isExported?: boolean;
    // Note: referenceCount is intentionally omitted as per requirements
  };
  icon?: string;
}

// Component grid configuration for Components section (only 3 columns: Signature, Source File, Line Count)
export const componentsGridColumns: GridColumnConfig<ComponentGridItem>[] = [
  {
    id: 'componentName',
    header: 'Signature',
    accessorFn: (row) => {
      return row.metadata?.name || row.name || row.item_name || 'Unknown';
    },
    cell: ({ row }) => {
      const item = row.original;
      const name = item.metadata?.name || item.name || item.item_name || 'Unknown';
      
      return (
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5">
            {renderFileIcon(item)}
          </span>
          <span className="font-mono text-sm break-words whitespace-normal leading-relaxed">{name}</span>
          {item.metadata?.isExported && (
            <span className="text-foreground-muted text-xs ml-2">(exported)</span>
          )}
        </div>
      );
    },
    size: 300,
    minSize: 200,
  },
  {
    id: 'sourceFile',
    header: 'Source File',
    accessorFn: (row) => {
      const sourceFile = row.metadata?.sourceFilename || '';
      return sourceFile || '-';
    },
    cell: ({ getValue }) => {
      const filename = getValue() as string;
      return filename === '-' ? 
        <span className="text-foreground-muted">-</span> : 
        <span className="font-mono text-sm break-words whitespace-normal leading-relaxed">{filename}</span>;
    },
    size: 150,
    minSize: 100,
  },
  {
    id: 'lineCount',
    header: 'Line Count',
    accessorFn: (row) => {
      return row.metadata?.sourceLOC || 1;
    },
    cell: ({ getValue }) => {
      const lineCount = getValue() as number;
      return (
        <span className="font-mono text-sm text-right block">
          {lineCount}
        </span>
      );
    },
    size: 100,
    minSize: 80,
  },
  // Note: No reference count column as per story requirements
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
          <TruncatedTextWithTooltip text={contextLine} maxLength={80} className="font-mono text-xs">
            <span className="font-mono text-xs truncate">{contextLine}</span>
          </TruncatedTextWithTooltip>
          {context && (
            <TruncatedTextWithTooltip text={context} maxLength={60} className="text-foreground-muted text-xs">
              <span className="text-foreground-muted text-xs truncate">{context}</span>
            </TruncatedTextWithTooltip>
          )}
        </div>
      );
    },
    size: 300,
    minSize: 200,
  },
];

// Class reference grid item interface
interface ClassReferenceGridItem {
  name?: string;
  item_name?: string;
  children?: ClassReferenceGridItem[];
  metadata?: {
    type: string;
    sourceFile: string;
    line: number;
    contextLine?: string;
    context?: string;
    referenceIndex?: number;
  };
  icon?: string;
}

// Class reference grid configuration for References section
export const classReferenceGridColumns: GridColumnConfig<ClassReferenceGridItem>[] = [
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
          <TruncatedTextWithTooltip text={contextLine} maxLength={80} className="font-mono text-xs">
            <span className="font-mono text-xs truncate">{contextLine}</span>
          </TruncatedTextWithTooltip>
          {context && (
            <TruncatedTextWithTooltip text={context} maxLength={60} className="text-foreground-muted text-xs">
              <span className="text-foreground-muted text-xs truncate">{context}</span>
            </TruncatedTextWithTooltip>
          )}
        </div>
      );
    },
    size: 300,
    minSize: 200,
  },
];

// Interface summary grid item interface
interface InterfaceSummaryGridItem {
  name?: string;
  item_name?: string;
  children?: InterfaceSummaryGridItem[];
  metadata?: {
    name: string;
    sourceFilename: string;
    sourceLOC: number;
    referenceCount: number;
    isLocal: boolean;
  };
  icon?: string;
}

// Interface summary grid configuration for Interfaces section
export const interfaceSummaryGridColumns: GridColumnConfig<InterfaceSummaryGridItem>[] = [
  {
    id: 'interfaceName',
    header: 'Name',
    accessorFn: (row) => row.metadata?.name || row.name || row.item_name || 'Unknown',
    cell: ({ getValue, row }) => {
      const name = getValue() as string;
      const icon = renderFileIcon(row.original as any);
      return (
        <div className="flex items-start gap-2">
          {icon}
          <span className="font-mono text-sm">{name}</span>
        </div>
      );
    },
    size: 200,
    minSize: 150,
  },
  {
    id: 'sourceFilename',
    header: 'Source File',
    accessorFn: (row) => row.metadata?.sourceFilename || 'Unknown',
    cell: ({ getValue }) => {
      const filename = getValue() as string;
      return <span className="font-mono text-sm">{filename}</span>;
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
      return <span className="font-mono text-sm text-right block">{loc.toLocaleString()}</span>;
    },
    size: 100,
    minSize: 80,
  },
  {
    id: 'referenceCount',
    header: 'References',
    accessorFn: (row) => row.metadata?.referenceCount || 0,
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return (
        <div className="flex items-center justify-end">
          <span className="font-mono text-sm">{count.toLocaleString()}</span>
        </div>
      );
    },
    size: 100,
    minSize: 80,
  },
];

// Interface reference grid item interface
interface InterfaceReferenceGridItem {
  name?: string;
  item_name?: string;
  children?: InterfaceReferenceGridItem[];
  metadata?: {
    type: string;
    sourceFile: string;
    line: number;
    contextLine?: string;
    context?: string;
    referenceIndex?: number;
  };
  icon?: string;
}

// Interface reference grid configuration for References section
export const interfaceReferenceGridColumns: GridColumnConfig<InterfaceReferenceGridItem>[] = [
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
          <TruncatedTextWithTooltip text={contextLine} maxLength={80} className="font-mono text-xs">
            <span className="font-mono text-xs truncate">{contextLine}</span>
          </TruncatedTextWithTooltip>
          {context && (
            <TruncatedTextWithTooltip text={context} maxLength={60} className="text-foreground-muted text-xs">
              <span className="text-foreground-muted text-xs truncate">{context}</span>
            </TruncatedTextWithTooltip>
          )}
        </div>
      );
    },
    size: 300,
    minSize: 200,
  },
];

// Enum summary grid item interface
interface EnumSummaryGridItem {
  name?: string;
  item_name?: string;
  children?: EnumSummaryGridItem[];
  metadata?: {
    name: string;
    sourceFilename: string;
    sourceLOC: number;
    referenceCount: number;
    isLocal: boolean;
  };
  icon?: string;
}

// Enum summary grid configuration for Enums section
export const enumSummaryGridColumns: GridColumnConfig<EnumSummaryGridItem>[] = [
  {
    id: 'enumName',
    header: 'Name',
    accessorFn: (row) => row.metadata?.name || row.name || row.item_name || 'Unknown',
    cell: ({ getValue, row }) => {
      const name = getValue() as string;
      const icon = renderFileIcon(row.original as any);
      return (
        <div className="flex items-start gap-2">
          {icon}
          <span className="font-mono text-sm">{name}</span>
        </div>
      );
    },
    size: 200,
    minSize: 150,
  },
  {
    id: 'sourceFilename',
    header: 'Source File',
    accessorFn: (row) => row.metadata?.sourceFilename || 'Unknown',
    cell: ({ getValue }) => {
      const filename = getValue() as string;
      return <span className="font-mono text-sm">{filename}</span>;
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
      return <span className="font-mono text-sm text-right block">{loc.toLocaleString()}</span>;
    },
    size: 100,
    minSize: 80,
  },
  {
    id: 'referenceCount',
    header: 'References',
    accessorFn: (row) => row.metadata?.referenceCount || 0,
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return (
        <div className="flex items-center justify-end">
          <span className="font-mono text-sm">{count.toLocaleString()}</span>
        </div>
      );
    },
    size: 100,
    minSize: 80,
  },
];

// Enum reference grid item interface
interface EnumReferenceGridItem {
  name?: string;
  item_name?: string;
  children?: EnumReferenceGridItem[];
  metadata?: {
    type: string;
    sourceFile: string;
    line: number;
    contextLine?: string;
    context?: string;
    referenceIndex?: number;
  };
  icon?: string;
}

// Enum reference grid configuration for References section
export const enumReferenceGridColumns: GridColumnConfig<EnumReferenceGridItem>[] = [
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
          <TruncatedTextWithTooltip text={contextLine} maxLength={80} className="font-mono text-xs">
            <span className="font-mono text-xs truncate">{contextLine}</span>
          </TruncatedTextWithTooltip>
          {context && (
            <TruncatedTextWithTooltip text={context} maxLength={60} className="text-foreground-muted text-xs">
              <span className="text-foreground-muted text-xs truncate">{context}</span>
            </TruncatedTextWithTooltip>
          )}
        </div>
      );
    },
    size: 300,
    minSize: 200,
  },
];
// Type summary grid item interface
interface TypeSummaryGridItem {
  name?: string;
  item_name?: string;
  children?: TypeSummaryGridItem[];
  metadata?: {
    name: string;
    sourceFilename: string;
    sourceLOC: number;
    referenceCount: number;
    isLocal: boolean;
    typeDefinition?: string;
  };
  icon?: string;
}

// Type summary grid configuration for Types section
export const typeSummaryGridColumns: GridColumnConfig<TypeSummaryGridItem>[] = [
  {
    id: "typeName",
    header: "Name",
    accessorFn: (row) => row.metadata?.name || row.name || row.item_name || "Unknown",
    cell: ({ getValue, row }) => {
      const name = getValue() as string;
      const icon = renderFileIcon(row.original as any);
      return (
        <div className="flex items-start gap-2">
          {icon}
          <span className="font-mono text-sm">{name}</span>
        </div>
      );
    },
    size: 200,
    minSize: 150,
  },
  {
    id: "sourceFilename",
    header: "Source File",
    accessorFn: (row) => row.metadata?.sourceFilename || "Unknown",
    cell: ({ getValue }) => {
      const filename = getValue() as string;
      return <span className="font-mono text-sm">{filename}</span>;
    },
    size: 150,
    minSize: 100,
  },
  {
    id: "sourceLOC",
    header: "Source LOC",
    accessorFn: (row) => row.metadata?.sourceLOC || 0,
    cell: ({ getValue }) => {
      const loc = getValue() as number;
      return <span className="font-mono text-sm text-right block">{loc.toLocaleString()}</span>;
    },
    size: 100,
    minSize: 80,
  },
  {
    id: "referenceCount",
    header: "References",
    accessorFn: (row) => row.metadata?.referenceCount || 0,
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return (
        <div className="flex items-center justify-end">
          <span className="font-mono text-sm">{count.toLocaleString()}</span>
        </div>
      );
    },
    size: 100,
    minSize: 80,
  },
];

// Type reference grid item interface
interface TypeReferenceGridItem {
  name?: string;
  item_name?: string;
  children?: TypeReferenceGridItem[];
  metadata?: {
    type: string;
    sourceFile: string;
    line: number;
    contextLine?: string;
    context?: string;
    referenceIndex?: number;
  };
  icon?: string;
}

// Type reference grid configuration for References section
export const typeReferenceGridColumns: GridColumnConfig<TypeReferenceGridItem>[] = [
  {
    id: "sourceFileName",
    header: "Source File",
    accessorFn: (row) => {
      const filePath = row.metadata?.sourceFile || "";
      return filePath.split("/").pop() || "Unknown";
    },
    cell: ({ getValue }) => {
      const filename = getValue() as string;
      return <span className="font-mono text-sm">{filename}</span>;
    },
    size: 150,
    minSize: 100,
  },
  {
    id: "lineNumber",
    header: "Line",
    accessorFn: (row) => row.metadata?.line || 0,
    cell: ({ getValue }) => {
      const line = getValue() as number;
      return <span className="font-mono text-sm text-right block">{line}</span>;
    },
    size: 80,
    minSize: 60,
  },
  {
    id: "contextLine",
    header: "Context",
    accessorFn: (row) => row.metadata?.contextLine || "",
    cell: ({ getValue, row }) => {
      const contextLine = getValue() as string;
      const context = row.original.metadata?.context;
      return (
        <div className="flex flex-col">
          <TruncatedTextWithTooltip text={contextLine} maxLength={80} className="font-mono text-xs">
            <span className="font-mono text-xs truncate">{contextLine}</span>
          </TruncatedTextWithTooltip>
          {context && (
            <TruncatedTextWithTooltip text={context} maxLength={60} className="text-foreground-muted text-xs">
              <span className="text-foreground-muted text-xs truncate">{context}</span>
            </TruncatedTextWithTooltip>
          )}
        </div>
      );
    },
    size: 300,
    minSize: 200,
  },
];
