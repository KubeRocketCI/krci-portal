import type { StorybookConfig } from "@storybook/react-vite";

import { dirname, resolve } from "path";

import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-onboarding"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  viteFinal: async (config) => {
    // Set default environment variables for storybook
    config.define = {
      ...config.define,
      "import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAME": JSON.stringify("in-cluster"),
      "import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAMESPACE": JSON.stringify("default"),
    };

    // Add path alias for storybook utilities
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@sb": resolve(__dirname, "./"),
      },
    };

    return config;
  },
};
export default config;
