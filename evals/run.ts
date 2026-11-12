// Import Node.js functions for reading, writing, and creating files/directories.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Import utilities for working with file and directory paths.
import { join, dirname } from "node:path";

// Import utility for converting an ESM module URL into a normal file-system path.
import { fileURLToPath } from "node:url";

// Import Vercel AI SDK functions.
// generateText() runs the LLM and gives us the final result.
// stepCountIs() limits how many agent/tool steps are allowed.
import { generateText, stepCountIs } from "ai";

// Create an OpenAI provider that we can use with the AI SDK.
import { createOpenAI } from "@ai-sdk/openai";

// Import the same tools that our actual agent uses.
// This is important because the eval should test the real tools.
import { tools } from "../src/tools";

// Import the same system prompt used by the actual agent.
// This prevents the agent and eval from using different instructions.
import { SYSTEM_PROMPT } from "../src/system-prompt";

// Import TypeScript types describing our test cases and eval results.
import type { TestCase, EvalResult } from "./types";

// import.meta.url gives us the URL of the current file.
// fileURLToPath() converts that URL into a normal file-system path.
// dirname() gives us the directory containing this eval file.
const __dirname = dirname(fileURLToPath(import.meta.url));

// Move one directory up from /evals to the project root.
const ROOT = join(__dirname, "..");

// This function reads the .dev.vars file.
// We need it because the eval script runs directly with Node,
// while Cloudflare/Wrangler normally loads these variables for the Worker.
function loadDevVars(): Record<string, string> {
  try {
    // Read the .dev.vars file as UTF-8 text.
    const content = readFileSync(join(ROOT, ".dev.vars"), "utf-8");

    // Create an object where we'll store:
    // OPENAI_API_KEY=abc123
    // becomes:
    // { OPENAI_API_KEY: "abc123" }
    const vars: Record<string, string> = {};

    // Split the file into individual lines and process each line.
    for (const line of content.split("\n")) {
      // Remove unnecessary spaces from the beginning/end.
      const trimmed = line.trim();

      // Ignore empty lines and comments beginning with "#".
      if (!trimmed || trimmed.startsWith("#")) continue;

      // Split something like:
      // OPENAI_API_KEY=abc123
      //
      // into:
      // key  = "OPENAI_API_KEY"
      // rest = ["abc123"]
      const [key, ...rest] = trimmed.split("=");

      // If we actually found a key,
      // combine the remaining pieces back together and store it.
      if (key) vars[key.trim()] = rest.join("=").trim();
    }

    // Return all variables we extracted from .dev.vars.
    return vars;
  } catch {
    // If .dev.vars doesn't exist or cannot be read,
    // return an empty object instead of crashing here.
// Eval harness. Runs every test case in evals/datasets/golden.json through
// the agent's core logic and writes raw results to evals/results/<timestamp>.json.
//
// Usage:
//   npm run eval
//
// You then open the results file and score each entry by hand. The scored
// results become the baseline that lessons 5+ improve against.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateText, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { tools } from "../src/tools";
import { SYSTEM_PROMPT } from "../src/system-prompt";
import type { TestCase, EvalResult } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Load OPENAI_API_KEY from .dev.vars (the same file wrangler uses for local dev).
function loadDevVars(): Record<string, string> {
  try {
    const content = readFileSync(join(ROOT, ".dev.vars"), "utf-8");
    const vars: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key) vars[key.trim()] = rest.join("=").trim();
    }
    return vars;
  } catch {
    return {};
  }
}

<<<<<<< HEAD
// Combine environment variables from two places:
//
// 1. loadDevVars() -> variables from .dev.vars
// 2. process.env -> variables already provided by the operating system
//
// If the same variable exists in both places,
// process.env comes later and therefore takes precedence.
const env = { ...loadDevVars(), ...process.env };

// Extract the OpenAI API key from the combined environment.
const apiKey = env.OPENAI_API_KEY;

// We cannot call the OpenAI model without an API key.
// Stop the program early if it isn't available.
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in .dev.vars or environment");

  // Exit the Node.js process with status code 1.
  // 0 normally means success; non-zero means failure.
  process.exit(1);
}

// Create an OpenAI provider using our API key.
// We'll pass this provider to generateText() later.
const openai = createOpenAI({ apiKey });

