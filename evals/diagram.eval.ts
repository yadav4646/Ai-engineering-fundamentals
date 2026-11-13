<<<<<<< HEAD
=======
// The Diagram Agent eval. One eval definition (dataset + task + scorers)
// that we run many times as we improve the agent. Every run becomes a new
// experiment in Braintrust, automatically tagged with the current git
// branch, commit, dirty flag, and commit message — no manual naming needed.
// You compare experiments in the dashboard via the auto collected metadata.
//
// Run with:
//   npm run eval

>>>>>>> lesson-6
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Eval } from "braintrust";
import { createOpenAI } from "@ai-sdk/openai";

import { runAgent } from "../src/agent-core";
import { buildMessages, type GoldenTestCase } from "./buildMessages";
import { schemaScorer, type AgentOutput } from "./scorers/schema";
<<<<<<< HEAD
// import { structureScorer } from "./scorers/structure";
// import { preservationScorer } from "./scorers/preservation";
// import { labelKeywordScorer } from "./scorers/labelKeyword";
=======
import { structureScorer } from "./scorers/structure";
import { preservationScorer } from "./scorers/preservation";
import { labelKeywordScorer } from "./scorers/labelKeyword";
>>>>>>> lesson-6

config({ path: ".dev.vars" });

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

const testCases: GoldenTestCase[] = JSON.parse(
<<<<<<< HEAD
  readFileSync(join("evals", "datasets", "golden.json"), "utf-8"),
=======
  readFileSync(join("evals", "datasets", "golden.json"), "utf-8")
>>>>>>> lesson-6
);

Eval<GoldenTestCase, AgentOutput, GoldenTestCase>("Diagram Agent", {
  data: () =>
    testCases.map((tc) => ({
      input: tc,
      expected: tc,
<<<<<<< HEAD
      metadata: { id: tc.id, difficulty: tc.difficulty, category: tc.category },
=======
      metadata: {
        id: tc.id,
        difficulty: tc.difficulty,
        category: tc.category,
      },
>>>>>>> lesson-6
    })),

  task: async (testCase) => {
    const result = await runAgent({
      model: openai("gpt-5.4-mini"),
      messages: buildMessages(testCase),
<<<<<<< HEAD
=======
      canvasState: testCase.seed?.elements ?? [],
>>>>>>> lesson-6
    });
    return { text: result.text, elements: result.elements };
  },

<<<<<<< HEAD
  scores: [
    schemaScorer,
    // structureScorer,
    // preservationScorer,
    // labelKeywordScorer,
  ],
=======
  scores: [schemaScorer, structureScorer, preservationScorer, labelKeywordScorer],
>>>>>>> lesson-6
});
