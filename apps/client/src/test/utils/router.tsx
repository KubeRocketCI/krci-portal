import type { ReactNode } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";

/** A memory router at `initialUrl` with one root route that renders `component` at every path. */
export const createTestRouter = (component: () => ReactNode, initialUrl = "/") =>
  createRouter({
    routeTree: createRootRoute({ component }),
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
    defaultPreload: false,
  });

/**
 * Renders `content` inside a real router; `createLink` components read the router at render time.
 * The initial match resolves on a microtask: query with `find*`, not `get*`.
 */
export const renderWithRouter = (content: ReactNode): RenderResult =>
  render(<RouterProvider router={createTestRouter(() => content)} />);
