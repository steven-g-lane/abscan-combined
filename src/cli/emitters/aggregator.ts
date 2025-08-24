import { promises as fs } from 'fs';
import { join } from 'path';

interface MillerColumnsEntry {
  item_name: string;
  lucide_icon: string;
  children: any[];
}

interface MillerColumnsData {
  column_entries: MillerColumnsEntry[];
}

interface AggregatedData {
  // UI-friendly Miller columns for visualization
  miller_columns: MillerColumnsData;
  
  // Raw comprehensive data
  file_system: any;
  architecture: any;
  dependencies: any;
  classes: any;
  
  // Metadata
  aggregated_at: string;
  scan_root: string;
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

    // Create Miller columns structure
    const millerColumns: MillerColumnsData = {
      column_entries: []
    };

    // Add Classes entry from class-miller-columns.json if data exists
    if (classMillerData && classMillerData.column_entries) {
      const classesEntry = classMillerData.column_entries.find((entry: any) => entry.item_name === "Classes");
      if (classesEntry) {
        millerColumns.column_entries.push(classesEntry);
      }
    }

    // Add Files entry from miller-columns.json if data exists
    if (millerData && millerData.column_entries) {
      const filesEntry = millerData.column_entries.find((entry: any) => entry.item_name === "Files");
      if (filesEntry) {
        millerColumns.column_entries.push(filesEntry);
      }
    }

    // Create comprehensive aggregated structure
    const aggregatedData: AggregatedData = {
      miller_columns: millerColumns,
      file_system: filesData,
      architecture: architectureData,
      dependencies: dependenciesData,
      classes: classesData,
      aggregated_at: new Date().toISOString(),
      scan_root: filesData?.root || architectureData?.projectRoot || 'unknown'
    };

    // Write aggregated data
    await fs.writeFile(
      outputPath,
      JSON.stringify(aggregatedData, null, 2),
      'utf8'
    );

    console.log(`Aggregated data written to ${outputPath}`);
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