export type UnitCategory = 
  | 'Mass / Weight'
  | 'Count & Packaging'
  | 'Volume / Liquid'
  | 'Length / Dimension';

export interface UnitDefinition {
  symbol: string;
  name: string;
  category: UnitCategory;
  description?: string;
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  'Mass / Weight',
  'Count & Packaging',
  'Volume / Liquid',
  'Length / Dimension',
];

export const CANONICAL_UNITS: UnitDefinition[] = [
  // Mass / Weight
  { symbol: 'kg', name: 'Kilogram', category: 'Mass / Weight', description: 'SI base unit of mass' },
  { symbol: 'g', name: 'Gram', category: 'Mass / Weight', description: 'Metric unit of mass (0.001 kg)' },
  { symbol: 'mg', name: 'Milligram', category: 'Mass / Weight', description: 'Metric unit of mass (0.001 g)' },
  { symbol: 'ton', name: 'Metric Ton', category: 'Mass / Weight', description: 'Metric ton (1,000 kg)' },

  // Count & Packaging
  { symbol: 'pcs', name: 'Pieces', category: 'Count & Packaging', description: 'Discrete individual pieces' },
  { symbol: 'unit', name: 'Unit', category: 'Count & Packaging', description: 'Generic item unit' },
  { symbol: 'set', name: 'Set', category: 'Count & Packaging', description: 'Assembled set or kit' },
  { symbol: 'box', name: 'Box', category: 'Count & Packaging', description: 'Box package' },
  { symbol: 'pack', name: 'Pack', category: 'Count & Packaging', description: 'Pack or bundle' },
  { symbol: 'roll', name: 'Roll', category: 'Count & Packaging', description: 'Continuous roll' },

  // Volume / Liquid
  { symbol: 'l', name: 'Liter', category: 'Volume / Liquid', description: 'Metric unit of volume' },
  { symbol: 'ml', name: 'Milliliter', category: 'Volume / Liquid', description: 'Metric unit of volume (0.001 L)' },
  { symbol: 'm3', name: 'Cubic Meter', category: 'Volume / Liquid', description: 'SI derived unit of volume (m³)' },

  // Length / Dimension
  { symbol: 'm', name: 'Meter', category: 'Length / Dimension', description: 'SI base unit of length' },
  { symbol: 'cm', name: 'Centimeter', category: 'Length / Dimension', description: 'Metric unit of length (0.01 m)' },
  { symbol: 'mm', name: 'Millimeter', category: 'Length / Dimension', description: 'Metric unit of length (0.001 m)' },
];

export const CANONICAL_UNIT_SYMBOLS: string[] = CANONICAL_UNITS.map(u => u.symbol);

export function getUnitDefinition(symbol: string): UnitDefinition | undefined {
  if (!symbol) return undefined;
  return CANONICAL_UNITS.find(u => u.symbol.toLowerCase() === symbol.trim().toLowerCase());
}

export function isCanonicalUnit(symbol: string): boolean {
  if (!symbol) return false;
  return CANONICAL_UNIT_SYMBOLS.includes(symbol.trim().toLowerCase());
}

export function formatUnitDisplay(symbol: string): string {
  if (!symbol) return '';
  const def = getUnitDefinition(symbol);
  if (def) {
    return `${def.symbol} — ${def.name}`;
  }
  return `${symbol} (Custom)`;
}

export interface CategorizedUnits {
  category: UnitCategory | 'Custom / Legacy';
  units: UnitDefinition[];
}

export function filterGroupedUnits(query: string, customSymbol?: string): CategorizedUnits[] {
  const trimmedQuery = query.trim().toLowerCase();

  const matchingUnits = CANONICAL_UNITS.filter(u => {
    if (!trimmedQuery) return true;
    return (
      u.symbol.toLowerCase().includes(trimmedQuery) ||
      u.name.toLowerCase().includes(trimmedQuery) ||
      u.category.toLowerCase().includes(trimmedQuery)
    );
  });

  const grouped: CategorizedUnits[] = [];

  for (const cat of UNIT_CATEGORIES) {
    const unitsInCat = matchingUnits.filter(u => u.category === cat);
    if (unitsInCat.length > 0) {
      grouped.push({ category: cat, units: unitsInCat });
    }
  }

  if (customSymbol && !isCanonicalUnit(customSymbol)) {
    const customMatches = !trimmedQuery || 
      customSymbol.toLowerCase().includes(trimmedQuery) || 
      'custom legacy'.includes(trimmedQuery);

    if (customMatches) {
      grouped.push({
        category: 'Custom / Legacy',
        units: [
          {
            symbol: customSymbol,
            name: 'Non-Standard / Legacy',
            category: 'Count & Packaging' as UnitCategory,
            description: 'Persisted legacy value',
          }
        ]
      });
    }
  }

  return grouped;
}
