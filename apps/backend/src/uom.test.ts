import { 
  CANONICAL_UNITS, 
  CANONICAL_UNIT_SYMBOLS, 
  UNIT_CATEGORIES, 
  getUnitDefinition, 
  isCanonicalUnit, 
  formatUnitDisplay, 
  filterGroupedUnits 
} from "./constants/uom";

describe("Canonical Unit of Measure (UOM) Catalog", () => {
  it("should define standard canonical categories", () => {
    expect(UNIT_CATEGORIES).toContain("Mass / Weight");
    expect(UNIT_CATEGORIES).toContain("Count & Packaging");
    expect(UNIT_CATEGORIES).toContain("Volume / Liquid");
    expect(UNIT_CATEGORIES).toContain("Length / Dimension");
    expect(UNIT_CATEGORIES.length).toBe(4);
  });

  it("should contain standard manufacturing unit symbols without duplicates", () => {
    const symbols = CANONICAL_UNITS.map(u => u.symbol);
    const uniqueSymbols = new Set(symbols);
    expect(symbols.length).toBe(uniqueSymbols.size);

    // Essential symbols must be present
    expect(symbols).toContain("kg");
    expect(symbols).toContain("g");
    expect(symbols).toContain("pcs");
    expect(symbols).toContain("box");
    expect(symbols).toContain("m");
    expect(symbols).toContain("l");
  });

  it("should correctly find unit definitions by symbol", () => {
    const kg = getUnitDefinition("kg");
    expect(kg).toBeDefined();
    expect(kg?.name).toBe("Kilogram");
    expect(kg?.category).toBe("Mass / Weight");

    const pcs = getUnitDefinition("pcs");
    expect(pcs).toBeDefined();
    expect(pcs?.name).toBe("Pieces");
    expect(pcs?.category).toBe("Count & Packaging");

    const unknown = getUnitDefinition("nonexistent_unit");
    expect(unknown).toBeUndefined();
  });

  it("should validate canonical units and reject arbitrary strings", () => {
    expect(isCanonicalUnit("kg")).toBe(true);
    expect(isCanonicalUnit("KG")).toBe(true); // case-insensitive check
    expect(isCanonicalUnit("pcs")).toBe(true);
    expect(isCanonicalUnit("m")).toBe(true);
    expect(isCanonicalUnit("l")).toBe(true);

    expect(isCanonicalUnit("100kg")).toBe(false);
    expect(isCanonicalUnit("arbitrary")).toBe(false);
    expect(isCanonicalUnit("")).toBe(false);
  });

  it("should format display labels consistently as symbol — name", () => {
    expect(formatUnitDisplay("kg")).toBe("kg — Kilogram");
    expect(formatUnitDisplay("pcs")).toBe("pcs — Pieces");
    expect(formatUnitDisplay("m")).toBe("m — Meter");
    expect(formatUnitDisplay("100kg")).toBe("100kg (Custom)");
    expect(formatUnitDisplay("")).toBe("");
  });

  describe("UOM Search and Grouping filter", () => {
    it("should return all categories when search query is empty", () => {
      const groups = filterGroupedUnits("");
      expect(groups.length).toBe(4);
      const totalUnits = groups.reduce((acc, g) => acc + g.units.length, 0);
      expect(totalUnits).toBe(CANONICAL_UNITS.length);
    });

    it("should search and filter by unit symbol", () => {
      const groups = filterGroupedUnits("kg");
      expect(groups.length).toBe(1);
      expect(groups[0].category).toBe("Mass / Weight");
      expect(groups[0].units.some(u => u.symbol === "kg")).toBe(true);
    });

    it("should search and filter by unit label name", () => {
      const groups = filterGroupedUnits("kilo");
      expect(groups.length).toBe(1);
      expect(groups[0].units.some(u => u.name === "Kilogram")).toBe(true);
    });

    it("should search and filter by category name", () => {
      const groups = filterGroupedUnits("length");
      expect(groups.length).toBe(1);
      expect(groups[0].category).toBe("Length / Dimension");
      expect(groups[0].units.length).toBeGreaterThan(0);
    });

    it("should return empty list when no units match", () => {
      const groups = filterGroupedUnits("xyz123nonexistent");
      expect(groups.length).toBe(0);
    });

    it("should preserve legacy custom units under Custom / Legacy group when provided", () => {
      const groups = filterGroupedUnits("", "100kg");
      const customGroup = groups.find(g => g.category === "Custom / Legacy");
      expect(customGroup).toBeDefined();
      expect(customGroup?.units[0].symbol).toBe("100kg");
    });
  });
});
