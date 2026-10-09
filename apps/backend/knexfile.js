"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    development: {
        client: "postgresql",
        connection: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/manufacturing_db",
        pool: {
            min: 2,
            max: 10
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
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: "knex_migrations",
            directory: "./db/migrations"
        }
    }
};
exports.default = config;
