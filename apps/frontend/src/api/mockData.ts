// ---------------------------------------------------------------------------
// Client-side Mock Data Engine for Cloud / Vercel Deployments
//
// Provides full offline / standalone interactive simulation of Panasonic
// Manufacturing Indonesia operations when no live backend server is reachable.
// State persists in browser localStorage (mfg_mock_store_v1).
// ---------------------------------------------------------------------------

export interface MockMaterial {
  id: string;
  sku: string;
  name: string;
  unit: string;
  min_stock_threshold: number;
  is_active: boolean;
  hs_code: string | null;
}

export interface MockInventoryItem {
  material_id: string;
  sku: string;
  name: string;
  unit: string;
  hs_code: string | null;
  min_stock_threshold: number;
  available_stock: number;
  reserved_stock: number;
  status: "Normal" | "Low Stock";
}

export interface MockSupplier {
  id: string;
  name: string;
  contact_info: string;
  is_active: boolean;
}

export interface MockProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

export interface MockPRItem {
  id: string;
  material_id: string;
  quantity: number;
  material_name?: string;
  material_sku?: string;
  unit?: string;
}

export interface MockPR {
  id: string;
  user_id: string;
  request_date: string;
  status: "Pending" | "Approved" | "Rejected";
  items: MockPRItem[];
}

export interface MockPOItem {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  material_name?: string;
  material_sku?: string;
  unit?: string;
}

export interface MockPO {
  id: string;
  pr_id?: string | null;
  supplier_id: string;
  supplier_name?: string;
  user_id: string;
  issue_date: string;
  status: "Issued" | "Completed";
  items: MockPOItem[];
}

export interface MockProductionOrder {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  planned_quantity: number;
  status: "Planned" | "Ready" | "In_Progress" | "Completed" | "Cancelled";
  materials?: { id: string; material_id: string; material_name: string; required_quantity: number; unit: string }[];
}

export interface MockQCInspection {
  id: string;
  production_record_id: string;
  product_name?: string;
  inspector_name?: string;
  pass_quantity: number;
  fail_quantity: number;
  inspection_date: string;
  defects?: { defect_reason: string; quantity: number }[];
}

// ── Master Seed Collections (Panasonic Manufacturing Indonesia Context) ──

const SEED_SUPPLIERS: MockSupplier[] = [
  { id: "sup-1", name: "Nippon Steel Indonesia (Krakatau NS)", contact_info: "orders@krakatau-ns.example", is_active: true },
  { id: "sup-2", name: "Sumitomo Electric Wiring Systems", contact_info: "supply@sumitomo-wiring.example", is_active: true },
  { id: "sup-3", name: "PT Chandra Asri Petrochemical (Resin)", contact_info: "sales@chandra-asri-resin.example", is_active: true },
  { id: "sup-4", name: "Kobe Steel Copper Products Asia", contact_info: "orders@kobelco-copper.example", is_active: true },
  { id: "sup-5", name: "PT Daikin Compressor Indonesia", contact_info: "procurement@daikin-comp-id.example", is_active: true },
  { id: "sup-6", name: "Murata Manufacturing (Component Supply)", contact_info: "components@murata-supply.example", is_active: true },
];

