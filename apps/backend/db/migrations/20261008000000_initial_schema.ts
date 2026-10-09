import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("roles", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("name").notNullable().unique();
    table.string("description");
  });

  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("role_id").references("id").inTable("roles").onDelete("RESTRICT");
    table.string("name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.boolean("is_active").defaultTo(true);
  });

  await knex.schema.createTable("materials", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("sku").notNullable().unique();
    table.string("name").notNullable();
    table.string("unit").notNullable();
    table.decimal("min_stock_threshold", 10, 2).defaultTo(0);
  });

  await knex.schema.createTable("products", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("sku").notNullable().unique();
    table.string("name").notNullable();
    table.string("unit").notNullable();
  });

  await knex.schema.createTable("suppliers", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("name").notNullable().unique();
    table.string("contact_info");
  });

  await knex.schema.createTable("purchase_requests", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("user_id").references("id").inTable("users").onDelete("RESTRICT");
    table.date("request_date").notNullable();
    table.string("status").defaultTo("Draft"); // Draft, Pending, Approved, Rejected, Fulfilled
  });

  await knex.schema.createTable("purchase_request_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("pr_id").references("id").inTable("purchase_requests").onDelete("CASCADE");
    table.uuid("material_id").references("id").inTable("materials").onDelete("RESTRICT");
    table.decimal("quantity", 10, 2).notNullable();
  });

  await knex.schema.createTable("purchase_orders", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("pr_id").references("id").inTable("purchase_requests").onDelete("SET NULL").nullable();
    table.uuid("supplier_id").references("id").inTable("suppliers").onDelete("RESTRICT");
    table.uuid("user_id").references("id").inTable("users").onDelete("RESTRICT");
    table.date("issue_date").notNullable();
    table.string("status").defaultTo("Draft"); // Draft, Issued, Partially_Received, Completed
  });

  await knex.schema.createTable("purchase_order_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("po_id").references("id").inTable("purchase_orders").onDelete("CASCADE");
    table.uuid("material_id").references("id").inTable("materials").onDelete("RESTRICT");
    table.decimal("quantity", 10, 2).notNullable();
    table.decimal("unit_price", 10, 2).notNullable();
  });

  await knex.schema.createTable("goods_receipts", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("po_id").references("id").inTable("purchase_orders").onDelete("RESTRICT");
    table.uuid("user_id").references("id").inTable("users").onDelete("RESTRICT");
    table.date("receipt_date").notNullable();
  });

  await knex.schema.createTable("goods_receipt_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("receipt_id").references("id").inTable("goods_receipts").onDelete("CASCADE");
    table.uuid("po_item_id").references("id").inTable("purchase_order_items").onDelete("RESTRICT");
    table.decimal("received_quantity", 10, 2).notNullable();
  });

  await knex.schema.createTable("inventory", (table) => {
    table.uuid("material_id").primary().references("id").inTable("materials").onDelete("CASCADE");
    table.decimal("available_stock", 10, 2).defaultTo(0);
    table.decimal("reserved_stock", 10, 2).defaultTo(0);
    // Explicit constraint to ensure stock doesn't go below zero
    table.check("available_stock >= 0", undefined, "chk_inv_available");
    table.check("reserved_stock >= 0", undefined, "chk_inv_reserved");
  });

  await knex.schema.createTable("inventory_transactions", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("material_id").references("id").inTable("materials").onDelete("RESTRICT");
    table.string("transaction_type").notNullable(); // Receipt, Reservation, Consumption, Adjustment
    table.decimal("quantity_change", 10, 2).notNullable();
    table.string("reference_id");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("production_orders", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("product_id").references("id").inTable("products").onDelete("RESTRICT");
    table.decimal("planned_quantity", 10, 2).notNullable();
    table.string("status").defaultTo("Planned"); // Planned, Ready, In_Progress, Completed, Cancelled
  });

  await knex.schema.createTable("production_order_materials", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("prodo_id").references("id").inTable("production_orders").onDelete("CASCADE");
    table.uuid("material_id").references("id").inTable("materials").onDelete("RESTRICT");
    table.decimal("required_quantity", 10, 2).notNullable();
  });

  await knex.schema.createTable("material_reservations", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("prodo_id").references("id").inTable("production_orders").onDelete("CASCADE");
    table.uuid("material_id").references("id").inTable("materials").onDelete("RESTRICT");
    table.decimal("reserved_quantity", 10, 2).notNullable();
  });

  await knex.schema.createTable("production_records", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("prodo_id").references("id").inTable("production_orders").onDelete("RESTRICT");
    table.decimal("actual_quantity_produced", 10, 2).notNullable();
    table.date("completion_date").notNullable();
  });

  await knex.schema.createTable("quality_inspections", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("production_record_id").references("id").inTable("production_records").onDelete("RESTRICT").unique();
    table.uuid("inspector_id").references("id").inTable("users").onDelete("RESTRICT");
    table.decimal("pass_quantity", 10, 2).notNullable();
    table.decimal("fail_quantity", 10, 2).notNullable();
    table.date("inspection_date").notNullable();
  });

  await knex.schema.createTable("defect_records", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("inspection_id").references("id").inTable("quality_inspections").onDelete("CASCADE");
    table.string("defect_reason").notNullable();
    table.decimal("quantity", 10, 2).notNullable();
  });

  await knex.schema.createTable("finished_goods_records", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("product_id").references("id").inTable("products").onDelete("RESTRICT");
    table.uuid("inspection_id").references("id").inTable("quality_inspections").onDelete("RESTRICT");
    table.decimal("quantity", 10, 2).notNullable();
  });

  await knex.schema.createTable("audit_logs", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("user_id").references("id").inTable("users").onDelete("SET NULL").nullable();
    table.string("action_type").notNullable();
    table.string("entity_name").notNullable();
    table.string("entity_id").notNullable();
    table.text("description");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_logs");
  await knex.schema.dropTableIfExists("finished_goods_records");
  await knex.schema.dropTableIfExists("defect_records");
  await knex.schema.dropTableIfExists("quality_inspections");
  await knex.schema.dropTableIfExists("production_records");
  await knex.schema.dropTableIfExists("material_reservations");
  await knex.schema.dropTableIfExists("production_order_materials");
  await knex.schema.dropTableIfExists("production_orders");
  await knex.schema.dropTableIfExists("inventory_transactions");
  await knex.schema.dropTableIfExists("inventory");
  await knex.schema.dropTableIfExists("goods_receipt_items");
  await knex.schema.dropTableIfExists("goods_receipts");
  await knex.schema.dropTableIfExists("purchase_order_items");
  await knex.schema.dropTableIfExists("purchase_orders");
  await knex.schema.dropTableIfExists("purchase_request_items");
  await knex.schema.dropTableIfExists("purchase_requests");
  await knex.schema.dropTableIfExists("suppliers");
  await knex.schema.dropTableIfExists("products");
  await knex.schema.dropTableIfExists("materials");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("roles");
}
