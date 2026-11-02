import type { Knex } from "knex";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Seed: Demo Master Data — Panasonic Manufacturing Indonesia Context
//
// Lini produk: Air Conditioner · Refrigerator · Washing Machine · LED TV
// Bahan baku, HS Code, dan supplier mencerminkan industri elektronik rumah
// tangga Indonesia. Data bersifat simulasi portfolio — bukan data Panasonic
// yang sebenarnya.
// ---------------------------------------------------------------------------

export async function seed(knex: Knex): Promise<void> {
  // Guard: skip jika sudah ada data
  const existingCount = await knex("materials").count("id as count").first();
  if (existingCount && Number(existingCount.count) > 0) {
    console.log("Master demo data already exists — skipping seed.");
    return;
  }

  console.log("Seeding Panasonic-context master data...");

  // ── User references ──────────────────────────────────────────────────────
  const adminUser     = await knex("users").where({ email: "admin@mfg.com" }).first();
  const purchasingUser = await knex("users").where({ email: "purchasing@mfg.com" }).first();
  const productionUser = await knex("users").where({ email: "production@mfg.com" }).first();
  const qcUser        = await knex("users").where({ email: "qc@mfg.com" }).first();

  // ── 1. Suppliers ─────────────────────────────────────────────────────────
  const suppliers = [
    {
      id: crypto.randomUUID(),
      name: "Nippon Steel Indonesia (Krakatau NS)",
      contact_info: "orders@krakatau-ns.example",
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Sumitomo Electric Wiring Systems",
      contact_info: "supply@sumitomo-wiring.example",
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "PT Chandra Asri Petrochemical (Resin)",
      contact_info: "sales@chandra-asri-resin.example",
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Kobe Steel Copper Products Asia",
      contact_info: "orders@kobelco-copper.example",
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "PT Daikin Compressor Indonesia",
      contact_info: "procurement@daikin-comp-id.example",
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Murata Manufacturing (Component Supply)",
      contact_info: "components@murata-supply.example",
      is_active: true,
    },
  ];
  await knex("suppliers").insert(suppliers);

  // ── 2. Materials (dengan HS Code lengkap) ─────────────────────────────────
  // Dikelompokkan per kategori:
  //   A. Logam & Baja       (lini AC, kulkas, mesin cuci — bodi/casing)
  //   B. Tembaga            (pipa refrigerant, busbar, kawat)
  //   C. Aluminium          (fin evaporator/kondensor, heat sink)
  //   D. Plastik & Resin    (komponen bodi, panel, cetakan)
  //   E. Komponen Elektronik (PCB, kapasitor, motor, refrigerant)
  //   F. Bahan Pendukung    (insulasi, busa, fastener, solder)

  const materials = [
    // ── A. Logam & Baja ────────────────────────────────────────────────────
    {
      id: crypto.randomUUID(),
      sku: "MAT-STL-001",
      name: "Cold-Rolled Steel Sheet (CRCA, t=0.5mm)",
      unit: "kg",
      min_stock_threshold: 2000,
      is_active: true,
      hs_code: "7209.16",   // Flat-rolled, cold-rolled, width ≥600mm, t 0.5–1mm
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-STL-002",
      name: "Galvanized Steel Coil (GI, t=0.8mm)",
      unit: "kg",
      min_stock_threshold: 1500,
      is_active: true,
      hs_code: "7210.49",   // Flat-rolled, zinc-coated (galvanized), other
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-STL-003",
      name: "Stainless Steel Sheet SUS304 (t=1.0mm)",
      unit: "kg",
      min_stock_threshold: 500,
      is_active: true,
      hs_code: "7219.32",   // Flat-rolled stainless, cold-rolled, t 0.5–1mm
    },

    // ── B. Tembaga ─────────────────────────────────────────────────────────
    {
      id: crypto.randomUUID(),
      sku: "MAT-COP-001",
      name: "Copper Tube for Refrigerant (OD 9.52mm, ACR Grade)",
      unit: "m",
      min_stock_threshold: 3000,
      is_active: true,
      hs_code: "7411.10",   // Tubes/pipes of refined copper
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-COP-002",
      name: "Copper Busbar Strip (99.9% Cu, 25x3mm)",
      unit: "kg",
      min_stock_threshold: 200,
      is_active: true,
      hs_code: "7407.10",   // Bars/rods of refined copper
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-COP-003",
      name: "Enameled Copper Wire (AWG 22, Motor Winding)",
      unit: "kg",
      min_stock_threshold: 300,
      is_active: true,
      hs_code: "8544.11",   // Winding wire, of copper
    },

    // ── C. Aluminium ───────────────────────────────────────────────────────
    {
      id: crypto.randomUUID(),
      sku: "MAT-ALU-001",
      name: "Aluminum Fin Coil (Al 1100, t=0.1mm, Condenser)",
      unit: "kg",
      min_stock_threshold: 1000,
      is_active: true,
      hs_code: "7607.11",   // Aluminium foil (rolled but not further worked), t ≤0.2mm
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ALU-002",
      name: "Aluminum Extrusion Profile (Al 6063-T5, Heat Sink)",
      unit: "kg",
      min_stock_threshold: 400,
      is_active: true,
      hs_code: "7604.29",   // Aluminium alloy bars/rods/profiles
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ALU-003",
      name: "Aluminum Die-Cast Housing (Fan Motor, ADC12)",
      unit: "pcs",
      min_stock_threshold: 500,
      is_active: true,
      hs_code: "7616.99",   // Other articles of aluminium
    },

    // ── D. Plastik & Resin ─────────────────────────────────────────────────
    {
      id: crypto.randomUUID(),
      sku: "MAT-PLS-001",
      name: "ABS Resin Pellet (High-Impact Grade, Natural)",
      unit: "kg",
      min_stock_threshold: 1500,
      is_active: true,
      hs_code: "3903.30",   // ABS polymers, in primary forms
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-PLS-002",
      name: "Polypropylene Resin (PP Homopolymer, Injection Grade)",
      unit: "kg",
      min_stock_threshold: 1200,
      is_active: true,
      hs_code: "3902.10",   // Polypropylene, in primary forms
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-PLS-003",
      name: "HIPS Sheet (High-Impact Polystyrene, Inner Liner Refrigerator)",
      unit: "kg",
      min_stock_threshold: 600,
      is_active: true,
      hs_code: "3920.30",   // Plates/sheets of polymers of styrene
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-PLS-004",
      name: "PC/ABS Blend Resin (Panel Grade, Flame Retardant)",
      unit: "kg",
      min_stock_threshold: 400,
      is_active: true,
      hs_code: "3907.99",   // Other polyesters/blends, primary forms
    },

    // ── E. Komponen Elektronik ─────────────────────────────────────────────
    {
      id: crypto.randomUUID(),
      sku: "MAT-PCB-001",
      name: "PCB Bare Board (4-Layer, FR4, AC Main Control)",
      unit: "pcs",
      min_stock_threshold: 1000,
      is_active: true,
      hs_code: "8534.00",   // Printed circuits (bare boards)
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-PCB-002",
      name: "PCB Bare Board (2-Layer, FR4, Display/Remote)",
      unit: "pcs",
      min_stock_threshold: 800,
      is_active: true,
      hs_code: "8534.00",   // Printed circuits (bare boards)
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ELC-001",
      name: "Electrolytic Capacitor 400V/470µF (Inverter Board)",
      unit: "pcs",
      min_stock_threshold: 2000,
      is_active: true,
      hs_code: "8532.22",   // Aluminium electrolytic capacitors
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ELC-002",
      name: "IPM Module (Intelligent Power Module, 15A/600V)",
      unit: "pcs",
      min_stock_threshold: 300,
      is_active: true,
      hs_code: "8542.31",   // Electronic integrated circuits — processors/controllers
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ELC-003",
      name: "DC Fan Motor (12VDC, Indoor Unit Blower)",
      unit: "pcs",
      min_stock_threshold: 500,
      is_active: true,
      hs_code: "8501.10",   // Motors of an output ≤37.5W
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ELC-004",
      name: "Rotary Compressor (R32, 1PK / 2545 BTU)",
      unit: "pcs",
      min_stock_threshold: 200,
      is_active: true,
      hs_code: "8414.30",   // Compressors of a kind used in refrigerating equipment
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ELC-005",
      name: "Refrigerant R32 (Difluoromethane, 10kg Cylinder)",
      unit: "cylinder",
      min_stock_threshold: 50,
      is_active: true,
      hs_code: "2903.39",   // Halogenated derivatives of acyclic hydrocarbons (HFCs)
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ELC-006",
      name: "LED Backlight Strip (32-inch, 3V/60mA per segment)",
      unit: "pcs",
      min_stock_threshold: 600,
      is_active: true,
      hs_code: "9405.42",   // LED luminaires for photographic lighting
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-ELC-007",
      name: "BLDC Motor Stator Assembly (Washing Machine Drum)",
      unit: "pcs",
      min_stock_threshold: 300,
      is_active: true,
      hs_code: "8503.00",   // Parts suitable for use with motors/generators
    },

    // ── F. Bahan Pendukung ─────────────────────────────────────────────────
    {
      id: crypto.randomUUID(),
      sku: "MAT-INS-001",
      name: "Polyurethane Foam (2-Component, Rigid, Refrigerator Insulation)",
      unit: "kg",
      min_stock_threshold: 800,
      is_active: true,
      hs_code: "3909.50",   // Polyurethanes, in primary forms
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-INS-002",
      name: "Thermal Insulation Tape (Armaflex, AC Piping)",
      unit: "m",
      min_stock_threshold: 2000,
      is_active: true,
      hs_code: "3920.99",   // Other plates/sheets of plastics
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-FST-001",
      name: "Self-Tapping Screw M4x8 (Zinc Plated, Box/1000pcs)",
      unit: "box",
      min_stock_threshold: 100,
      is_active: true,
      hs_code: "7318.14",   // Self-tapping screws of iron/steel
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-FST-002",
      name: "Hex Bolt M6x20 + Nut Grade 8.8 (Box/500pcs)",
      unit: "box",
      min_stock_threshold: 80,
      is_active: true,
      hs_code: "7318.15",   // Bolts, of iron or steel
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-SLD-001",
      name: "Lead-Free Solder Wire (Sn99/Cu0.7, ø0.8mm, 1kg Spool)",
      unit: "spool",
      min_stock_threshold: 60,
      is_active: true,
      hs_code: "8311.30",   // Coated rods and cored wire for soldering
    },
    {
      id: crypto.randomUUID(),
      sku: "MAT-PKG-001",
      name: "Corrugated Cardboard Box (AC Outdoor Unit, 1050x420x430mm)",
      unit: "pcs",
      min_stock_threshold: 500,
      is_active: true,
      hs_code: "4819.10",   // Cartons/boxes of corrugated paper/paperboard
    },
  ];
  await knex("materials").insert(materials);

  // ── 3. Products (Lini produk Panasonic Manufacturing Indonesia) ───────────
  const products = [
    // Air Conditioner
    { id: crypto.randomUUID(), sku: "PROD-AC-S10", name: "AC Split Standard 1PK (CS-PN10WKJ)", unit: "unit" },
    { id: crypto.randomUUID(), sku: "PROD-AC-I10", name: "AC Split Inverter 1PK (CS-XU10WKPJ)", unit: "unit" },
    { id: crypto.randomUUID(), sku: "PROD-AC-I15", name: "AC Split Inverter 1.5PK (CS-XU13WKPJ)", unit: "unit" },
    // Refrigerator
    { id: crypto.randomUUID(), sku: "PROD-RF-2DR", name: "Refrigerator 2-Door 268L (NR-BP303VS)", unit: "unit" },
    { id: crypto.randomUUID(), sku: "PROD-RF-1DR", name: "Refrigerator 1-Door 100L (NR-AP188VS)", unit: "unit" },
    // Washing Machine
    { id: crypto.randomUUID(), sku: "PROD-WM-TT7", name: "Washing Machine Top Load 7kg (NA-F70A9)", unit: "unit" },
    { id: crypto.randomUUID(), sku: "PROD-WM-FL8", name: "Washing Machine Front Load 8kg (NA-V80FG3)", unit: "unit" },
    // LED TV
    { id: crypto.randomUUID(), sku: "PROD-TV-32H", name: "LED TV 32-inch HD Ready (TH-32LS600G)", unit: "unit" },
    { id: crypto.randomUUID(), sku: "PROD-TV-43F", name: "LED TV 43-inch Full HD (TH-43LX800G)", unit: "unit" },
  ];
  await knex("products").insert(products);

  // ── 4. Inventory Balances ─────────────────────────────────────────────────
  // Skenario stok: beberapa normal, satu low stock (refrigerant), satu hampir habis
  const stockLevels = {
    "MAT-STL-001": { avail: 8500,  reserved: 0 },
    "MAT-STL-002": { avail: 6200,  reserved: 0 },
    "MAT-STL-003": { avail: 1100,  reserved: 0 },
    "MAT-COP-001": { avail: 12000, reserved: 0 },
    "MAT-COP-002": { avail: 480,   reserved: 0 },
    "MAT-COP-003": { avail: 750,   reserved: 0 },
    "MAT-ALU-001": { avail: 3200,  reserved: 0 },
    "MAT-ALU-002": { avail: 920,   reserved: 0 },
    "MAT-ALU-003": { avail: 1400,  reserved: 0 },
    "MAT-PLS-001": { avail: 4800,  reserved: 0 },
    "MAT-PLS-002": { avail: 3600,  reserved: 0 },
    "MAT-PLS-003": { avail: 1800,  reserved: 0 },
    "MAT-PLS-004": { avail: 820,   reserved: 0 },
    "MAT-PCB-001": { avail: 2200,  reserved: 0 },
    "MAT-PCB-002": { avail: 1800,  reserved: 0 },
    "MAT-ELC-001": { avail: 5500,  reserved: 0 },
    "MAT-ELC-002": { avail: 680,   reserved: 0 },
    "MAT-ELC-003": { avail: 1200,  reserved: 0 },
    "MAT-ELC-004": { avail: 420,   reserved: 0 },
    "MAT-ELC-005": { avail: 38,    reserved: 0 }, // ⚠ LOW STOCK: 38 < threshold 50
    "MAT-ELC-006": { avail: 1100,  reserved: 0 },
    "MAT-ELC-007": { avail: 680,   reserved: 0 },
    "MAT-INS-001": { avail: 2100,  reserved: 0 },
    "MAT-INS-002": { avail: 5800,  reserved: 0 },
    "MAT-FST-001": { avail: 310,   reserved: 0 },
    "MAT-FST-002": { avail: 195,   reserved: 0 },
    "MAT-SLD-001": { avail: 88,    reserved: 0 },
    "MAT-PKG-001": { avail: 1600,  reserved: 0 },
  };

  const inventoryRows = materials.map((m) => ({
    material_id: m.id,
    available_stock: stockLevels[m.sku]?.avail ?? 0,
    reserved_stock:  stockLevels[m.sku]?.reserved ?? 0,
  }));
  await knex("inventory").insert(inventoryRows);

  // Initial inventory transactions (opening balance)
  const initTxs = inventoryRows.map((row) => ({
    id: crypto.randomUUID(),
    material_id: row.material_id,
    transaction_type: "Receipt",
    quantity_change: row.available_stock,
    reference_id: "OPENING-BALANCE",
    created_at: new Date(),
  }));
  await knex("inventory_transactions").insert(initTxs);

  // ── 5. Purchase Requests ──────────────────────────────────────────────────
  // Helper: cari material by SKU
  const bySkuMap = Object.fromEntries(materials.map((m) => [m.sku, m]));

  // PR-1: Pending — pengisian refrigerant R32 (low stock)
  const pendingPrId = crypto.randomUUID();
  await knex("purchase_requests").insert({
    id: pendingPrId,
    user_id: purchasingUser?.id ?? adminUser?.id,
    request_date: new Date(),
    status: "Pending",
  });
  await knex("purchase_request_items").insert({
    id: crypto.randomUUID(),
    pr_id: pendingPrId,
    material_id: bySkuMap["MAT-ELC-005"].id, // Refrigerant R32
    quantity: 100,
  });

  // PR-2: Approved — pengisian copper tube & ABS resin
  const approvedPrId = crypto.randomUUID();
  await knex("purchase_requests").insert({
    id: approvedPrId,
    user_id: purchasingUser?.id ?? adminUser?.id,
    request_date: new Date(Date.now() - 86400000 * 2),
    status: "Approved",
  });
  await knex("purchase_request_items").insert([
    {
      id: crypto.randomUUID(),
      pr_id: approvedPrId,
      material_id: bySkuMap["MAT-COP-001"].id, // Copper tube ACR
      quantity: 5000,
    },
    {
      id: crypto.randomUUID(),
      pr_id: approvedPrId,
      material_id: bySkuMap["MAT-PLS-001"].id, // ABS resin
      quantity: 2000,
    },
  ]);

  // ── 6. Purchase Order (Issued, ready for Goods Receipt) ───────────────────
  const issuedPoId = crypto.randomUUID();
  await knex("purchase_orders").insert({
    id: issuedPoId,
    pr_id: approvedPrId,
    supplier_id: suppliers[3].id, // Kobe Steel Copper
    user_id: purchasingUser?.id ?? adminUser?.id,
    issue_date: new Date(Date.now() - 86400000),
    status: "Issued",
  });
  await knex("purchase_order_items").insert([
    {
      id: crypto.randomUUID(),
      po_id: issuedPoId,
      material_id: bySkuMap["MAT-COP-001"].id,
      quantity: 5000,
      unit_price: 0.85, // USD/m
    },
    {
      id: crypto.randomUUID(),
      po_id: issuedPoId,
      material_id: bySkuMap["MAT-PLS-001"].id,
      quantity: 2000,
      unit_price: 1.45, // USD/kg
    },
  ]);

  // ── 7. Production Orders ──────────────────────────────────────────────────
  const prodAcS10 = products.find((p) => p.sku === "PROD-AC-S10")!;
  const prodAcI10 = products.find((p) => p.sku === "PROD-AC-I10")!;
  const prodRf2dr = products.find((p) => p.sku === "PROD-RF-2DR")!;
  const prodWmTt7 = products.find((p) => p.sku === "PROD-WM-TT7")!;
  const prodTv32h = products.find((p) => p.sku === "PROD-TV-32H")!;

  // Order 1: In_Progress — AC Standard 1PK
  const inProgressId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: inProgressId,
    product_id: prodAcS10.id,
    planned_quantity: 300,
    status: "In_Progress",
  });

  // Order 2: Ready — AC Inverter 1PK (BOM reserved)
  const readyId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: readyId,
    product_id: prodAcI10.id,
    planned_quantity: 200,
    status: "Ready",
  });
  await knex("production_order_materials").insert([
    { id: crypto.randomUUID(), prodo_id: readyId, material_id: bySkuMap["MAT-ELC-004"].id, required_quantity: 200 },
    { id: crypto.randomUUID(), prodo_id: readyId, material_id: bySkuMap["MAT-COP-001"].id, required_quantity: 1400 },
    { id: crypto.randomUUID(), prodo_id: readyId, material_id: bySkuMap["MAT-PCB-001"].id, required_quantity: 200 },
  ]);

  // Order 3: Planned — Refrigerator 2-Door (menunggu BOM check)
  const plannedRfId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: plannedRfId,
    product_id: prodRf2dr.id,
    planned_quantity: 150,
    status: "Planned",
  });
  await knex("production_order_materials").insert([
    { id: crypto.randomUUID(), prodo_id: plannedRfId, material_id: bySkuMap["MAT-STL-001"].id, required_quantity: 900 },
    { id: crypto.randomUUID(), prodo_id: plannedRfId, material_id: bySkuMap["MAT-PLS-003"].id, required_quantity: 450 },
    { id: crypto.randomUUID(), prodo_id: plannedRfId, material_id: bySkuMap["MAT-INS-001"].id, required_quantity: 600 },
  ]);

  // Order 4: Planned — Washing Machine Top Load
  const plannedWmId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: plannedWmId,
    product_id: prodWmTt7.id,
    planned_quantity: 120,
    status: "Planned",
  });
  await knex("production_order_materials").insert([
    { id: crypto.randomUUID(), prodo_id: plannedWmId, material_id: bySkuMap["MAT-ELC-007"].id, required_quantity: 120 },
    { id: crypto.randomUUID(), prodo_id: plannedWmId, material_id: bySkuMap["MAT-PLS-001"].id, required_quantity: 360 },
  ]);

  // Order 5: Completed — LED TV 32" (menunggu QC)
  const completedTvId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: completedTvId,
    product_id: prodTv32h.id,
    planned_quantity: 500,
    status: "Completed",
  });
  const tvRecordId = crypto.randomUUID();
  await knex("production_records").insert({
    id: tvRecordId,
    prodo_id: completedTvId,
    actual_quantity_produced: 498,
    completion_date: new Date(),
  });

  // Order 6: Completed + QC pass (history dashboard) — AC Standard 1PK batch sebelumnya
  const prevBatchId = crypto.randomUUID();
  await knex("production_orders").insert({
    id: prevBatchId,
    product_id: prodAcS10.id,
    planned_quantity: 250,
    status: "Completed",
  });
  const prevRecordId = crypto.randomUUID();
  await knex("production_records").insert({
    id: prevRecordId,
    prodo_id: prevBatchId,
    actual_quantity_produced: 250,
    completion_date: new Date(Date.now() - 172800000), // 2 hari lalu
  });
  const inspectionId = crypto.randomUUID();
  await knex("quality_inspections").insert({
    id: inspectionId,
    production_record_id: prevRecordId,
    inspector_id: qcUser?.id ?? adminUser?.id,
    pass_quantity: 247,
    fail_quantity: 3,
    inspection_date: new Date(Date.now() - 86400000),
  });
  await knex("defect_records").insert([
    {
      id: crypto.randomUUID(),
      inspection_id: inspectionId,
      defect_reason: "Refrigerant leak at flare joint",
      quantity: 2,
    },
    {
      id: crypto.randomUUID(),
      inspection_id: inspectionId,
      defect_reason: "Fan blade imbalance — noise beyond tolerance",
      quantity: 1,
    },
  ]);
  await knex("finished_goods_records").insert({
    id: crypto.randomUUID(),
    product_id: prodAcS10.id,
    inspection_id: inspectionId,
    quantity: 247,
  });

  // ── 8. Audit log initial ──────────────────────────────────────────────────
  await knex("audit_logs").insert({
    id: crypto.randomUUID(),
    user_id: adminUser?.id ?? null,
    action_type: "SYSTEM_INIT",
    entity_name: "SYSTEM",
    entity_id: "SEED",
    description:
      "Initialized Panasonic Manufacturing Indonesia context: 28 materials with HS codes " +
      "(AC/Refrigerator/Washing Machine/TV lini), 6 suppliers, 9 products, " +
      "active PR/PO/Production/QC workflow states.",
    created_at: new Date(),
  });

  console.log(
    "Successfully seeded: 28 materials (with HS codes), 6 suppliers, " +
    "9 products, 6 production orders, 1 completed QC inspection."
  );
}