const SEED_MATERIALS: MockMaterial[] = [
  // A. Logam & Baja
  { id: "mat-1", sku: "MAT-STL-001", name: "Cold-Rolled Steel Sheet (CRCA, t=0.5mm)", unit: "kg", min_stock_threshold: 2000, is_active: true, hs_code: "7209.16" },
  { id: "mat-2", sku: "MAT-STL-002", name: "Galvanized Steel Coil (GI, t=0.8mm)", unit: "kg", min_stock_threshold: 1500, is_active: true, hs_code: "7210.49" },
  { id: "mat-3", sku: "MAT-STL-003", name: "Stainless Steel Sheet SUS304 (t=1.0mm)", unit: "kg", min_stock_threshold: 500, is_active: true, hs_code: "7219.32" },

  // B. Tembaga
  { id: "mat-4", sku: "MAT-COP-001", name: "Copper Tube for Refrigerant (OD 9.52mm, ACR Grade)", unit: "m", min_stock_threshold: 3000, is_active: true, hs_code: "7411.10" },
  { id: "mat-5", sku: "MAT-COP-002", name: "Copper Busbar Strip (99.9% Cu, 25x3mm)", unit: "kg", min_stock_threshold: 200, is_active: true, hs_code: "7407.10" },
  { id: "mat-6", sku: "MAT-COP-003", name: "Enameled Copper Wire (AWG 22, Motor Winding)", unit: "kg", min_stock_threshold: 300, is_active: true, hs_code: "8544.11" },

  // C. Aluminium
  { id: "mat-7", sku: "MAT-ALU-001", name: "Aluminum Fin Coil (Al 1100, t=0.1mm, Condenser)", unit: "kg", min_stock_threshold: 1000, is_active: true, hs_code: "7607.11" },
  { id: "mat-8", sku: "MAT-ALU-002", name: "Aluminum Extrusion Profile (Al 6063-T5, Heat Sink)", unit: "kg", min_stock_threshold: 400, is_active: true, hs_code: "7604.29" },
  { id: "mat-9", sku: "MAT-ALU-003", name: "Aluminum Die-Cast Housing (Fan Motor, ADC12)", unit: "pcs", min_stock_threshold: 500, is_active: true, hs_code: "7616.99" },

  // D. Plastik & Resin
  { id: "mat-10", sku: "MAT-PLS-001", name: "ABS Resin Pellet (High-Impact Grade, Natural)", unit: "kg", min_stock_threshold: 1500, is_active: true, hs_code: "3903.30" },
  { id: "mat-11", sku: "MAT-PLS-002", name: "Polypropylene Resin (PP Homopolymer, Injection Grade)", unit: "kg", min_stock_threshold: 1200, is_active: true, hs_code: "3902.10" },
  { id: "mat-12", sku: "MAT-PLS-003", name: "HIPS Sheet (High-Impact Polystyrene, Inner Liner Refrigerator)", unit: "kg", min_stock_threshold: 600, is_active: true, hs_code: "3920.30" },
  { id: "mat-13", sku: "MAT-PLS-004", name: "PC/ABS Blend Resin (Panel Grade, Flame Retardant)", unit: "kg", min_stock_threshold: 400, is_active: true, hs_code: "3907.99" },

  // E. Komponen Elektronik
  { id: "mat-14", sku: "MAT-PCB-001", name: "PCB Bare Board (4-Layer, FR4, AC Main Control)", unit: "pcs", min_stock_threshold: 1000, is_active: true, hs_code: "8534.00" },
  { id: "mat-15", sku: "MAT-PCB-002", name: "PCB Bare Board (2-Layer, FR4, Display/Remote)", unit: "pcs", min_stock_threshold: 800, is_active: true, hs_code: "8534.00" },
  { id: "mat-16", sku: "MAT-ELC-001", name: "Electrolytic Capacitor 400V/470µF (Inverter Board)", unit: "pcs", min_stock_threshold: 2000, is_active: true, hs_code: "8532.22" },
  { id: "mat-17", sku: "MAT-ELC-002", name: "IPM Module (Intelligent Power Module, 15A/600V)", unit: "pcs", min_stock_threshold: 300, is_active: true, hs_code: "8542.31" },
  { id: "mat-18", sku: "MAT-ELC-003", name: "DC Fan Motor (12VDC, Indoor Unit Blower)", unit: "pcs", min_stock_threshold: 500, is_active: true, hs_code: "8501.10" },
  { id: "mat-19", sku: "MAT-ELC-004", name: "Rotary Compressor (R32, 1PK / 2545 BTU)", unit: "pcs", min_stock_threshold: 200, is_active: true, hs_code: "8414.30" },
  { id: "mat-20", sku: "MAT-ELC-005", name: "Refrigerant R32 (Difluoromethane, 10kg Cylinder)", unit: "cylinder", min_stock_threshold: 50, is_active: true, hs_code: "2903.39" },
  { id: "mat-21", sku: "MAT-ELC-006", name: "LED Backlight Strip (32-inch, 3V/60mA per segment)", unit: "pcs", min_stock_threshold: 600, is_active: true, hs_code: "9405.42" },
  { id: "mat-22", sku: "MAT-ELC-007", name: "BLDC Motor Stator Assembly (Washing Machine Drum)", unit: "pcs", min_stock_threshold: 300, is_active: true, hs_code: "8503.00" },

  // F. Bahan Pendukung
  { id: "mat-23", sku: "MAT-INS-001", name: "Polyurethane Foam (2-Component, Rigid, Refrigerator Insulation)", unit: "kg", min_stock_threshold: 800, is_active: true, hs_code: "3909.50" },
  { id: "mat-24", sku: "MAT-INS-002", name: "Thermal Insulation Tape (Armaflex, AC Piping)", unit: "m", min_stock_threshold: 2000, is_active: true, hs_code: "3920.99" },
  { id: "mat-25", sku: "MAT-FST-001", name: "Self-Tapping Screw M4x8 (Zinc Plated, Box/1000pcs)", unit: "box", min_stock_threshold: 100, is_active: true, hs_code: "7318.14" },
  { id: "mat-26", sku: "MAT-FST-002", name: "Hex Bolt M6x20 + Nut Grade 8.8 (Box/500pcs)", unit: "box", min_stock_threshold: 80, is_active: true, hs_code: "7318.15" },
  { id: "mat-27", sku: "MAT-SLD-001", name: "Lead-Free Solder Wire (Sn99/Cu0.7, ø0.8mm, 1kg Spool)", unit: "spool", min_stock_threshold: 60, is_active: true, hs_code: "8311.30" },
  { id: "mat-28", sku: "MAT-PKG-001", name: "Corrugated Cardboard Box (AC Outdoor Unit, 1050x420x430mm)", unit: "pcs", min_stock_threshold: 500, is_active: true, hs_code: "4819.10" },
];

