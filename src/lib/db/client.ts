import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Server-side only (spec §26: server-side storage credentials, no secrets
// in client bundles). Never import this from client components.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
