import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Cleanly update any legacy vehicle or dummy product names in database to authentic Panasonic-inspired industrial equipment
  await knex("products")
    .where("name", "ilike", "%sepeda%")
    .update({
      name: "Energy Storage Battery Module (10.5 kWh)",
      sku: "PROD-BMOD-02",
      unit: "module",
    });

  await knex("products")
    .where("name", "ilike", "%skuter%")
    .update({
      name: "Industrial AC Servo Motor & Driver (MINAS A6)",
      sku: "PROD-SRV-01",
      unit: "unit",
    });

  await knex("products")
    .where("name", "ilike", "%industrial motor%")
    .update({
      name: "Air-to-Water Industrial Heat Pump & Inverter",
      sku: "PROD-HP-01",
      unit: "unit",
    });

  // 2. Ensure core industrial master products exist
  const existingEnclosure = await knex("products").where({ sku: "PROD-ENC-01" }).first();
  if (!existingEnclosure) {
    await knex("products").insert({
      id: knex.raw("gen_random_uuid()"),
      sku: "PROD-ENC-01",
      name: "Modular PLC Automation Control Cabinet",
      unit: "unit",
    });
  }

  const existingPdu = await knex("products").where({ sku: "PROD-PDU-03" }).first();
  if (!existingPdu) {
    await knex("products").insert({
      id: knex.raw("gen_random_uuid()"),
      sku: "PROD-PDU-03",
      name: "Factory Floor Intelligent Power Distribution Unit",
      unit: "unit",
    });
  }

  const existingSensor = await knex("products").where({ sku: "PROD-SEN-02" }).first();
  if (!existingSensor) {
    await knex("products").insert({
      id: knex.raw("gen_random_uuid()"),
      sku: "PROD-SEN-02",
      name: "High-Precision CMOS Laser Sensor Unit",
      unit: "unit",
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Safe rollback
}