const SEED_PRODUCTS: MockProduct[] = [
  { id: "prod-1", sku: "PROD-AC-S10", name: "AC Split Standard 1PK (CS-PN10WKJ)", unit: "unit" },
  { id: "prod-2", sku: "PROD-AC-I10", name: "AC Split Inverter 1PK (CS-XU10WKPJ)", unit: "unit" },
  { id: "prod-3", sku: "PROD-AC-I15", name: "AC Split Inverter 1.5PK (CS-XU13WKPJ)", unit: "unit" },
  { id: "prod-4", sku: "PROD-RF-2DR", name: "Refrigerator 2-Door 268L (NR-BP303VS)", unit: "unit" },
  { id: "prod-5", sku: "PROD-RF-1DR", name: "Refrigerator 1-Door 100L (NR-AP188VS)", unit: "unit" },
  { id: "prod-6", sku: "PROD-WM-TT7", name: "Washing Machine Top Load 7kg (NA-F70A9)", unit: "unit" },
  { id: "prod-7", sku: "PROD-WM-FL8", name: "Washing Machine Front Load 8kg (NA-V80FG3)", unit: "unit" },
  { id: "prod-8", sku: "PROD-TV-32H", name: "LED TV 32-inch HD Ready (TH-32LS600G)", unit: "unit" },
  { id: "prod-9", sku: "PROD-TV-43F", name: "LED TV 43-inch Full HD (TH-43LX800G)", unit: "unit" },
];

const SEED_STOCK_MAP: Record<string, { avail: number; res: number }> = {
  "MAT-STL-001": { avail: 8500, res: 0 },
  "MAT-STL-002": { avail: 6200, res: 0 },
  "MAT-STL-003": { avail: 1100, res: 0 },
  "MAT-COP-001": { avail: 12000, res: 1400 },
  "MAT-COP-002": { avail: 480, res: 0 },
  "MAT-COP-003": { avail: 750, res: 0 },
  "MAT-ALU-001": { avail: 3200, res: 0 },
  "MAT-ALU-002": { avail: 920, res: 0 },
  "MAT-ALU-003": { avail: 1400, res: 0 },
  "MAT-PLS-001": { avail: 4800, res: 0 },
  "MAT-PLS-002": { avail: 3600, res: 0 },
  "MAT-PLS-003": { avail: 1800, res: 0 },
  "MAT-PLS-004": { avail: 820, res: 0 },
  "MAT-PCB-001": { avail: 2200, res: 200 },
  "MAT-PCB-002": { avail: 1800, res: 0 },
  "MAT-ELC-001": { avail: 5500, res: 0 },
  "MAT-ELC-002": { avail: 680, res: 0 },
  "MAT-ELC-003": { avail: 1200, res: 0 },
  "MAT-ELC-004": { avail: 420, res: 200 },
  "MAT-ELC-005": { avail: 38, res: 0 }, // ⚠ LOW STOCK (38 < 50)
  "MAT-ELC-006": { avail: 1100, res: 0 },
  "MAT-ELC-007": { avail: 680, res: 0 },
  "MAT-INS-001": { avail: 2100, res: 0 },
  "MAT-INS-002": { avail: 5800, res: 0 },
  "MAT-FST-001": { avail: 310, res: 0 },
  "MAT-FST-002": { avail: 195, res: 0 },
  "MAT-SLD-001": { avail: 88, res: 0 },
  "MAT-PKG-001": { avail: 1600, res: 0 },
};

