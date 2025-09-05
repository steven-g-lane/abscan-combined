import { promises as fs } from 'fs';
import { join } from 'path';
import { FileSystemResult } from '../scanner/fileSystemScanner';
import { ClassAnalysisResult, FunctionAnalysisResult } from '../models';
import { transformFileSystemToMillerColumns, loadIconMapping } from '../transformers/millerColumnsTransformer';
import { transformClassAnalysisToMillerColumns } from '../transformers/classMillerColumnsTransformer';
import { transformFunctionAnalysisToMillerColumns } from '../transformers/functionMillerColumnsTransformer';
import { MillerItem, MillerData, RawMillerItem, normalizeMillerItem } from '../../shared/types/miller';

function convertToStandardizedFormat(entry: RawMillerItem): MillerItem {
  return {
    name: entry.item_name || entry.name || 'Unknown',
    icon: entry.lucide_icon || entry.icon || 'folder',
    children: entry.children ? entry.children.map(convertToStandardizedFormat) : undefined,
    metadata: entry.metadata || extractMetadata(entry)
  };
}

function extractMetadata(entry: RawMillerItem): Record<string, unknown> | undefined {
  const metadata: Record<string, unknown> = {};
  
  // Preserve any non-standard properties as metadata
  Object.keys(entry).forEach(key => {
    if (!['item_name', 'name', 'lucide_icon', 'icon', 'children'].includes(key)) {
      metadata[key] = entry[key];
    }
  });
  
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

export async function aggregateData(
  outputDir: string, 
  fileSystemResult?: FileSystemResult,
  classAnalysisResult?: ClassAnalysisResult,
  functionAnalysisResult?: FunctionAnalysisResult,
  iconConfigPath?: string
): Promise<void> {
  const architecturePath = join(outputDir, 'architecture.json');
  const dependenciesPath = join(outputDir, 'dependencies.json');
  const outputPath = join(outputDir, 'abscan.json');

  try {
    // Read remaining data files with graceful fallback
    const [architectureData, dependenciesData] = await Promise.all([
      readJsonFile(architecturePath),
      readJsonFile(dependenciesPath)
    ]);

    // Create standardized items array
    const items: MillerItem[] = [];
    
    // Add Classes entry from in-memory class analysis if provided
    if (classAnalysisResult) {
      const classMillerColumnsResult = await transformClassAnalysisToMillerColumns(classAnalysisResult, fileSystemResult);
      if (classMillerColumnsResult && classMillerColumnsResult.column_entries) {
        const classesEntry = classMillerColumnsResult.column_entries.find((entry: RawMillerItem) => entry.item_name === "Classes");
        if (classesEntry) {
          items.push(convertToStandardizedFormat(classesEntry));
        }
      }
    }

    // Add Functions entry from in-memory function analysis if provided
    if (functionAnalysisResult) {
      const functionMillerColumnsResult = await transformFunctionAnalysisToMillerColumns(functionAnalysisResult, fileSystemResult);
      if (functionMillerColumnsResult && functionMillerColumnsResult.column_entries) {
        const functionsEntry = functionMillerColumnsResult.column_entries.find((entry: RawMillerItem) => entry.item_name === "Functions");
        if (functionsEntry) {
          items.push(convertToStandardizedFormat(functionsEntry));
        }
      }
    }

    // Add Files entry from in-memory file system data if provided
    if (fileSystemResult) {
      const iconMapping = await loadIconMapping(iconConfigPath);
      const millerColumnsResult = await transformFileSystemToMillerColumns(fileSystemResult, iconMapping);
      
      if (millerColumnsResult && millerColumnsResult.column_entries) {
        const filesEntry = millerColumnsResult.column_entries.find((entry: RawMillerItem) => entry.item_name === "Files");
        if (filesEntry) {
          items.push(convertToStandardizedFormat(filesEntry));
        }
      }
    }

    // Create clean navigation data structure
    const standardizedData: MillerData = {
      items
    };

    // Create comprehensive metadata
    const metadataPath = join(outputDir, 'metadata.json');
    const comprehensiveMetadata = {
      aggregated_at: new Date().toISOString(),
      scan_root: fileSystemResult?.root || architectureData?.projectRoot || 'unknown',
      architecture: architectureData,
      dependencies: dependenciesData,
      classes: classAnalysisResult,
      functions: functionAnalysisResult
    };

    // Write navigation data
    await fs.writeFile(
      outputPath,
      JSON.stringify(standardizedData, null, 2),
      'utf8'
    );

    // Write detailed metadata separately
    await fs.writeFile(
      metadataPath,
      JSON.stringify(comprehensiveMetadata, null, 2),
      'utf8'
    );

    console.log(`Standardized data written to ${outputPath}`);
    console.log(`Metadata written to ${metadataPath}`);
  } catch (error) {
    console.error('Error aggregating data:', error);
    throw error;
  }
}

async function readJsonFile(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Could not read ${filePath}:`, (error as Error).message);
    return null;
  }
}