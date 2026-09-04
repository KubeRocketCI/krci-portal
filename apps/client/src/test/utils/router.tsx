import type { ReactNode } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";

/** A memory router at "/" with one root route that renders `component`. */
export const createTestRouter = (component: () => ReactNode) =>
  createRouter({
    routeTree: createRootRoute({ component }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    defaultPreload: false,
  });

/**
 * Renders `content` inside a real router; `createLink` components read the router at render time.
 * The initial match resolves on a microtask: query with `find*`, not `get*`.
 */
export const renderWithRouter = (content: ReactNode): RenderResult =>
  render(<RouterProvider router={createTestRouter(() => content)} />);