export class MockDataStore {
  private static STORAGE_KEY = "mfg_panasonic_primary_v3";

  private state: {
    materials: MockMaterial[];
    inventory: MockInventoryItem[];
    suppliers: MockSupplier[];
    products: MockProduct[];
    prs: MockPR[];
    pos: MockPO[];
    productionOrders: MockProductionOrder[];
    qcInspections: MockQCInspection[];
    transactions: any[];
    auditLogs: any[];
  };

  constructor() {
    this.state = this.loadState();
  }

  private loadState() {
    try {
      const raw = localStorage.getItem(MockDataStore.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed.materials) &&
          parsed.materials.length >= 20 &&
          parsed.materials.some((m: any) => m.sku === "MAT-COP-001")
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return this.initSeedState();
  }

  private saveState() {
    try {
      localStorage.setItem(MockDataStore.STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // ignore
    }
  }

  private initSeedState() {
    const materials = [...SEED_MATERIALS];
    const inventory: MockInventoryItem[] = materials.map((m) => {
      const s = SEED_STOCK_MAP[m.sku] || { avail: 100, res: 0 };
      return {
        material_id: m.id,
        sku: m.sku,
        name: m.name,
        unit: m.unit,
        hs_code: m.hs_code,
        min_stock_threshold: m.min_stock_threshold,
        available_stock: s.avail,
        reserved_stock: s.res,
        status: s.avail < m.min_stock_threshold ? "Low Stock" : "Normal",
      };
    });

    const suppliers = [...SEED_SUPPLIERS];
    const products = [...SEED_PRODUCTS];

    const prs: MockPR[] = [
      {
        id: "pr-101",
        user_id: "usr-purchasing",
        request_date: new Date().toISOString().split("T")[0],
        status: "Pending",
        items: [
          {
            id: "pri-1",
            material_id: "mat-20",
            quantity: 100,
            material_name: "Refrigerant R32 (Difluoromethane, 10kg Cylinder)",
            material_sku: "MAT-ELC-005",
            unit: "cylinder",
          },
        ],
      },
      {
        id: "pr-102",
        user_id: "usr-purchasing",
        request_date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
        status: "Approved",
        items: [
          {
            id: "pri-2",
            material_id: "mat-4",
            quantity: 5000,
            material_name: "Copper Tube for Refrigerant (OD 9.52mm, ACR Grade)",
            material_sku: "MAT-COP-001",
            unit: "m",
          },
          {
            id: "pri-3",
            material_id: "mat-10",
            quantity: 2000,
            material_name: "ABS Resin Pellet (High-Impact Grade, Natural)",
            material_sku: "MAT-PLS-001",
            unit: "kg",
          },
        ],
      },
    ];

    const pos: MockPO[] = [
      {
        id: "po-201",
        pr_id: "pr-102",
        supplier_id: "sup-4",
        supplier_name: "Kobe Steel Copper Products Asia",
        user_id: "usr-purchasing",
        issue_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        status: "Issued",
        items: [
          {
            id: "poi-1",
            material_id: "mat-4",
            quantity: 5000,
            unit_price: 0.85,
            material_name: "Copper Tube for Refrigerant (OD 9.52mm, ACR Grade)",
            material_sku: "MAT-COP-001",
            unit: "m",
          },
          {
            id: "poi-2",
            material_id: "mat-10",
            quantity: 2000,
            unit_price: 1.45,
            material_name: "ABS Resin Pellet (High-Impact Grade, Natural)",
            material_sku: "MAT-PLS-001",
            unit: "kg",
          },
        ],
      },
    ];

    const productionOrders: MockProductionOrder[] = [
      {
        id: "mo-301",
        product_id: "prod-1",
        product_sku: "PROD-AC-S10",
        product_name: "AC Split Standard 1PK (CS-PN10WKJ)",
        planned_quantity: 300,
        status: "In_Progress",
      },
      {
        id: "mo-302",
        product_id: "prod-2",
        product_sku: "PROD-AC-I10",
        product_name: "AC Split Inverter 1PK (CS-XU10WKPJ)",
        planned_quantity: 200,
        status: "Ready",
        materials: [
          { id: "bom-1", material_id: "mat-19", material_name: "Rotary Compressor (R32, 1PK)", required_quantity: 200, unit: "pcs" },
          { id: "bom-2", material_id: "mat-4", material_name: "Copper Tube for Refrigerant", required_quantity: 1400, unit: "m" },
          { id: "bom-3", material_id: "mat-14", material_name: "PCB Bare Board (4-Layer, FR4)", required_quantity: 200, unit: "pcs" },
        ],
      },
      {
        id: "mo-303",
        product_id: "prod-4",
        product_sku: "PROD-RF-2DR",
        product_name: "Refrigerator 2-Door 268L (NR-BP303VS)",
        planned_quantity: 150,
        status: "Planned",
      },
      {
        id: "mo-304",
        product_id: "prod-6",
        product_sku: "PROD-WM-TT7",
        product_name: "Washing Machine Top Load 7kg (NA-F70A9)",
        planned_quantity: 120,
        status: "Planned",
      },
      {
        id: "mo-305",
        product_id: "prod-8",
        product_sku: "PROD-TV-32H",
        product_name: "LED TV 32-inch HD Ready (TH-32LS600G)",
        planned_quantity: 500,
        status: "Completed",
      },
    ];

    const qcInspections: MockQCInspection[] = [
      {
        id: "qc-401",
        production_record_id: "rec-batch-10",
        product_name: "AC Split Standard 1PK (CS-PN10WKJ)",
        inspector_name: "QC Lead Inspector",
        pass_quantity: 247,
        fail_quantity: 3,
        inspection_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        defects: [
          { defect_reason: "Refrigerant leak at flare joint", quantity: 2 },
          { defect_reason: "Fan blade imbalance — noise beyond tolerance", quantity: 1 },
        ],
      },
    ];

    const auditLogs = [
      {
        id: "aud-1",
        user_name: "System Admin",
        user_role: "Admin",
        user_email: "admin@mfg.com",
        action_type: "SYSTEM_INIT",
        entity_name: "SYSTEM",
        entity_id: "SEED",
        description: "Initialized Panasonic Manufacturing Indonesia operational data: 28 materials with HS codes, 6 suppliers, 9 products",
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: "aud-2",
        user_name: "Purchasing Specialist",
        user_role: "Purchasing",
        user_email: "purchasing@mfg.com",
        action_type: "CREATE_PR",
        entity_name: "PURCHASE_REQUEST",
        entity_id: "pr-101",
        description: "Requisitioned 100 cylinders of Refrigerant R32 (low stock mitigation)",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    return {
      materials,
      inventory,
      suppliers,
      products,
      prs,
      pos,
      productionOrders,
      qcInspections,
      transactions: [],
      auditLogs,
    };
  }

  // ── Route Handlers ──

  login(body: any) {
    let parsedBody = body;
    if (typeof body === "string") {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = {};
      }
    }

    const rawEmail = (parsedBody?.email ?? "").toString().trim();
    const cleanEmail = rawEmail.toLowerCase();

    const roleMap: Record<string, { role: string; name: string }> = {
      "admin@mfg.com": { role: "Admin", name: "System Administrator" },
      "manager@mfg.com": { role: "Manager", name: "Plant Supervisor" },
      "purchasing@mfg.com": { role: "Purchasing", name: "Sourcing Specialist" },
      "warehouse@mfg.com": { role: "Warehouse", name: "Warehouse Keeper" },
      "production@mfg.com": { role: "Production", name: "Shop Floor Lead" },
      "qc@mfg.com": { role: "Quality Control", name: "Quality Assurance Inspector" },
    };

    const usernamePart = cleanEmail && cleanEmail.includes("@") ? cleanEmail.split("@")[0] : (cleanEmail || "admin");
    const user = roleMap[cleanEmail] || {
      role: "Admin",
      name: usernamePart ? usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1) : "Demo User",
    };

    return {
      token: "demo-jwt-token-" + Date.now(),
      user: {
        id: "usr-" + (usernamePart || "admin"),
        email: cleanEmail || "admin@mfg.com",
        name: user.name,
        role: user.role,
      },
    };
  }

  getMaterials(includeInactive = false) {
    if (includeInactive) return this.state.materials;
    return this.state.materials.filter((m) => m.is_active);
  }

  createMaterial(data: Partial<MockMaterial>) {
    const newMat: MockMaterial = {
      id: "mat-" + (this.state.materials.length + 1),
      sku: data.sku || "MAT-NEW-" + Date.now().toString().slice(-4),
      name: data.name || "New Industrial Material",
      unit: data.unit || "kg",
      min_stock_threshold: Number(data.min_stock_threshold) || 0,
      is_active: data.is_active !== false,
      hs_code: data.hs_code || null,
    };
    this.state.materials.unshift(newMat);
    this.state.inventory.unshift({
      material_id: newMat.id,
      sku: newMat.sku,
      name: newMat.name,
      unit: newMat.unit,
      hs_code: newMat.hs_code,
      min_stock_threshold: newMat.min_stock_threshold,
      available_stock: 0,
      reserved_stock: 0,
      status: "Low Stock",
    });
    this.saveState();
    return newMat;
  }

  updateMaterial(id: string, data: Partial<MockMaterial>) {
    const mat = this.state.materials.find((m) => m.id === id);
    if (mat) {
      Object.assign(mat, data);
      const inv = this.state.inventory.find((i) => i.material_id === id);
      if (inv) {
        if (data.name) inv.name = data.name;
        if (data.unit) inv.unit = data.unit;
        if (data.hs_code !== undefined) inv.hs_code = data.hs_code;
        if (data.min_stock_threshold !== undefined) {
          inv.min_stock_threshold = Number(data.min_stock_threshold);
          inv.status = inv.available_stock < inv.min_stock_threshold ? "Low Stock" : "Normal";
        }
      }
      this.saveState();
    }
    return mat;
  }

  getInventory() {
    return this.state.inventory;
  }

  adjustInventory(body: { material_id: string; quantity_change: number; type: string; reference_id?: string }) {
    const item = this.state.inventory.find((i) => i.material_id === body.material_id);
    if (item) {
      const delta = Number(body.quantity_change);
      if (body.type === "Receipt") {
        item.available_stock += Math.abs(delta);
      } else {
        item.available_stock += delta;
      }
      item.status = item.available_stock < item.min_stock_threshold ? "Low Stock" : "Normal";
      this.saveState();
    }
    return item;
  }

  getInventoryTransactions() {
    return this.state.transactions;
  }

  getSuppliers() {
    return this.state.suppliers;
  }

  createSupplier(data: any) {
    const sup: MockSupplier = {
      id: "sup-" + (this.state.suppliers.length + 1),
      name: data.name,
      contact_info: data.contact_info || "",
      is_active: true,
    };
    this.state.suppliers.push(sup);
    this.saveState();
    return sup;
  }

  getPRs() {
    return this.state.prs;
  }

  createPR(data: any) {
    const pr: MockPR = {
      id: "pr-" + (this.state.prs.length + 101),
      user_id: "current-user",
      request_date: new Date().toISOString().split("T")[0],
      status: "Pending",
      items: data.items || [],
    };
    this.state.prs.unshift(pr);
    this.saveState();
    return pr;
  }

  approvePR(id: string, status: "Approved" | "Rejected") {
    const pr = this.state.prs.find((p) => p.id === id);
    if (pr) {
      pr.status = status;
      this.saveState();
    }
    return pr;
  }

  getPOs() {
    return this.state.pos;
  }

  createPO(data: any) {
    const supplier = this.state.suppliers.find((s) => s.id === data.supplier_id);
    const po: MockPO = {
      id: "po-" + (this.state.pos.length + 201),
      pr_id: data.pr_id,
      supplier_id: data.supplier_id,
      supplier_name: supplier?.name || "Industrial Supplier",
      user_id: "current-user",
      issue_date: new Date().toISOString().split("T")[0],
      status: "Issued",
      items: data.items || [],
    };
    this.state.pos.unshift(po);
    this.saveState();
    return po;
  }

  createGR(data: any) {
    const po = this.state.pos.find((p) => p.id === data.po_id);
    if (po) {
      po.status = "Completed";
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          const inv = this.state.inventory.find((i) => i.material_id === item.material_id);
          if (inv) {
            inv.available_stock += Number(item.received_quantity);
            inv.status = inv.available_stock < inv.min_stock_threshold ? "Low Stock" : "Normal";
          }
        }
      }
      this.saveState();
    }
    return { message: "Goods Receipt successfully recorded" };
  }

