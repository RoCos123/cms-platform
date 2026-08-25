import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Playwright, spre deosebire de Next.js, nu încarcă .env.local automat.
loadEnv({ path: ".env.local" });

// Config minimal: testul de izolare RLS (e2e/tenant-rls.spec.ts) vorbește
// direct cu Supabase, nu are nevoie de server/browser. webServer + baseURL
// se adaugă când apar primele teste de UI (Faza 2+).
export default defineConfig({
  testDir: "./e2e",
});
