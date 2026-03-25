import { Command } from "commander";
import { access, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { log, logError, GLOBAL_ENV_PATH } from "../utils.js";

async function hasGlobalConfig(): Promise<boolean> {
  try {
    const content = await readFile(GLOBAL_ENV_PATH, "utf-8");
    return content.includes("NOVELSMITH_LLM_API_KEY=") && !content.includes("your-api-key-here");
  } catch {
    return false;
  }
}

export const initCommand = new Command("init")
  .description("Initialize an novelsmith project (current directory by default)")
  .argument("[name]", "Project name (creates subdirectory). Omit to init current directory.")
  .option("--lang <language>", "Default writing language: zh (Chinese) or en (English)", "zh")
  .action(async (name: string | undefined, opts: { lang?: string }) => {
    const projectDir = name ? join(process.cwd(), name) : process.cwd();
    const projectName = name ?? basename(projectDir);

    try {
      await mkdir(projectDir, { recursive: true });

      // Check if novelsmith.json already exists
      const configPath = join(projectDir, "novelsmith.json");
      try {
        await access(configPath);
        throw new Error(`novelsmith.json already exists in ${projectDir}. Use a different directory or delete the existing project.`);
      } catch (e) {
        if (e instanceof Error && e.message.includes("already exists")) throw e;
        // File doesn't exist, good
      }

      await mkdir(join(projectDir, "books"), { recursive: true });
      await mkdir(join(projectDir, "radar"), { recursive: true });

      const config = {
        name: projectName,
        version: "0.1.0",
        language: opts.lang ?? "zh",
        llm: {
          provider: process.env.NOVELSMITH_LLM_PROVIDER ?? "openai",
          baseUrl: process.env.NOVELSMITH_LLM_BASE_URL ?? "",
          model: process.env.NOVELSMITH_LLM_MODEL ?? "",
        },
        notify: [],
        daemon: {
          schedule: {
            radarCron: "0 */6 * * *",
            writeCron: "*/15 * * * *",
          },
          maxConcurrentBooks: 3,
        },
      };

      await writeFile(
        join(projectDir, "novelsmith.json"),
        JSON.stringify(config, null, 2),
        "utf-8",
      );

      const global = await hasGlobalConfig();

      if (global) {
        await writeFile(
          join(projectDir, ".env"),
          [
            "# Project-level LLM overrides (optional)",
            "# Global config at ~/.novelsmith/.env will be used by default.",
            "# Uncomment below to override for this project only:",
            "# NOVELSMITH_LLM_PROVIDER=openai",
            "# NOVELSMITH_LLM_BASE_URL=",
            "# NOVELSMITH_LLM_API_KEY=",
            "# NOVELSMITH_LLM_MODEL=",
            "",
            "# Web search (optional):",
            "# TAVILY_API_KEY=tvly-xxxxx",
          ].join("\n"),
          "utf-8",
        );
      } else {
        await writeFile(
          join(projectDir, ".env"),
          [
            "# LLM Configuration",
            "# Tip: Run 'novelsmith config set-global' to set once for all projects.",
            "# Provider: openai (OpenAI / compatible proxy), anthropic (Anthropic native)",
            "NOVELSMITH_LLM_PROVIDER=openai",
            "NOVELSMITH_LLM_BASE_URL=",
            "NOVELSMITH_LLM_API_KEY=",
            "NOVELSMITH_LLM_MODEL=",
            "",
            "# Optional parameters (defaults shown):",
            "# NOVELSMITH_LLM_TEMPERATURE=0.7",
            "# NOVELSMITH_LLM_MAX_TOKENS=8192",
            "# NOVELSMITH_LLM_THINKING_BUDGET=0          # Anthropic extended thinking budget",
            "# NOVELSMITH_LLM_API_FORMAT=chat             # chat (default) or responses (OpenAI Responses API)",
            "",
            "# Web search (optional, for auditor era-research):",
            "# TAVILY_API_KEY=tvly-xxxxx              # Free at tavily.com (1000 searches/month)",
            "",
            "# Anthropic example:",
            "# NOVELSMITH_LLM_PROVIDER=anthropic",
            "# NOVELSMITH_LLM_PROVIDER=anthropic",
            "# NOVELSMITH_LLM_BASE_URL=",
            "# NOVELSMITH_LLM_MODEL=",
          ].join("\n"),
          "utf-8",
        );
      }

      await writeFile(
        join(projectDir, ".gitignore"),
        [".env", "node_modules/", ".DS_Store"].join("\n"),
        "utf-8",
      );

      log(`Project initialized at ${projectDir}`);
      log("");
      if (global) {
        log("Global LLM config detected. Ready to go!");
        log("");
        log("Next steps:");
        if (name) log(`  cd ${name}`);
        log("  novelsmith book create --title '我的小说' --genre xuanhuan --platform tomato");
      } else {
        log("Next steps:");
        if (name) log(`  cd ${name}`);
        log("  # Option 1: Set global config (recommended, one-time):");
        log("  novelsmith config set-global --provider openai --base-url <your-api-url> --api-key <your-key> --model <your-model>");
        log("  # Option 2: Edit .env for this project only");
        log("");
        log("  novelsmith book create --title '我的小说' --genre xuanhuan --platform tomato");
      }
      log("  novelsmith write next <book-id>");
    } catch (e) {
      logError(`Failed to initialize project: ${e}`);
      process.exit(1);
    }
  });
