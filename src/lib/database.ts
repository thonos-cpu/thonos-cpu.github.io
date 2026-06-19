import "server-only";

import postgres, { type Sql } from "postgres";

let client: Sql | null = null;

export class DatabaseConfigurationError extends Error {
  constructor(message = "Analytics database is not configured.") {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

export function analyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
}

export function getSql(): Sql {
  if (!process.env.DATABASE_URL) throw new DatabaseConfigurationError();
  if (!client) {
    client = postgres(process.env.DATABASE_URL, {
      max: 4,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
      prepare: false,
    });
  }
  return client;
}
