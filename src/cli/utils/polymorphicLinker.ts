import { ClassAnalysisResult, InterfaceAnalysisResult, MethodReference } from '../models';

/**
 * Cross-links interface method calls to implementing class methods
 * This enables complete polymorphic call visibility in the UI
 */
export function linkPolymorphicReferences(
  classResult: ClassAnalysisResult,
  interfaceResult: InterfaceAnalysisResult
): void {
  console.log('🔗=== STARTING POLYMORPHIC REFERENCE CROSS-LINKING ===');
  console.log(`📊 Input: ${classResult.classes.length} classes, ${interfaceResult.interfaces.length} interfaces`);

  // Critical empty checks
  if (classResult.classes.length === 0) {
    console.log('🚨 CRITICAL: No classes found in classResult - this should not happen if classes were analyzed');
  }
  if (interfaceResult.interfaces.length === 0) {
    console.log('🚨 CRITICAL: No interfaces found in interfaceResult - this should not happen if interfaces were analyzed');
  }

  // Step 1: Extract interface method calls
  console.log('\n📋 STEP 1: Extracting interface method calls...');
  const interfaceMethodCalls = extractInterfaceMethodCalls(interfaceResult);
  console.log(`📋 Found ${interfaceMethodCalls.length} interface method calls to link`);

  // Critical check: if we have interfaces but no method calls
  if (interfaceResult.interfaces.length > 0 && interfaceMethodCalls.length === 0) {
    console.log('🚨 SUSPICIOUS: We have interfaces but no interface method calls - interface methods might not have references when they should');
  }

  for (const call of interfaceMethodCalls) {
    console.log(`  🔍 ${call.interfaceName}.${call.methodName} has ${call.references.length} call sites:`);
    for (const ref of call.references) {
      console.log(`    📍 ${ref.location.file}:${ref.location.line} (${ref.context})`);
    }
  }

  // Step 2: Find implementing classes for each interface
  console.log('\n🏗️  STEP 2: Finding implementations...');
  const implementations = findImplementations(classResult);
  console.log(`🏗️  Found ${Object.keys(implementations).length} interfaces with implementations`);

  // Critical check: if we have classes but no implementations found
  const classesWithImplements = classResult.classes.filter(c => c.isLocal && c.implements && c.implements.length > 0);
  if (classesWithImplements.length > 0 && Object.keys(implementations).length === 0) {
    console.log('🚨 CRITICAL: We have classes with implements[] but no implementations found - implements detection is broken');
    console.log(`🔍 Classes with implements: ${classesWithImplements.map(c => `${c.name} implements [${c.implements?.join(', ')}]`).join(', ')}`);
  }

  for (const [interfaceName, impls] of Object.entries(implementations)) {
    console.log(`  🔗 ${interfaceName} implemented by: ${impls.map(impl => impl.name).join(', ')}`);
  }

  // Step 3: Cross-link references
  console.log('\n➕ STEP 3: Cross-linking references...');
  let linksAdded = 0;
  let linksAttempted = 0;
  let methodsNotFound = 0;

  for (const { interfaceName, methodName, references } of interfaceMethodCalls) {
    console.log(`\n  🔄 Processing ${interfaceName}.${methodName}...`);
    const implementingClasses = implementations[interfaceName] || [];
    console.log(`    👥 Found ${implementingClasses.length} implementing classes`);

    // Critical check: interface method calls but no implementing classes
    if (implementingClasses.length === 0) {
      console.log(`🚨 PROBLEM: Interface ${interfaceName} has method calls but no implementing classes found`);
      console.log(`🔍 This means either: 1) No classes implement this interface, or 2) Interface/class name mismatch`);
    }

    for (const implementingClass of implementingClasses) {
      console.log(`    🎯 Checking ${implementingClass.name} for method ${methodName}...`);

      const targetMethod = findMethodInClass(implementingClass, methodName);
      if (targetMethod) {
        console.log(`    ✅ Found method ${implementingClass.name}.${methodName}`);
        console.log(`    📊 Current references: ${(targetMethod.references || []).length}`);

        // Add interface references as polymorphic calls
        const polymorphicRefs: MethodReference[] = references.map(ref => ({
          ...ref,
          context: 'polymorphic_call'
        }));

        targetMethod.references = targetMethod.references || [];
        const beforeCount = targetMethod.references.length;
        targetMethod.references.push(...polymorphicRefs);
        targetMethod.referenceCount = targetMethod.references.length;
        const afterCount = targetMethod.references.length;

        linksAdded += polymorphicRefs.length;
        linksAttempted += 1;

        console.log(`    ➕ Added ${polymorphicRefs.length} polymorphic references (${beforeCount} → ${afterCount})`);
        console.log(`    🔗 Link: ${interfaceName}.${methodName} → ${implementingClass.name}.${methodName}`);
      } else {
        methodsNotFound++;
        console.log(`    🚨 PROBLEM: Method ${methodName} not found in ${implementingClass.name}`);
        console.log(`    🔍 This could mean: 1) Method name mismatch, 2) Class doesn't actually implement the method, 3) Method detection failed`);
        console.log(`    📝 Available methods: ${(implementingClass.methods || []).map((m: any) => m.name).join(', ')}`);
      }
    }
  }

  console.log(`\n✅=== POLYMORPHIC CROSS-LINKING COMPLETE ===`);
  console.log(`📊 Summary: ${linksAdded} polymorphic references added across ${linksAttempted} method links`);

  // Final critical checks
  if (interfaceMethodCalls.length > 0 && linksAdded === 0) {
    console.log(`🚨 CRITICAL FAILURE: We had ${interfaceMethodCalls.length} interface method calls but added 0 polymorphic links`);
    console.log(`🔍 This indicates a serious problem in the linking logic`);
  }

  if (methodsNotFound > 0) {
    console.log(`⚠️  WARNING: ${methodsNotFound} expected methods were not found in implementing classes`);
  }

  console.log(`🔗=== END POLYMORPHIC REFERENCE CROSS-LINKING ===\n`);
}

