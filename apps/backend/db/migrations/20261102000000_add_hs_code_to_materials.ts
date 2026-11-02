import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("materials", (table) => {
    // HS Code (Harmonized System) — used for customs/trade classification.
    // Optional field; null means not yet assigned.
    table.string("hs_code", 20).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("materials", (table) => {
    table.dropColumn("hs_code");
  });
}
