import type { Knex } from "knex";
import crypto from "crypto";

export async function seed(knex: Knex): Promise<void> {
  // Check if materials already exist to avoid duplicate insertions
  const existingCount = await knex("materials").count("id as count").first();
  if (existingCount && Number(existingCount.count) > 0) {
    console.log("Master demo data already exists, skipping.");
    return;
  }

  console.log("Seeding realistic master data and end-to-end operational states...");

  // 1. Fetch user references for proper actor attribution
  const adminUser = await knex("users").where({ email: "admin@mfg.com" }).first();
  const managerUser = await knex("users").where({ email: "manager@mfg.com" }).first();
  const purchasingUser = await knex("users").where({ email: "purchasing@mfg.com" }).first();
  const productionUser = await knex("users").where({ email: "production@mfg.com" }).first();
  const qcUser = await knex("users").where({ email: "qc@mfg.com" }).first();

  // 2. Suppliers
  const suppliers = [
    { id: crypto.randomUUID(), name: "Nippon Steel Partner Supplies", contact_info: "contact@nippon-steel.example", is_active: true },
    { id: crypto.randomUUID(), name: "Sumitomo Electric Industrial Metals", contact_info: "orders@sumitomo-metals.example", is_active: true },
    { id: crypto.randomUUID(), name: "Kyocera Advanced Engineered Components", contact_info: "sales@kyocera-components.example", is_active: true },
    { id: crypto.randomUUID(), name: "Osaka Precision Fasteners Corp", contact_info: "support@osaka-fasteners.example", is_active: true },
  ];
  await knex("suppliers").insert(suppliers);

  // 3. Materials
  const materials = [
    { id: crypto.randomUUID(), sku: "MAT-STL-001", name: "High-Tensile Cold-Rolled Steel Sheet", unit: "kg", min_stock_threshold: 100, is_active: true },
    { id: crypto.randomUUID(), sku: "MAT-ALU-002", name: "Structural Anodized Aluminum Profile", unit: "pcs", min_stock_threshold: 50, is_active: true },
    { id: crypto.randomUUID(), sku: "MAT-COP-003", name: "High-Conductivity Copper Busbar Strip", unit: "kg", min_stock_threshold: 40, is_active: true },
    { id: crypto.randomUUID(), sku: "MAT-SLN-004", name: "Thermally Conductive Silicone Insulator", unit: "m", min_stock_threshold: 150, is_active: true },
    { id: crypto.randomUUID(), sku: "MAT-FST-005", name: "M6 Industrial Grade Stainless Fasteners", unit: "box", min_stock_threshold: 25, is_active: true },
  ];
  await knex("materials").insert(materials);

  // 4. Products
  const products = [
    { id: crypto.randomUUID(), sku: "PROD-ENC-01", name: "Modular Industrial Automation Enclosure", unit: "unit" },
    { id: crypto.randomUUID(), sku: "PROD-BMOD-02", name: "High-Density Energy Storage Battery Module", unit: "unit" },
    { id: crypto.randomUUID(), sku: "PROD-PDU-03", name: "Factory Floor Intelligent Power Distribution Unit", unit: "unit" },
  ];
  await knex("products").insert(products);

  // 5. Initial Inventory Balances & Inventory Transactions
  const initialStock = [
    { material_id: materials[0].id, available_stock: 450, reserved_stock: 0 },
    { material_id: materials[1].id, available_stock: 220, reserved_stock: 0 },
    { material_id: materials[2].id, available_stock: 180, reserved_stock: 0 },
    { material_id: materials[3].id, available_stock: 65, reserved_stock: 0 }, // Low stock: 65 < 150 threshold
    { material_id: materials[4].id, available_stock: 90, reserved_stock: 0 },
  ];
  await knex("inventory").insert(initialStock);

  const initialTxs = initialStock.map((s) => ({
    id: crypto.randomUUID(),
    material_id: s.material_id,
    transaction_type: "Receipt",
    quantity_change: s.available_stock,
    reference_id: "INIT-BALANCE",
    created_at: new Date(),
  }));
  await knex("inventory_transactions").insert(initialTxs);

  // 6. Purchase Requests (Illustrating Pending & Approved states)
  // PR 1: Pending approval by Manager
  const pendingPrId = crypto.randomUUID();
  await knex("purchase_requests").insert({
    id: pendingPrId,
    user_id: purchasingUser?.id || adminUser?.id,
    request_date: new Date(),
    status: "Pending",
  });
  await knex("purchase_request_items").insert({
    id: crypto.randomUUID(),
    pr_id: pendingPrId,
    material_id: materials[3].id, // Silicone insulator (which is currently low in stock)
    quantity: 100,
  });

  // PR 2: Approved, ready for PO creation by Purchasing
  const approvedPrId = crypto.randomUUID();
  await knex("purchase_requests").insert({
    id: approvedPrId,
    user_id: purchasingUser?.id || adminUser?.id,
    request_date: new Date(Date.now() - 86400000), // Yesterday
    status: "Approved",
  });
  await knex("purchase_request_items").insert({
    id: crypto.randomUUID(),
    pr_id: approvedPrId,
    material_id: materials[0].id, // Steel sheet
    quantity: 150,
  });

  // 7. Purchase Order (Issued, ready for Goods Receipt by Warehouse)
  const issuedPoId = crypto.randomUUID();
  await knex("purchase_orders").insert({
    id: issuedPoId,
    pr_id: approvedPrId,
    supplier_id: suppliers[0].id,
    user_id: purchasingUser?.id || adminUser?.id,
    issue_date: new Date(),
    status: "Issued",
  });
  const poItemId = crypto.randomUUID();
  await knex("purchase_order_items").insert({
    id: poItemId,
    po_id: issuedPoId,
    material_id: materials[0].id,
    quantity: 50,
    unit_price: 12.50,
  });

  // 8. Production Orders
  // Order 1: Planned (Ready for checking stock and reserving BOM)
  const plannedProdoId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: plannedProdoId,
    product_id: products[0].id,
    planned_quantity: 5,
    status: "Planned",
  });
  await knex("production_order_materials").insert({
    id: crypto.randomUUID(),
    prodo_id: plannedProdoId,
    material_id: materials[0].id,
    required_quantity: 20,
  });

  // Order 2: Completed, awaiting Quality Control inspection
  const awaitingQcProdoId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: awaitingQcProdoId,
    product_id: products[1].id,
    planned_quantity: 10,
    status: "Completed",
  });
  const awaitingQcRecordId = crypto.randomUUID();
  await knex("production_records").insert({
    id: awaitingQcRecordId,
    prodo_id: awaitingQcProdoId,
    actual_quantity_produced: 10,
    completion_date: new Date(),
  });

  // Order 3: Completed AND inspected (Yield & Defect history for Dashboard)
  const inspectedProdoId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: inspectedProdoId,
    product_id: products[0].id,
    planned_quantity: 8,
    status: "Completed",
  });
  const inspectedRecordId = crypto.randomUUID();
  await knex("production_records").insert({
    id: inspectedRecordId,
    prodo_id: inspectedProdoId,
    actual_quantity_produced: 8,
    completion_date: new Date(Date.now() - 172800000), // 2 days ago
  });
  const inspectionId = crypto.randomUUID();
  await knex("quality_inspections").insert({
    id: inspectionId,
    production_record_id: inspectedRecordId,
    inspector_id: qcUser?.id || adminUser?.id,
    pass_quantity: 7,
    fail_quantity: 1,
    inspection_date: new Date(Date.now() - 86400000),
  });
  await knex("defect_records").insert({
    id: crypto.randomUUID(),
    inspection_id: inspectionId,
    defect_reason: "Surface scratch beyond tolerance",
    quantity: 1,
  });
  await knex("finished_goods_records").insert({
    id: crypto.randomUUID(),
    product_id: products[0].id,
    inspection_id: inspectionId,
    released_quantity: 7,
    release_date: new Date(Date.now() - 86400000),
  });

  // 9. Initial System Audit Log
  await knex("audit_logs").insert({
    id: crypto.randomUUID(),
    user_id: adminUser?.id || null,
    action_type: "SYSTEM_INIT",
    entity_name: "SYSTEM",
    entity_id: "SEED",
    description: "Initialized master data, baseline stock, sample workflow states (PR, PO, MO, QC)",
    created_at: new Date(),
  });

  console.log("Successfully seeded master data and active workflow pipeline records.");
}