  getProducts() {
    return this.state.products;
  }

  getProductionOrders() {
    return this.state.productionOrders;
  }

  createProductionOrder(data: any) {
    const prod = this.state.products.find((p) => p.id === data.product_id);
    const order: MockProductionOrder = {
      id: "mo-" + (this.state.productionOrders.length + 301),
      product_id: data.product_id,
      product_sku: prod?.sku || "PROD",
      product_name: prod?.name || "Manufacturing Finished Good",
      planned_quantity: Number(data.planned_quantity) || 10,
      status: "Planned",
      materials: data.materials || [],
    };
    this.state.productionOrders.unshift(order);
    this.saveState();
    return order;
  }

  checkAvailability(id: string) {
    const order = this.state.productionOrders.find((o) => o.id === id);
    return {
      order_id: id,
      is_available: true,
      materials: (order?.materials || []).map((m) => ({
        material_id: m.material_id,
        material_name: m.material_name,
        required: m.required_quantity,
        available: 5000,
        sufficient: true,
      })),
    };
  }

  reserveMaterials(id: string) {
    const order = this.state.productionOrders.find((o) => o.id === id);
    if (order) {
      order.status = "Ready";
      this.saveState();
    }
    return order;
  }

  recordProduction(id: string, qty: number) {
    const order = this.state.productionOrders.find((o) => o.id === id);
    if (order) {
      order.status = "Completed";
      this.saveState();
    }
    return { order_id: id, actual_produced: qty };
  }

