#!/usr/bin/env node
/**
 * Smoke call: verifies the AI token works and returns a valid response.
 *
 * Usage: node scripts/smoke-briefing.mjs
 *
 * This script makes a real call to the Anthropic API with a minimal payload
 * to confirm the token is valid and the model is reachable. It prints the
 * response or a clear error message.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load env from .env.local manually (dotenv not in dependencies)
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌ .env.local not found. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv();

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const modelId = process.env.AI_MODEL;
  const baseUrl = process.env.AI_BASE_URL; // Optional custom base URL

  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY is not set in .env.local");
    process.exit(1);
  }
  if (!modelId) {
    console.error("❌ AI_MODEL is not set in .env.local");
    process.exit(1);
  }

  console.log(`🔍 Smoke call to ${modelId}...`);
  if (baseUrl) {
    console.log(`   Base URL: ${baseUrl}`);
  }

  try {
    const anthropic = createAnthropic({
      apiKey,
      ...(baseUrl ? { baseURL: baseUrl } : {}),
    });

    const model = anthropic(modelId);

    const result = await generateText({
      model,
      maxRetries: 0,
      prompt: 'Respond with exactly: {"summary":"Smoke test succeeded."}',
    });

    console.log(`\n✅ Smoke call succeeded!`);
    console.log(`   Response: ${result.text}`);
    console.log(`   Tokens: ${result.usage?.inputTokens ?? "?"} in, ${result.usage?.outputTokens ?? "?"} out`);

    // Verify the response is valid JSON
    try {
      JSON.parse(result.text);
      console.log(`   ✓ Response is valid JSON`);
    } catch {
      console.log(`   ✗ Response is NOT valid JSON (this may still work with retry)`);
    }
  } catch (error) {
    console.error(`\n❌ Smoke call failed:`);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.message.includes("401")) {
        console.error(`\n   The API key is invalid. Check ANTHROPIC_API_KEY in .env.local.`);
      } else if (error.message.includes("404")) {
        console.error(`\n   The model "${modelId}" was not found. Check AI_MODEL in .env.local.`);
        console.error(`   If a custom base URL is needed, set AI_BASE_URL in .env.local.`);
      }
    }
    process.exit(1);
  }
}

main();
