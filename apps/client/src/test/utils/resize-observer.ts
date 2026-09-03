import { vi, type Mock } from "vitest";

export interface ResizeObserverStub {
  callbacks: ResizeObserverCallback[];
  observed: Element[];
  instances: object[];
  disconnect: Mock<() => void>;
}

/**
 * Replaces the global `ResizeObserver` for one test. Call from `beforeEach`; pair with
 * `vi.unstubAllGlobals()` in `afterEach`. Every instance shares one `disconnect` spy.
 * `callbacks` lets a test fire a resize; `observed` lists every element registered.
 */
export const stubResizeObserver = (): ResizeObserverStub => {
  const callbacks: ResizeObserverCallback[] = [];
  const observed: Element[] = [];
  const instances: object[] = [];
  const disconnect = vi.fn();

  vi.stubGlobal(
    "ResizeObserver",
    class {
      disconnect = disconnect;
      unobserve = vi.fn();
      observe = (element: Element) => {
        observed.push(element);
      };

      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback);
        instances.push(this);
      }
    }
  );

  return { callbacks, observed, instances, disconnect };
};
