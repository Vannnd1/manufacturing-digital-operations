import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/manufacturing_db",
    acquireConnectionTimeout: 5000,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 5000,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./db/migrations"
    },
    seeds: {
      directory: "./db/seeds"
    }
  },
  test: {
    client: "postgresql",
    connection: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/manufacturing_db_test",
  },
  production: {
    client: "postgresql",
    connection: process.env.DATABASE_URL,
    acquireConnectionTimeout: 5000,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 5000,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./db/migrations"
    }
  }
};

export default config;
