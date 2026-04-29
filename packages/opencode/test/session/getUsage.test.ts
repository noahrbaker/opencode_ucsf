import { test, expect } from "bun:test"
import { getUsage } from "../../src/session"

test("getUsage applies tokenCorrectionFactor and computes cost", () => {
  const model: any = {
    cost: {
      input: 1.0,
      output: 2.0,
      cache: { read: 0.1, write: 0.05 },
    },
    limit: { context: 100000, input: undefined, output: 1000 },
    api: { id: "gpt-5", npm: "@ai-sdk/openai-compatible", url: "" },
    id: "gpt-5",
    providerID: "azure",
    name: "gpt-5",
    capabilities: {
      temperature: false,
      reasoning: true,
      attachment: false,
      toolcall: true,
      input: { text: true, audio: false, image: false, video: false, pdf: false },
      output: { text: true, audio: false, image: false, video: false, pdf: false },
      interleaved: false,
    },
  }

  const usageInput: any = {
    inputTokens: 100,
    outputTokens: 200,
    totalTokens: 300,
    inputTokenDetails: { cacheReadTokens: 10, cacheWriteTokens: 5 },
    outputTokenDetails: { reasoningTokens: 20 },
  }

  const res = getUsage({ model, usage: usageInput, tokenCorrectionFactor: 1.4 })

  // Compute expected adjusted token buckets
  const rawInput = 100 - 10 - 5 // 85
  const rawOutput = 200 - 20 // 180
  const rawReasoning = 20
  const rawCacheRead = 10
  const rawCacheWrite = 5
  const factor = 1.4

  const adjInput = Math.round(rawInput * factor)
  const adjOutput = Math.round(rawOutput * factor)
  const adjReasoning = Math.round(rawReasoning * factor)
  const adjCacheRead = Math.round(rawCacheRead * factor)
  const adjCacheWrite = Math.round(rawCacheWrite * factor)

  expect(res.tokens.input).toBe(adjInput)
  expect(res.tokens.output).toBe(adjOutput)
  expect(res.tokens.reasoning).toBe(adjReasoning)
  expect(res.tokens.cache.read).toBe(adjCacheRead)
  expect(res.tokens.cache.write).toBe(adjCacheWrite)

  const expectedCost =
    (adjInput * model.cost.input + adjOutput * model.cost.output + adjCacheRead * model.cost.cache.read + adjCacheWrite * model.cost.cache.write + adjReasoning * model.cost.output) /
    1_000_000

  expect(res.cost).toBeCloseTo(expectedCost, 12)
})
