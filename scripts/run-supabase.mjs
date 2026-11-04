import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadLocalEnv } from "./local-env.mjs";

loadLocalEnv();
const cli = fileURLToPath(new URL("../node_modules/.bin/supabase", import.meta.url));
const result = spawnSync(cli, process.argv.slice(2), {
  cwd: fileURLToPath(new URL("../", import.meta.url)),
  stdio: "inherit",
});
if (result.error) console.error("Supabase CLI is unavailable. Install the project's dev dependencies first.");
process.exit(result.status ?? 1);
