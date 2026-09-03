import michaelCatalog from '../data/michaelClinicLabCatalog.json';

export const LAB_CATALOG = michaelCatalog;
export const LAB_CATEGORIES = michaelCatalog.categories;
export const LAB_TESTS = michaelCatalog.tests;
export const LAB_BUNDLES = michaelCatalog.bundles;

/**
 * Calculates the total cost for selected test IDs, resolving bundle rules in ETB.
 * @param {Array<string>} selectedTestIds - List of test IDs or codes (e.g., ['LT-CHM-02', 'LT-CHM-03'])
 * @returns {Object} { totalETB, originalSumETB, totalSavingsETB, appliedBundles, itemizedPrices }
 */
export function calculateLabOrderBill(selectedTestIds = []) {
  if (!Array.isArray(selectedTestIds) || selectedTestIds.length === 0) {
    return {
      totalETB: 0,
      originalSumETB: 0,
      totalSavingsETB: 0,
      appliedBundles: [],
      itemizedPrices: [],
      testCount: 0,
    };
  }

  // Resolve selected tests from catalog
  const selectedTests = selectedTestIds
    .map((idOrCode) => LAB_TESTS.find((t) => t.id === idOrCode || t.code === idOrCode))
    .filter(Boolean);

  const selectedCodes = new Set(selectedTests.map((t) => t.code));
  const processedCodes = new Set();
  const appliedBundles = [];
  const itemizedPrices = [];
  let totalETB = 0;
  let originalSumETB = 0;

  // 1. Check for SGOT & SGPT bundle
  const hasSgot = selectedCodes.has('SGOT');
  const hasSgpt = selectedCodes.has('SGPT');
  if (hasSgot && hasSgpt) {
    appliedBundles.push({
      bundleKey: 'SGOT_SGPT_BUNDLE',
      name: 'Transaminases (SGOT & SGPT) Bundle',
      price: 600,
      originalPrice: 1200,
      savings: 600,
      testCodes: ['SGOT', 'SGPT'],
      testsIncluded: ['SGOT', 'SGPT'],
    });
    itemizedPrices.push({
      id: 'BUNDLE-SGOT-SGPT',
      code: 'SGOT+SGPT',
      name: 'SGOT & SGPT (Transaminases Bundle)',
      category: 'Chemistry',
      price: 600,
      originalPrice: 1200,
      isBundle: true,
    });
    totalETB += 600;
    originalSumETB += 1200;
    processedCodes.add('SGOT');
    processedCodes.add('SGPT');
  }

  // 2. Check for Thyroid Panel bundle (T3, T4, TSH)
  const hasT3 = selectedCodes.has('T3');
  const hasT4 = selectedCodes.has('T4');
  const hasTsh = selectedCodes.has('TSH');
  if (hasT3 && hasT4 && hasTsh) {
    appliedBundles.push({
      bundleKey: 'THYROID_PANEL',
      name: 'Complete Thyroid Panel (T3, T4, TSH)',
      price: 1770,
      originalPrice: 1770,
      savings: 0,
      testCodes: ['T3', 'T4', 'TSH'],
      testsIncluded: ['T3', 'T4', 'TSH'],
    });
    itemizedPrices.push({
      id: 'BUNDLE-THYROID',
      code: 'T3+T4+TSH',
      name: 'Thyroid Panel (T3, T4, TSH)',
      category: 'Chemistry',
      price: 1770,
      originalPrice: 1770,
      isBundle: true,
    });
    totalETB += 1770;
    originalSumETB += 1770;
    processedCodes.add('T3');
    processedCodes.add('T4');
    processedCodes.add('TSH');
  }

  // 3. Check for ASO & CRP bundle
  const hasAso = selectedCodes.has('ASO');
  const hasCrp = selectedCodes.has('CRP');
  if (hasAso && hasCrp) {
    appliedBundles.push({
      bundleKey: 'ASO_CRP_BUNDLE',
      name: 'Inflammatory / Rheumatic Screen (ASO & CRP)',
      price: 800,
      originalPrice: 800,
      savings: 0,
      testCodes: ['ASO', 'CRP'],
      testsIncluded: ['ASO', 'CRP'],
    });
    itemizedPrices.push({
      id: 'BUNDLE-ASO-CRP',
      code: 'ASO+CRP',
      name: 'ASO & CRP Inflammatory Screen',
      category: 'Serology',
      price: 800,
      originalPrice: 800,
      isBundle: true,
    });
    totalETB += 800;
    originalSumETB += 800;
    processedCodes.add('ASO');
    processedCodes.add('CRP');
  }

  // 4. Check for HCG Combo (Urine + Serum)
  const hasUrineHcg = selectedCodes.has('HCG_URINE');
  const hasSerumHcg = selectedCodes.has('HCG_SERUM');
  if (hasUrineHcg && hasSerumHcg) {
    appliedBundles.push({
      bundleKey: 'HCG_COMBO',
      name: 'HCG Pregnancy Screen (Urine + Serum)',
      price: 250,
      originalPrice: 250,
      savings: 0,
      testCodes: ['HCG_URINE', 'HCG_SERUM'],
      testsIncluded: ['HCG_URINE', 'HCG_SERUM'],
    });
    itemizedPrices.push({
      id: 'BUNDLE-HCG-COMBO',
      code: 'HCG_COMBO',
      name: 'HCG Screen (Urine + Serum Combo)',
      category: 'Serology',
      price: 250,
      originalPrice: 250,
      isBundle: true,
    });
    totalETB += 250;
    originalSumETB += 250;
    processedCodes.add('HCG_URINE');
    processedCodes.add('HCG_SERUM');
  }

  // 5. Add all remaining individual tests
  for (const test of selectedTests) {
    if (processedCodes.has(test.code)) continue;

    const testPrice = Number(test.price) || 0;
    totalETB += testPrice;
    originalSumETB += testPrice;
    itemizedPrices.push({
      id: test.id,
      code: test.code,
      name: test.name,
      fullName: test.fullName || test.name,
      category: test.category,
      price: testPrice,
      originalPrice: testPrice,
      isBundle: false,
    });
  }

  const totalSavingsETB = Math.max(0, originalSumETB - totalETB);

  return {
    totalETB,
    originalSumETB,
    totalSavingsETB,
    appliedBundles,
    itemizedPrices,
    testCount: selectedTests.length,
  };
}

