/**
 * Options for waiting for an element to appear in the DOM
 */
export interface WaitForElementOptions {
  /** CSS selector to find the element */
  selector: string;
  /** Maximum time to wait in milliseconds (default: 5000ms) */
  timeout?: number;
  /** Polling interval for fallback if MutationObserver not supported (default: 100ms) */
  checkInterval?: number;
  /** Root element to search within (default: document.body) */
  context?: Element;
}

/**
 * Wait for an element to appear in the DOM using MutationObserver with polling fallback.
 * This is more reliable than simple polling as it responds immediately when the element appears.
 *
 * @param options - Configuration options
 * @returns Promise that resolves with the element, or rejects on timeout
 *
 * @example
 * ```ts
 * try {
 *   const element = await waitForElement({ selector: '[data-tour="my-element"]', timeout: 3000 });
 *   console.log('Element found:', element);
 * } catch (error) {
 *   console.error('Element not found within timeout');
 * }
 * ```
 */
export function waitForElement(options: WaitForElementOptions): Promise<Element> {
  const { selector, timeout = 5000, checkInterval = 100, context = document.body } = options;

  return new Promise((resolve, reject) => {
    // Try to find the element immediately
    const existingElement = context.querySelector(selector);
    if (existingElement) {
      resolve(existingElement);
      return;
    }

    let observer: MutationObserver | null = null;
    let pollingId: ReturnType<typeof setInterval> | null = null;

    // Cleanup function
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (observer) observer.disconnect();
      if (pollingId) clearInterval(pollingId);
    };

    // Set up timeout
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`));
    }, timeout);

    // Try MutationObserver first (modern approach)
    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        const element = context.querySelector(selector);
        if (element) {
          cleanup();
          resolve(element);
        }
      });

      // Observe all changes to the DOM tree
      observer.observe(context, {
        childList: true,
        subtree: true,
      });
    } else {
      // Fallback to polling for older browsers
      pollingId = setInterval(() => {
        const element = context.querySelector(selector);
        if (element) {
          cleanup();
          resolve(element);
        }
      }, checkInterval);
    }
  });
}

/**
 * Wait for multiple elements to appear in the DOM.
 * All elements must appear before the timeout.
 *
 * @param selectors - Array of CSS selectors to find
 * @param options - Configuration options (applied to all selectors)
 * @returns Promise that resolves with an array of elements
 */
export async function waitForElements(
  selectors: string[],
  options?: Omit<WaitForElementOptions, "selector">
): Promise<Element[]> {
  const promises = selectors.map((selector) => waitForElement({ ...options, selector }));
  return Promise.all(promises);
}
