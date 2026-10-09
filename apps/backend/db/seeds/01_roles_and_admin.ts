import type { Knex } from "knex";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("users").del();
  await knex("roles").del();

  const adminRoleId = crypto.randomUUID();
  
  // Inserts roles
  await knex("roles").insert([
    { id: adminRoleId, name: "Admin", description: "System Administrator" },
    { id: crypto.randomUUID(), name: "Manager", description: "Operations Manager" },
    { id: crypto.randomUUID(), name: "Purchasing", description: "Purchasing Staff" },
    { id: crypto.randomUUID(), name: "Warehouse", description: "Warehouse Staff" },
    { id: crypto.randomUUID(), name: "Production", description: "Production Staff" },
    { id: crypto.randomUUID(), name: "QC", description: "Quality Control" },
  ]);

  // Insert Admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  await knex("users").insert([
    {
      id: crypto.randomUUID(),
      role_id: adminRoleId,
      name: "Admin User",
      email: "admin@mfg.com",
      password_hash: passwordHash,
      is_active: true
    }
  ]);
}
