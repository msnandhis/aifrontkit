import assert from "node:assert/strict";
import test from "node:test";
import { probeFileFor, selectPins } from "./verify-upstream-release.mjs";

const pins = [
  { id: "first", pinned: "1.0.0" },
  { id: "second", pinned: "2.0.0" }
];

test("selects a deterministic compatibility release subset", () => {
  assert.deepEqual(selectPins(pins, ["second"]), [pins[1]]);
  assert.deepEqual(selectPins(pins, []), pins);
});

test("rejects unknown compatibility release ids", () => {
  assert.throws(() => selectPins(pins, ["missing"]), /Unknown compatibility release: missing/);
});

test("selects a provider-owned contract probe for every supported package family", () => {
  assert.equal(probeFileFor("ai"), "ai-sdk-ui-stream.ts");
  assert.equal(probeFileFor("@ag-ui/core"), "ag-ui-events.ts");
  assert.equal(probeFileFor("@langchain/langgraph"), "langgraph-stream-state.ts");
});

test("fails closed when a package has no contract probe", () => {
  assert.throws(() => probeFileFor("unknown-provider"), /No provider contract probe is configured/);
});
