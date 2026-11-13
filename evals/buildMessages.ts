<<<<<<< HEAD
=======
// Helpers for turning a golden test case into the ModelMessage[] history that
// gets fed to the agent. Create cases are trivial (one user turn). Modify
// cases need a fake prior conversation: the original user request, the
// agent's tool call producing seed elements, the matching tool result, the
// agent's confirmation, then the new user turn that asks for a modification.
//
// The whole point is the agent should not be able to tell the difference
// between this fake history and a real session it lived through.

>>>>>>> lesson-6
import type { ModelMessage } from "ai";

export interface SeedData {
  userPrompt: string;
  assistantConfirmation: string;
  elements: unknown[];
}

<<<<<<< HEAD
=======
export type Difficulty = "simple" | "medium" | "hard" | "edge";
export type Category = "create" | "modify" | "domain" | "edge";

>>>>>>> lesson-6
export interface GoldenTestCase {
  id: string;
  input: string;
  seed?: SeedData;
  expectedCharacteristics: string[];
  expectedKeywords?: string[];
  preservedIds?: string[];
<<<<<<< HEAD
  difficulty: "simple" | "medium" | "hard" | "edge";
  category: "create" | "modify" | "domain" | "edge";
=======
  difficulty: Difficulty;
  category: Category;
>>>>>>> lesson-6
}

export function buildMessages(tc: GoldenTestCase): ModelMessage[] {
  if (!tc.seed) {
    return [{ role: "user", content: tc.input }];
  }

  const callId = `seed_${tc.id}`;
  return [
    { role: "user", content: tc.seed.userPrompt },
    {
      role: "assistant",
      content: [
        {
          type: "tool-call",
          toolCallId: callId,
          toolName: "generateDiagram",
          input: { elements: tc.seed.elements },
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: callId,
          toolName: "generateDiagram",
<<<<<<< HEAD
          output: { type: "json", value: { elements: tc.seed.elements as never } },
=======
          output: {
            type: "json",
            value: { elements: tc.seed.elements as never },
          },
>>>>>>> lesson-6
        },
      ],
    },
    { role: "assistant", content: tc.seed.assistantConfirmation },
    { role: "user", content: tc.input },
  ];
}