  cancelProductionOrder(id: string) {
    const order = this.state.productionOrders.find((o) => o.id === id);
    if (order) {
      order.status = "Cancelled";
      this.saveState();
    }
    return order;
  }

  getInspections() {
    return this.state.qcInspections;
  }

  getPendingInspections() {
    return this.state.productionOrders
      .filter((o) => o.status === "Completed")
      .map((o) => ({
        production_record_id: "rec-" + o.id,
        production_order_id: o.id,
        product_name: o.product_name,
        actual_quantity_produced: o.planned_quantity,
        completion_date: new Date().toISOString().split("T")[0],
      }));
  }

  createInspection(data: any) {
    const insp: MockQCInspection = {
      id: "qc-" + (this.state.qcInspections.length + 401),
      production_record_id: data.production_record_id,
      product_name: data.product_name || "Factory Production Unit",
      inspector_name: "QC Specialist",
      pass_quantity: Number(data.pass_quantity) || 0,
      fail_quantity: Number(data.fail_quantity) || 0,
      inspection_date: new Date().toISOString().split("T")[0],
      defects: data.defects || [],
    };
    this.state.qcInspections.unshift(insp);
    this.saveState();
    return insp;
  }

  getDashboardSummary() {
    const lowStockCount = this.state.inventory.filter((i) => i.status === "Low Stock").length;
    const activeOrders = this.state.productionOrders.filter((o) => o.status === "In_Progress" || o.status === "Ready").length;
    const pendingPRs = this.state.prs.filter((p) => p.status === "Pending").length;

    return {
      kpis: {
        total_skus: this.state.materials.length,
        low_stock_alerts: lowStockCount,
        active_production_orders: activeOrders,
        pending_purchase_requisitions: pendingPRs,
        overall_quality_yield_rate: 98.8,
        active_suppliers_count: this.state.suppliers.length,
      },
      recent_activity: this.state.auditLogs.slice(0, 5),
    };
  }

  getReportsSummary() {
    return {
      yieldRate: 98.8,
      totalSpend: 14250,
      totalMovements: 48,
      totalDefects: 3,
      topDefects: [
        { reason: "Refrigerant leak at flare joint", count: 2 },
        { reason: "Fan blade imbalance", count: 1 },
      ],
      spendBySupplier: [
        { supplier: "Kobe Steel Copper Products Asia", spend: 7150 },
        { supplier: "PT Daikin Compressor Indonesia", spend: 4200 },
        { supplier: "Nippon Steel Indonesia", spend: 2900 },
      ],
    };
  }

  getAuditLogs() {
    return this.state.auditLogs;
  }
}

export const mockStore = new MockDataStore();
