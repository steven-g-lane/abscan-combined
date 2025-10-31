/**
 * Utilities for formatting reference counts in various display contexts
 */

// Helper function to format reference counts as "direct/polymorphic"
export function formatReferenceCount(metadata: any): string {
  const direct = metadata?.directReferenceCount;
  const polymorphic = metadata?.polymorphicReferenceCount;
  const total = metadata?.referenceCount || 0;

  // If we have separate counts, display them in the format
  if (direct !== undefined && polymorphic !== undefined) {
    if (polymorphic === 0) {
      return direct.toLocaleString();
    } else if (direct === 0) {
      return `[${polymorphic.toLocaleString()}]`;
    } else {
      return `${direct.toLocaleString()}[${polymorphic.toLocaleString()}]`;
    }
  }

  // Fallback to total count for backward compatibility
  return total.toLocaleString();
}

// Helper function to format reference counts for miller column titles as "References (direct/polymorphic)"
export function formatMillerReferenceTitle(referenceCount: number, directCount?: number, polymorphicCount?: number): string {
  // If we have separate counts, display them in the format
  if (directCount !== undefined && polymorphicCount !== undefined) {
    let result: string;
    if (polymorphicCount === 0) {
      result = `References (${directCount.toLocaleString()})`;
    } else if (directCount === 0) {
      result = `References ([${polymorphicCount.toLocaleString()}])`;
    } else {
      result = `References (${directCount.toLocaleString()}[${polymorphicCount.toLocaleString()}])`;
    }

    return result;
  }

  // Fallback to total count for backward compatibility
  return `References (${referenceCount.toLocaleString()})`;
}

// Helper function for method/property reference titles with separate counts
export function formatMethodReferenceTitle(method: any): string {
  const total = method.references?.length || 0;
  const direct = method.directReferenceCount;
  const polymorphic = method.polymorphicReferenceCount;


  return formatMillerReferenceTitle(total, direct, polymorphic);
}

// Helper function for property reference titles with separate counts
export function formatPropertyReferenceTitle(property: any): string {
  const total = property.references?.length || 0;
  const direct = property.directReferenceCount;
  const polymorphic = property.polymorphicReferenceCount;

  return formatMillerReferenceTitle(total, direct, polymorphic);
}

// Helper function for class reference titles (no separate counts for class-level)
export function formatClassReferenceTitle(classData: any): string {
  const total = classData.references?.length || 0;
  return `References (${total.toLocaleString()})`;
}

// Helper function for function reference titles with separate counts
export function formatFunctionReferenceTitle(functionData: any): string {
  const total = functionData.references?.length || 0;
  const direct = functionData.directReferenceCount;
  const polymorphic = functionData.polymorphicReferenceCount;

  return formatMillerReferenceTitle(total, direct, polymorphic);
}