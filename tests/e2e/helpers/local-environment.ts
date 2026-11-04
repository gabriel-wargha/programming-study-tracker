/** Test-process guard only. Never import this into application code. */
export function assertLocalTestEnvironment({
  supabaseUrl,
  appUrl,
  vercel,
}: {
  supabaseUrl: string;
  appUrl: string;
  vercel?: string;
}) {
  const supabase = new URL(supabaseUrl);
  const app = new URL(appUrl);
  const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (
    vercel ||
    !loopback.has(supabase.hostname) ||
    !loopback.has(app.hostname) ||
    supabase.protocol !== "http:" ||
    app.protocol !== "http:" ||
    supabase.port !== "54321" ||
    supabase.pathname !== "/" || supabase.search || supabase.hash ||
    supabase.username || supabase.password ||
    app.pathname !== "/" || app.search || app.hash ||
    app.username || app.password
  ) {
    throw new Error("Test users can only be created against loopback development services.");
  }
}
