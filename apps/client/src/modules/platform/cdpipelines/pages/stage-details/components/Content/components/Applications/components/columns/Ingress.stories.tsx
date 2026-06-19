import type { Meta, StoryObj } from "@storybook/react-vite";
import { IngressColumn, type ExposureURL } from "./Ingress";

// Minimal Application shape — only the fields IngressColumn reads
type MockApplication = {
  status?: {
    summary?: {
      externalURLs?: string[];
    };
  };
};

const meta = {
  title: "CDPipelines/Stage/URLs Column",
  component: IngressColumn,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof IngressColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

const app = (externalURLs: string[] = []): MockApplication =>
  ({ status: { summary: { externalURLs } } }) as MockApplication;

/** Zero state: no Argo URLs, no extraURLs */
export const Empty: Story = {
  args: {
    application: app() as never,
    extraURLs: [],
  },
};

/** Two URLs sourced from Argo CD externalURLs only (existing behavior) */
export const IngressOnly: Story = {
  args: {
    application: app(["https://myapp.example.com", "http://myapp-int.example.com"]) as never,
    extraURLs: [],
  },
};

/** Two URLs derived from HTTPRoute / Gateway API only */
export const HTTPRouteOnly: Story = {
  args: {
    application: app() as never,
    extraURLs: [
      {
        url: "https://www.example.com/",
        kind: "HTTPRoute",
        healthy: true,
      },
      {
        url: "https://api.example.com/v2",
        kind: "HTTPRoute",
        healthy: true,
      },
    ] satisfies ExposureURL[],
  },
};

/** Two Argo Ingress URLs + two HTTPRoute URLs — grouped dropdown with section headers */
export const Mixed: Story = {
  args: {
    application: app(["https://myapp.example.com", "http://myapp-int.example.com"]) as never,
    extraURLs: [
      {
        url: "https://www.example.com/",
        kind: "HTTPRoute",
        healthy: true,
      },
      {
        url: "https://api.example.com/v2",
        kind: "HTTPRoute",
        healthy: true,
      },
    ] satisfies ExposureURL[],
  },
};

/**
 * One healthy Argo URL + one degraded HTTPRoute URL (BackendNotFound).
 * Badge shows ⚠ amber count; unhealthy entry is non-clickable with reason.
 *
 * Mirrors the real fixture:
 *   HTTPRoute "backend" -> parentRef Gateway "eg" (Accepted=True, ResolvedRefs=True)
 *   A second (imaginary) route has ResolvedRefs=False: BackendNotFound
 */
export const Degraded: Story = {
  args: {
    application: app(["https://myapp.example.com"]) as never,
    extraURLs: [
      {
        url: "https://www.example.com/",
        kind: "HTTPRoute",
        healthy: false,
        reason: "BackendNotFound · backend Service not found",
      },
    ] satisfies ExposureURL[],
  },
};

/**
 * Realistic fixture from harvested samples:
 *   Gateway "eg" (class eg) http:80 Accepted=True, Programmed=False/AddressNotAssigned
 *   HTTPRoute "backend" hostnames=[www.example.com] -> Service backend:3000
 *   HTTPRoute status: Accepted=True, ResolvedRefs=True
 *
 * Gateway is usable (AddressNotAssigned is normal in kind clusters).
 * Both URLs are healthy; one Ingress from Argo, one HTTPRoute derived.
 */
export const RealisticKindCluster: Story = {
  name: "Realistic — kind cluster (AddressNotAssigned)",
  args: {
    application: app(["http://myapp-int.example.com"]) as never,
    extraURLs: [
      {
        url: "http://www.example.com/",
        kind: "HTTPRoute",
        healthy: true,
      },
    ] satisfies ExposureURL[],
  },
};
