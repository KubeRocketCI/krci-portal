import { composeStories, setProjectAnnotations } from "@storybook/react-vite";
import { describe, it } from "vitest";
import preview from "../../../.storybook/preview";

setProjectAnnotations(preview);

type StoryFile = Parameters<typeof composeStories>[0];
type ComposedStories = Record<string, { run: () => Promise<void> }>;

/** Runs every story and its play function of this module in jsdom. */
const storyFiles = import.meta.glob<StoryFile>("./**/*.stories.tsx", { eager: true });

describe.each(Object.entries(storyFiles))("%s", (_path, module) => {
  it.each(Object.entries(composeStories(module) as ComposedStories))("%s", async (_name, Story) => {
    await Story.run();
  });
});
