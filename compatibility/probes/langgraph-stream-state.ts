import {
  StateGraph,
  type StateSnapshot,
  type StreamMode
} from "@langchain/langgraph";

const reviewedStreamModes = ["messages", "updates"] satisfies StreamMode[];
const reviewedSnapshot = {
  values: { answer: "Ready" },
  next: ["review"],
  config: { configurable: { thread_id: "compatibility-thread", checkpoint_id: "compatibility-checkpoint" } },
  metadata: { source: "loop", step: 1, parents: {} },
  createdAt: "2026-08-31T00:00:00.000Z",
  tasks: []
} satisfies StateSnapshot;

if (typeof StateGraph !== "function") throw new Error("LangGraph StateGraph is not constructable");
if (reviewedStreamModes.join("|") !== "messages|updates") throw new Error("LangGraph stream modes changed shape");
if (reviewedSnapshot.config.configurable?.checkpoint_id !== "compatibility-checkpoint") {
  throw new Error("LangGraph StateSnapshot configurable boundary changed shape");
}
