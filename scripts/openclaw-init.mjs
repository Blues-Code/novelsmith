#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const OPENCLAW_CONFIG = join(homedir(), ".openclaw", "openclaw.json");

function main() {
  if (!existsSync(OPENCLAW_CONFIG)) {
    console.error("Error: OpenClaw config not found:", OPENCLAW_CONFIG);
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8"));
  const port = config.gateway?.port ?? 18789;
  const token = config.gateway?.auth?.token;
  if (!token) { console.error("Error: gateway token not configured"); process.exit(1); }
  const model = config.agents?.defaults?.model?.primary ?? "bailian/qwen3.5-plus";

  const lines = [];
  lines.push("# Auto-generated from OpenClaw config");
  lines.push("# Regenerate: node scripts/openclaw-init.mjs");
  lines.push("NOVELSMITH_LLM_PROVIDER=custom");
  lines.push("NOVELSMITH_LLM_BASE_URL=http://localhost:" + port + "/v1");
  lines.push("NOVELSMITH_LLM_API_KEY=" + token);
  lines.push("NOVELSMITH_LLM_MODEL=" + model);
  lines.push("NOVELSMITH_LLM_API_FORMAT=responses");
  lines.push("NOVELSMITH_LLM_STREAM=false");
  lines.push("");
  const envContent = lines.join(String.fromCharCode(10));

  const envPath = join(process.cwd(), ".env");
  writeFileSync(envPath, envContent);
  console.log("Done: .env generated from OpenClaw config");
  console.log("  Gateway: http://localhost:" + port + "/v1");
  console.log("  Model:   " + model);
}

main();
