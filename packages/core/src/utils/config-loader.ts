import { readFile, access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { ProjectConfigSchema, type ProjectConfig } from "../models/project.js";

export const GLOBAL_CONFIG_DIR = join(homedir(), ".novelsmith");
export const GLOBAL_ENV_PATH = join(GLOBAL_CONFIG_DIR, ".env");

/**
 * Load project config from novelsmith.json with .env overrides.
 * Shared by CLI and Studio — single source of truth for config loading.
 */
export async function loadProjectConfig(root: string): Promise<ProjectConfig> {
  // Load global ~/.novelsmith/.env first, then project .env overrides
  const { config: loadEnv } = await import("dotenv");
  loadEnv({ path: GLOBAL_ENV_PATH });
  loadEnv({ path: join(root, ".env"), override: true });

  const configPath = join(root, "novelsmith.json");

  try {
    await access(configPath);
  } catch {
    throw new Error(
      `novelsmith.json not found in ${root}.\nMake sure you are inside an novelsmith project directory (cd into the project created by 'novelsmith init').`,
    );
  }

  const raw = await readFile(configPath, "utf-8");

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(raw);
  } catch {
    throw new Error(`novelsmith.json in ${root} is not valid JSON. Check the file for syntax errors.`);
  }

  // .env overrides novelsmith.json for LLM settings
  const env = process.env;
  const llm = (config.llm ?? {}) as Record<string, unknown>;
  if (env.NOVELSMITH_LLM_PROVIDER) llm.provider = env.NOVELSMITH_LLM_PROVIDER;
  if (env.NOVELSMITH_LLM_BASE_URL) llm.baseUrl = env.NOVELSMITH_LLM_BASE_URL;
  if (env.NOVELSMITH_LLM_MODEL) llm.model = env.NOVELSMITH_LLM_MODEL;
  if (env.NOVELSMITH_LLM_TEMPERATURE) llm.temperature = parseFloat(env.NOVELSMITH_LLM_TEMPERATURE);
  if (env.NOVELSMITH_LLM_MAX_TOKENS) llm.maxTokens = parseInt(env.NOVELSMITH_LLM_MAX_TOKENS, 10);
  if (env.NOVELSMITH_LLM_THINKING_BUDGET) llm.thinkingBudget = parseInt(env.NOVELSMITH_LLM_THINKING_BUDGET, 10);
  // Extra params from env: NOVELSMITH_LLM_EXTRA_<key>=<value>
  const extraFromEnv: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("NOVELSMITH_LLM_EXTRA_") && value) {
      const paramName = key.slice("NOVELSMITH_LLM_EXTRA_".length);
      // Auto-coerce: numbers, booleans, JSON objects
      if (/^\d+(\.\d+)?$/.test(value)) extraFromEnv[paramName] = parseFloat(value);
      else if (value === "true") extraFromEnv[paramName] = true;
      else if (value === "false") extraFromEnv[paramName] = false;
      else if (value.startsWith("{") || value.startsWith("[")) {
        try { extraFromEnv[paramName] = JSON.parse(value); } catch { extraFromEnv[paramName] = value; }
      }
      else extraFromEnv[paramName] = value;
    }
  }
  if (Object.keys(extraFromEnv).length > 0) {
    llm.extra = { ...(llm.extra as Record<string, unknown> ?? {}), ...extraFromEnv };
  }
  if (env.NOVELSMITH_LLM_API_FORMAT) llm.apiFormat = env.NOVELSMITH_LLM_API_FORMAT;
  config.llm = llm;

  // Global language override
  if (env.NOVELSMITH_DEFAULT_LANGUAGE) config.language = env.NOVELSMITH_DEFAULT_LANGUAGE;

  // API key ONLY from env — never stored in novelsmith.json
  const apiKey = env.NOVELSMITH_LLM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NOVELSMITH_LLM_API_KEY not set. Run 'novelsmith config set-global' or add it to project .env file.",
    );
  }
  llm.apiKey = apiKey;

  return ProjectConfigSchema.parse(config);
}