/**
 * Extract all interface method calls that should be linked to implementations
 */
function extractInterfaceMethodCalls(interfaceResult: InterfaceAnalysisResult): Array<{
  interfaceName: string;
  methodName: string;
  references: MethodReference[];
}> {
  console.log('  🔍 Scanning interfaces for method calls...');
  const result: Array<{
    interfaceName: string;
    methodName: string;
    references: MethodReference[];
  }> = [];

  let localInterfaceCount = 0;
  let interfacesWithMethods = 0;
  let methodsWithReferences = 0;

  for (const interfaceData of interfaceResult.interfaces) {
    console.log(`    🔎 Checking interface: ${interfaceData.name} (local: ${interfaceData.isLocal})`);

    // Skip non-local interfaces (imported ones)
    if (!interfaceData.isLocal) {
      console.log(`    ⏭️  Skipping non-local interface: ${interfaceData.name}`);
      continue;
    }

    localInterfaceCount++;

    if (interfaceData.methods) {
      if (interfaceData.methods.length > 0) {
        interfacesWithMethods++;
      }
      console.log(`    📋 Interface ${interfaceData.name} has ${interfaceData.methods.length} methods`);

      for (const method of interfaceData.methods) {
        const refCount = method.references ? method.references.length : 0;
        console.log(`      🔧 Method ${method.name}: ${refCount} references`);

        if (method.references && method.references.length > 0) {
          methodsWithReferences++;
          result.push({
            interfaceName: interfaceData.name,
            methodName: method.name,
            references: method.references
          });
          console.log(`      ✅ Added ${interfaceData.name}.${method.name} to linking queue`);
        } else {
          console.log(`      🚨 SUSPICIOUS: Method ${interfaceData.name}.${method.name} has no references - might be called but not detected`);
        }
      }
    } else {
      console.log(`    🚨 PROBLEM: Interface ${interfaceData.name} has no methods array - this is unusual for a real interface`);
    }
  }

  console.log(`  📊 Interface scan summary:`);
  console.log(`    - Local interfaces: ${localInterfaceCount}`);
  console.log(`    - Interfaces with methods: ${interfacesWithMethods}`);
  console.log(`    - Methods with references: ${methodsWithReferences}`);
  console.log(`  ✅ Extracted ${result.length} interface method calls`);

  return result;
}

/**
 * Build a map of interface name -> implementing classes
 */
function findImplementations(classResult: ClassAnalysisResult): Record<string, any[]> {
  console.log('  🏗️  Building implementation map...');
  const implementations: Record<string, any[]> = {};

  let localClassCount = 0;
  let classesWithImplements = 0;

  for (const classData of classResult.classes) {
    console.log(`    🔎 Checking class: ${classData.name} (local: ${classData.isLocal})`);

    // Skip non-local classes
    if (!classData.isLocal) {
      console.log(`    ⏭️  Skipping non-local class: ${classData.name}`);
      continue;
    }

    localClassCount++;

    if (classData.implements) {
      if (classData.implements.length > 0) {
        classesWithImplements++;
      }
      console.log(`    🔗 Class ${classData.name} implements: [${classData.implements.join(', ')}]`);

      for (const interfaceName of classData.implements) {
        if (!implementations[interfaceName]) {
          implementations[interfaceName] = [];
          console.log(`    🆕 Created implementation list for interface: ${interfaceName}`);
        }
        implementations[interfaceName].push(classData);
        console.log(`    ➕ Added ${classData.name} as implementation of ${interfaceName}`);
      }
    } else {
      console.log(`    📝 Class ${classData.name} implements no interfaces (implements array is null/undefined)`);
    }
  }

  console.log(`  📊 Class scan summary:`);
  console.log(`    - Local classes: ${localClassCount}`);
  console.log(`    - Classes with implements: ${classesWithImplements}`);
  console.log(`  ✅ Built implementation map for ${Object.keys(implementations).length} interfaces`);

  // Critical check
  if (localClassCount > 0 && classesWithImplements === 0) {
    console.log(`🚨 CRITICAL: We have ${localClassCount} local classes but none implement interfaces - this seems wrong for polymorphic code`);
  }

  return implementations;
}

/**
 * Find a specific method in a class by name
 */
function findMethodInClass(classData: any, methodName: string): any | null {
  if (!classData.methods) {
    console.log(`      🚨 PROBLEM: Class ${classData.name} has no methods array - this should not happen for a real class`);
    return null;
  }

  if (classData.methods.length === 0) {
    console.log(`      🚨 SUSPICIOUS: Class ${classData.name} has empty methods array - might be missing method detection`);
    return null;
  }

  console.log(`      🔍 Searching for method '${methodName}' in class ${classData.name} (${classData.methods.length} methods total)`);
  const method = classData.methods.find((method: any) => method.name === methodName);

  if (method) {
    console.log(`      ✅ Found method '${methodName}' in class ${classData.name}`);
  } else {
    console.log(`      🚨 PROBLEM: Method '${methodName}' not found in class ${classData.name}`);
    console.log(`      📝 Available methods: [${classData.methods.map((m: any) => m.name).join(', ')}]`);
    console.log(`      🔍 This could indicate: 1) Interface method name != implementation method name, 2) Method not detected in class analysis`);
  }

  return method || null;
}