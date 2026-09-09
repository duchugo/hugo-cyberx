import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { R2Bucket } from "@cloudflare/workers-types";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
export function getRawDb():D1Database{if(!env.DB)throw new Error("D1 unavailable");return env.DB as D1Database}
export function getBucket():R2Bucket{if(!env.BUCKET)throw new Error("R2 unavailable");return env.BUCKET as unknown as R2Bucket}
