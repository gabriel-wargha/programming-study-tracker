import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadLocalEnv } from "./local-env.mjs";

loadLocalEnv();
const project = fileURLToPath(new URL("../", import.meta.url));
const cli = fileURLToPath(new URL("../node_modules/.bin/supabase", import.meta.url));
const result = spawnSync(cli, ["gen", "types", "typescript", "--local", "--schema", "public"], {
  cwd: project,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

if (result.error || result.status !== 0 || !result.stdout?.includes("export type Database")) {
  console.error("Database type generation failed. Check the local CLI and database; the existing type file was preserved.");
  process.exit(1);
}

const directory = new URL("../src/types/", import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL("database.ts", directory), result.stdout);
console.log("Generated src/types/database.ts from the local database.");
