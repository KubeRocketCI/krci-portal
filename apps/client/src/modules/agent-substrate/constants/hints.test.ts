import { describe, expect, it } from "vitest";
import { PAGE_DESCRIPTION, SECTION_HINT, TERM_HINT } from "./hints";

/** Sentence ends: `.`, `!` or `?` before a space or the end of the text. */
const sentencesOf = (text: string) => text.split(/(?<=[.!?])(?:\s+|$)/).filter((sentence) => sentence.length > 0);

const ALL_TEXTS = { ...PAGE_DESCRIPTION, ...SECTION_HINT, ...TERM_HINT };

describe("hints", () => {
  it("keeps every text to one or two sentences", () => {
    for (const [key, text] of Object.entries(ALL_TEXTS)) {
      const count = sentencesOf(text).length;
      expect(count, key).toBeGreaterThanOrEqual(1);
      expect(count, key).toBeLessThanOrEqual(2);
    }
  });

  it("counts the sentences of a text", () => {
    expect(sentencesOf("One. Two.")).toHaveLength(2);
    expect(sentencesOf("One: 1.0 CPU, 2.0 Gi. Two; three.")).toHaveLength(2);
  });

  it("states the scheduling rule in the worker selector, worker labels, size and room texts", () => {
    expect(TERM_HINT.workerSelector).toBe("Labels a worker must have to host this actor. Every key must match.");
    expect(TERM_HINT.workerLabels).toBe(
      "Labels of the WorkerPool, copied to its workers. Worker selectors match against them."
    );
    expect(TERM_HINT.size).toBe(
      "CPU and memory limits of the actor template. A worker books them plus the runtime overhead."
    );
    expect(TERM_HINT.room).toBe("Actors of the room size that can still start.");
    expect(TERM_HINT.roomSize).toBe(
      "The largest CPU and memory limits over the actor templates that can use this worker pool."
    );
    expect(TERM_HINT.replicas).toBe("Workers desired and ready.");
    expect(TERM_HINT.limitedBy).toBe(
      "The worker resources that bound room: those whose free amount fits the fewest actors of the room size."
    );
    expect(TERM_HINT.actorState).toBe(
      "The lifecycle state of an actor. Suspended: it holds no worker, as between agent turns or after a resume that found no room."
    );
  });
});