/**
 * Standard Preset Order Profiles for rapid clinical selection
 */
export const CLINICAL_PRESETS = [
  {
    id: 'PRESET-THYROID',
    name: 'Thyroid Profile',
    badge: '1,770 ETB',
    description: 'T3, T4, TSH Hormone Panel',
    category: 'Chemistry',
    testCodes: ['T3', 'T4', 'TSH'],
  },
  {
    id: 'PRESET-LIVER',
    name: 'Liver Function (Transaminases)',
    badge: '600 ETB (Bundled)',
    description: 'SGOT + SGPT (AST/ALT) Liver Panel',
    category: 'Chemistry',
    testCodes: ['SGOT', 'SGPT'],
  },
  {
    id: 'PRESET-RFT',
    name: 'Renal Function (RFT)',
    badge: '900 ETB',
    description: 'Urea, Creatinine, Uric Acid Kidney Panel',
    category: 'Chemistry',
    testCodes: ['UREA', 'CREATININE', 'URIC_ACID'],
  },
  {
    id: 'PRESET-LIPID',
    name: 'Full Lipid Profile',
    badge: '1,200 ETB',
    description: 'Total Cholesterol, Triglycerids, HDL-C, LDL-C',
    category: 'Chemistry',
    testCodes: ['CHOLESTEROL', 'TRIGLYCERIDS', 'HDL_C', 'LDL_C'],
  },
  {
    id: 'PRESET-FEBRILE',
    name: 'Febrile / Typhoid Screen',
    badge: '800 ETB',
    description: 'Widal H, Widal O, Weil Felix, Blood Film',
    category: 'Serology',
    testCodes: ['WIDAL_H', 'WIDAL_O', 'WEIL_FELIX', 'BLOOD_FILM'],
  },
  {
    id: 'PRESET-GENERAL',
    name: 'General Routine Screen',
    badge: '1,300 ETB',
    description: 'CBC, Urine Analysis, Stool Examination, FBS',
    category: 'General',
    testCodes: ['CBC', 'URINE_ANALYSIS', 'STOOL_EXAMINATION', 'FBS_RBS'],
  },
];