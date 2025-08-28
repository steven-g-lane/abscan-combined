import { promises as fs } from 'fs';
import { join } from 'path';

interface StandardizedItem {
  name: string;
  icon: string;
  children?: StandardizedItem[];
  metadata?: any;
}

interface StandardizedData {
  items: StandardizedItem[];
  metadata: {
    aggregated_at: string;
    scan_root: string;
    file_system?: any;
    architecture?: any;
    dependencies?: any;
    classes?: any;
  };
}

function convertToStandardizedFormat(entry: any): StandardizedItem {
  return {
    name: entry.item_name || entry.name || 'Unknown',
    icon: entry.lucide_icon || entry.icon || 'folder',
    children: entry.children ? entry.children.map(convertToStandardizedFormat) : undefined,
    metadata: entry.metadata || extractMetadata(entry)
  };
}

function extractMetadata(entry: any): any {
  const metadata: any = {};
  
  // Preserve any non-standard properties as metadata
  Object.keys(entry).forEach(key => {
    if (!['item_name', 'name', 'lucide_icon', 'icon', 'children'].includes(key)) {
      metadata[key] = entry[key];
    }
  });
  
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

export async function aggregateData(outputDir: string): Promise<void> {
  const classMillerPath = join(outputDir, 'class-miller-columns.json');
  const millerPath = join(outputDir, 'miller-columns.json');
  const filesPath = join(outputDir, 'files.json');
  const architecturePath = join(outputDir, 'architecture.json');
  const dependenciesPath = join(outputDir, 'dependencies.json');
  const classesPath = join(outputDir, 'classes.json');
  const outputPath = join(outputDir, 'abscan.json');

  try {
    // Read all data files with graceful fallback
    const [classMillerData, millerData, filesData, architectureData, dependenciesData, classesData] = await Promise.all([
      readJsonFile(classMillerPath),
      readJsonFile(millerPath),
      readJsonFile(filesPath),
      readJsonFile(architecturePath),
      readJsonFile(dependenciesPath),
      readJsonFile(classesPath)
    ]);

    // Create standardized items array
    const items: StandardizedItem[] = [];

    // Add Classes entry from class-miller-columns.json if data exists
    if (classMillerData && classMillerData.column_entries) {
      const classesEntry = classMillerData.column_entries.find((entry: any) => entry.item_name === "Classes");
      if (classesEntry) {
        items.push(convertToStandardizedFormat(classesEntry));
      }
    }

    // Add Files entry from miller-columns.json if data exists
    if (millerData && millerData.column_entries) {
      const filesEntry = millerData.column_entries.find((entry: any) => entry.item_name === "Files");
      if (filesEntry) {
        items.push(convertToStandardizedFormat(filesEntry));
      }
    }

    // Create standardized data structure
    const standardizedData: StandardizedData = {
      items,
      metadata: {
        aggregated_at: new Date().toISOString(),
        scan_root: filesData?.root || architectureData?.projectRoot || 'unknown',
        file_system: filesData,
        architecture: architectureData,
        dependencies: dependenciesData,
        classes: classesData
      }
    };

    // Write standardized data
    await fs.writeFile(
      outputPath,
      JSON.stringify(standardizedData, null, 2),
      'utf8'
    );

    console.log(`Standardized data written to ${outputPath}`);
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