// This function runs ONE test case from the golden dataset.
//
// Input:
//   testCase
//
// Output:
//   EvalResult
//
// So conceptually:
//
// TestCase
//    ↓
// LLM + tools
//    ↓
// EvalResult
async function runTestCase(testCase: TestCase): Promise<EvalResult> {
  // Record the starting time.
  // We'll use this later to calculate how long the test took.
  const start = Date.now();

  try {
    // Send the test case's input to the model.
    //
    // generateText() is used instead of streamText()
    // because this eval cares about the final result,
    // not the streaming chat experience.
    const result = await generateText({
      // Choose the model that will perform the evaluation task.
      model: openai("gpt-5.4-mini"),

      // Give the model the exact same system instructions
      // used by our real agent.
      system: SYSTEM_PROMPT,

      // Give the model the user's test-case request.
      //
      // Example:
      // "Draw a simple flowchart with Start, Process and End"
      prompt: testCase.input,

      // Give the model access to the same tools
      // that the actual agent has.
      tools,

      // Allow the model/tool loop to run for at most 5 steps.
      //
      // This protects against an agent getting stuck
      // repeatedly calling tools.
      stopWhen: stepCountIs(5),
    });

    // We'll collect all Excalidraw elements generated
    // by the generateDiagram tool.
    //
    // unknown[] means TypeScript doesn't assume
    // what shape each element has yet.
    const elements: unknown[] = [];

    // generateText() can contain multiple execution steps.
    //
    // For example:
    //
    // Step 1 -> model decides to call generateDiagram
    // Step 2 -> tool result goes back to model
    // Step 3 -> model does something else
    //
    // We inspect every step.
    for (const step of result.steps) {
      // Each step may contain tool results.
      //
      // ?? [] means:
      // "If toolResults is undefined/null, use an empty array."
      for (const toolResult of step.toolResults ?? []) {
        // We only care about results produced
        // by our generateDiagram tool.
        if (toolResult.toolName === "generateDiagram") {
          // Tell TypeScript what shape we expect
          // the tool output to have.
          //
          // We're saying:
          // "Treat this output as an object that may contain
          // an elements array."
          const output = toolResult.output as { elements?: unknown[] };

          // Make sure elements actually exists
          // and is an array before using it.
          if (Array.isArray(output?.elements)) {
            // Add the generated diagram elements
            // to our main elements array.
=======
const env = { ...loadDevVars(), ...process.env };
const apiKey = env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in .dev.vars or environment");
  process.exit(1);
}

const openai = createOpenAI({ apiKey });

async function runTestCase(testCase: TestCase): Promise<EvalResult> {
  const start = Date.now();
  try {
    const result = await generateText({
      model: openai("gpt-5.4-mini"),
      system: SYSTEM_PROMPT,
      prompt: testCase.input,
      tools,
      stopWhen: stepCountIs(5),
    });

    // Find any generateDiagram tool calls and pull out the elements they produced.
    const elements: unknown[] = [];
    for (const step of result.steps) {
      for (const toolResult of step.toolResults ?? []) {
        if (toolResult.toolName === "generateDiagram") {
          const output = toolResult.output as { elements?: unknown[] };
          if (Array.isArray(output?.elements)) {
>>>>>>> lesson-5
            elements.push(...output.elements);
          }
        }
      }
    }

<<<<<<< HEAD
    // If everything succeeded, create the EvalResult.
    return {
      // Which test case produced this result?
      testCaseId: testCase.id,

      // Store the original user input.
      input: testCase.input,

      // Store any text response produced by the model.
      response: result.text,

      // Store the actual diagram elements generated by the tool.
      elements,

      // Calculate how long this test case took.
      //
      // Example:
      // start = 1000
      // Date.now() = 3500
      // durationMs = 2500
      durationMs: Date.now() - start,
    };
  } catch (error) {
    // If the model/API/tool execution fails,
    // don't crash the entire eval suite.
    //
    // Instead, return an EvalResult containing the error.
    return {
      testCaseId: testCase.id,
      input: testCase.input,

      // No response because the test failed.
      response: "",

      // No diagram elements because execution failed.
      elements: [],

      // Still record how long the failed test took.
      durationMs: Date.now() - start,

      // Convert the error into a readable string.
      //
      // If it is a normal Error object:
      // error.message
      //
      // Otherwise:
      // String(error)
=======
    return {
      testCaseId: testCase.id,
      input: testCase.input,
      response: result.text,
      elements,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      testCaseId: testCase.id,
      input: testCase.input,
      response: "",
      elements: [],
      durationMs: Date.now() - start,
>>>>>>> lesson-5
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

<<<<<<< HEAD
// main() controls the entire eval process.
//
// The overall flow is:
//
// golden.json
//     ↓
// Load test cases
//     ↓
// Run each test case
//     ↓
// Collect results
//     ↓
// Save results
//     ↓
// Print summary
async function main() {
  // Build the path to the golden dataset.
  //
  // ROOT/evals/datasets/golden.json
  const datasetPath = join(ROOT, "evals/datasets/golden.json");

  // Read the JSON file as text and convert it into JavaScript objects.
  //
  // JSON.parse() turns:
  //
  // '[{"id":"tc-01", ...}]'
  //
  // into:
  //
  // [{ id: "tc-01", ... }]
  const testCases: TestCase[] = JSON.parse(readFileSync(datasetPath, "utf-8"));

  // Tell us how many test cases are about to run.
  console.log(`Running ${testCases.length} test cases...\n`);

  // This array will hold the result of every test case.
  //
  // Example:
  //
  // [
  //   result of tc-01,
  //   result of tc-02,
  //   result of tc-03,
  //   ...
  // ]
  const results: EvalResult[] = [];

  // Run every test case one by one.
  for (const testCase of testCases) {
    // Print something like:
    //
    // [tc-01] simple
    //
    // padEnd(6) makes the difficulty occupy
    // roughly the same amount of space.
    process.stdout.write(`[${testCase.id}] ${testCase.difficulty.padEnd(6)} `);

    // Run the current test case through the LLM + tools.
    const result = await runTestCase(testCase);

    // Store the result so we can later save all results to JSON.
    results.push(result);

    // Check whether this particular test case failed.
    if (result.error) {
      // Print the error.
      console.log(`ERROR: ${result.error}`);
    } else {
      // If successful, show:
      //
      // how many diagram elements were generated
      // and how long the test took.
      console.log(`${result.elements.length} elements, ${result.durationMs}ms`);
    }
  }

  // Create a timestamp for this particular eval run.
  //
  // Example:
  // 2026-11-12T04-30-20.123Z
  //
  // Then replace ":" and "." because they aren't ideal
  // characters for filenames.
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Define where the eval results should be stored.
  //
  // ROOT/evals/results
  const resultsDir = join(ROOT, "evals/results");

  // Create the results directory if it doesn't exist.
  //
  // recursive: true means Node can also create
  // any missing parent directories.
  mkdirSync(resultsDir, { recursive: true });

  // Create the final filename.
  //
  // Example:
  // evals/results/2026-11-12T04-30-20-123Z.json
  const outPath = join(resultsDir, `${timestamp}.json`);

  // Convert all results into formatted JSON
  // and write them to the timestamped file.
  //
  // JSON.stringify(results, null, 2)
  //
  // The "2" makes the JSON readable by humans.
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  // Tell us where the results were saved.
  console.log(`\nResults written to ${outPath}`);

  // Tell the developer what to do next.
  //
  // At this stage, the system has generated raw results,
  // but it hasn't decided whether each result is good or bad.
  console.log(
    `\nNext: open the file, review each result, and add score (1-5) and notes.`,
  );

  // Print a summary section.
  console.log("\n=== Summary ===");

  // Total number of test cases executed.
  console.log(`Total: ${results.length}`);

  // Count how many results contain an error.
  //
  // filter() creates a new array containing
  // only results where r.error exists.
  //
  // .length tells us how many there were.
  console.log(`Errors: ${results.filter((r) => r.error).length}`);

  // Count test cases that:
  //
  // 1. did not produce an error
  // 2. produced zero diagram elements
  //
  // These could indicate an empty/failed generation.
  console.log(
    `Empty results (no elements): ${
      results.filter((r) => !r.error && r.elements.length === 0).length
    }`,
  );

  // Calculate the average duration of all test cases.
  //
  // reduce() adds all durations together.
  //
  // Example:
  //
  // [2000, 3000, 4000]
  //
  // becomes:
  //
  // 9000
  //
  // Then divide by the number of tests:
  //
  // 9000 / 3 = 3000ms
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.durationMs, 0) / results.length,
  );

  // Print the average execution time.
  console.log(`Average duration: ${avgDuration}ms`);
}

// Start the eval program.
//
// main() returns a Promise because it is async.
//
// .catch() handles any unexpected error that escaped
// the error handling inside main().
main().catch((err) => {
  // Print the unexpected error.
  console.error(err);

  // Exit with a failure status.
=======
async function main() {
  const datasetPath = join(ROOT, "evals/datasets/golden.json");
  const testCases: TestCase[] = JSON.parse(readFileSync(datasetPath, "utf-8"));

  console.log(`Running ${testCases.length} test cases...\n`);

  const results: EvalResult[] = [];
  for (const testCase of testCases) {
    process.stdout.write(`[${testCase.id}] ${testCase.difficulty.padEnd(6)} `);
    const result = await runTestCase(testCase);
    results.push(result);
    if (result.error) {
      console.log(`ERROR: ${result.error}`);
    } else {
      console.log(
        `${result.elements.length} elements, ${result.durationMs}ms`
      );
    }
  }

  // Write the raw results to a timestamped file for manual scoring.
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsDir = join(ROOT, "evals/results");
  mkdirSync(resultsDir, { recursive: true });
  const outPath = join(resultsDir, `${timestamp}.json`);
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\nResults written to ${outPath}`);
  console.log(`\nNext: open the file, review each result, and add score (1-5) and notes.`);

  // Quick summary
  console.log("\n=== Summary ===");
  console.log(`Total: ${results.length}`);
  console.log(`Errors: ${results.filter((r) => r.error).length}`);
  console.log(
    `Empty results (no elements): ${results.filter((r) => !r.error && r.elements.length === 0).length}`
  );
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.durationMs, 0) / results.length
  );
  console.log(`Average duration: ${avgDuration}ms`);
}

main().catch((err) => {
  console.error(err);
>>>>>>> lesson-5
  process.exit(1);
});
