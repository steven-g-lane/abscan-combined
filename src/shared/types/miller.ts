/**
 * Canonical types for Miller column data structures
 * Single source of truth to prevent shape drift and duplication
 */

export interface MillerItem {
  name: string;
  icon?: string;
  children?: MillerItem[];
  metadata?: unknown;
}

export interface MillerData {
  items: MillerItem[];
}

/**
 * Raw JSON structure from abscan CLI output
 * Used for type-safe transformation at ingestion boundary
 */
export interface RawMillerItem {
  item_name?: string;
  lucide_icon?: string;
  name?: string;
  icon?: string;
  children?: RawMillerItem[];
  metadata?: unknown;
  [key: string]: unknown; // Allow additional properties for transformation
}

export interface RawMillerData {
  items: RawMillerItem[];
}

/**
 * Transform raw JSON data to canonical MillerItem format
 */
export function normalizeMillerItem(raw: RawMillerItem): MillerItem {
  return {
    name: raw.name || raw.item_name || 'Unnamed Item',
    icon: raw.icon || raw.lucide_icon || 'folder',
    children: raw.children?.map(normalizeMillerItem),
    metadata: raw.metadata
  };
}

/**
 * Transform raw JSON data to canonical MillerData format
 */
export function normalizeMillerData(raw: RawMillerData): MillerData {
  return {
    items: raw.items.map(normalizeMillerItem)
  };
}