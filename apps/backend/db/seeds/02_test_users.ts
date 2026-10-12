import type { Knex } from "knex";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function seed(knex: Knex): Promise<void> {
  const roles = await knex("roles").select("id", "name");
  
  const passwordHash = await bcrypt.hash("demo123", 10);
  
  const newUsers = [];
  
  for (const role of roles) {
    if (role.name === "Admin") continue; // Admin already exists
    
    const email = `${role.name.toLowerCase()}@mfg.com`;
    
    // Check if exists
    const existing = await knex("users").where({ email }).first();
    if (!existing) {
      newUsers.push({
        id: crypto.randomUUID(),
        role_id: role.id,
        name: `${role.name} User`,
        email: email,
        password_hash: passwordHash,
        is_active: true
      });
    }
  }
  
  if (newUsers.length > 0) {
    await knex("users").insert(newUsers);
    console.log(`Inserted ${newUsers.length} test users.`);
  } else {
    console.log("Test users already exist.");
  }
}
