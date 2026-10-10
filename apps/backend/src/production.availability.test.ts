/**
 * Unit tests for ProductionService.checkAvailability
 *
 * These tests verify:
 * 1. material_name, material_sku, and unit are present in each availability item.
 * 2. is_sufficient is computed correctly.
 * 3. Missing/null material metadata does not crash the service.
 * 4. The all_available flag reflects the aggregate result.
 */

import { ProductionService } from "./services/production.service";

// Mock the entire db module to avoid real DB connections in unit tests.
jest.mock("./db", () => {
  const mDb: any = jest.fn();
  mDb.transaction = jest.fn();
  return mDb;
});

// We spy on getOrderDetails so we can control its output without touching the DB.
describe("ProductionService.checkAvailability — material name enrichment", () => {
  afterEach(() => jest.restoreAllMocks());

  it("includes material_name, material_sku, and unit in each availability item", async () => {
    jest.spyOn(ProductionService, "getOrderDetails").mockResolvedValue({
      id: "prodo-1",
      product_id: "prod-1",
      planned_quantity: 100,
      status: "Planned",
      materials: [
        {
          material_id: "mat-aaa",
          name: "Steel Rod",
          sku: "MAT-SR-001",
          unit: "kg",
          required_quantity: "50",
          available_stock: "80",
        },
      ],
    });

    const result = await ProductionService.checkAvailability("prodo-1");

    expect(result.all_available).toBe(true);
    expect(result.materials).toHaveLength(1);

    const mat = result.materials[0];
    expect(mat.material_id).toBe("mat-aaa");
    expect(mat.material_name).toBe("Steel Rod");
    expect(mat.material_sku).toBe("MAT-SR-001");
    expect(mat.unit).toBe("kg");
    expect(mat.required).toBe(50);
    expect(mat.available).toBe(80);
    expect(mat.is_sufficient).toBe(true);
  });

  it("sets all_available to false and marks insufficient materials when stock is low", async () => {
    jest.spyOn(ProductionService, "getOrderDetails").mockResolvedValue({
      id: "prodo-2",
      materials: [
        {
          material_id: "mat-bbb",
          name: "Copper Wire",
          sku: "MAT-CW-002",
          unit: "m",
          required_quantity: "200",
          available_stock: "100",
        },
      ],
    });

    const result = await ProductionService.checkAvailability("prodo-2");

    expect(result.all_available).toBe(false);
    const mat = result.materials[0];
    expect(mat.is_sufficient).toBe(false);
    expect(mat.required).toBe(200);
    expect(mat.available).toBe(100);
    // shortage = required - available = 100
    expect(mat.required - mat.available).toBe(100);
  });

  it("handles null material_name and material_sku gracefully (deleted/missing material)", async () => {
    jest.spyOn(ProductionService, "getOrderDetails").mockResolvedValue({
      id: "prodo-3",
      materials: [
        {
          material_id: "mat-ccc",
          name: null,      // material record may have been removed or name is missing
          sku: null,
          unit: null,
          required_quantity: "10",
          available_stock: "10",
        },
      ],
    });

    const result = await ProductionService.checkAvailability("prodo-3");

    expect(result.all_available).toBe(true);
    const mat = result.materials[0];
    expect(mat.material_name).toBeNull();
    expect(mat.material_sku).toBeNull();
    expect(mat.unit).toBeNull();
    // Should not throw; is_sufficient should still be correct
    expect(mat.is_sufficient).toBe(true);
  });

  it("handles multiple materials with mixed availability", async () => {
    jest.spyOn(ProductionService, "getOrderDetails").mockResolvedValue({
      id: "prodo-4",
      materials: [
        {
          material_id: "mat-d1",
          name: "Iron Sheet",
          sku: "MAT-IS-003",
          unit: "pcs",
          required_quantity: "20",
          available_stock: "25",
        },
        {
          material_id: "mat-d2",
          name: "Rubber Seal",
          sku: "MAT-RS-004",
          unit: "pcs",
          required_quantity: "50",
          available_stock: "30",
        },
      ],
    });

    const result = await ProductionService.checkAvailability("prodo-4");

    expect(result.all_available).toBe(false);
    expect(result.materials[0].is_sufficient).toBe(true);
    expect(result.materials[0].material_name).toBe("Iron Sheet");
    expect(result.materials[1].is_sufficient).toBe(false);
    expect(result.materials[1].material_name).toBe("Rubber Seal");
  });
});
