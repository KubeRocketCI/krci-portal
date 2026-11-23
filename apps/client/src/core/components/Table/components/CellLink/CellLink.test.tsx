import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Box } from "lucide-react";
import { CellLink, CellExternalLink } from "./index";
import { renderWithRouter } from "@/test/utils/router";

// Same path as `PATH_K8S_NODE_DETAIL_FULL` (modules/k8s/pages/nodes/detail/route.ts). Not imported: that
// module pulls in the tRPC client through `@/core/router/routes` and `_root.ts`. Route types are registered
// globally in `core/router/types.ts`, so the literal type-checks against the real route (params `clusterName`, `name`).
const PATH_NODE_DETAIL = "/c/$clusterName/k8s/nodes/$name";

describe("CellLink", () => {
  it("renders a router target as a link with the button link classes and whitespace-normal", async () => {
    renderWithRouter(<CellLink to={PATH_NODE_DETAIL} params={{ clusterName: "c1", name: "widget" }} text="Home" />);

    const link = await screen.findByRole("link", { name: "Home" });
    expect(link).toHaveAttribute("href", "/c/c1/k8s/nodes/widget");
    expect(link).toHaveAttribute("data-slot", "cell-link");
    expect(link).toHaveClass("w-full", "justify-start", "p-0", "whitespace-normal");
  });

  it("renders an href target as an anchor opening in a new tab", () => {
    render(<CellExternalLink href="https://example.com" text="Example" />);

    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the icon shrink-0 and the text through TextWithTooltip", () => {
    render(<CellExternalLink href="#" icon={Box} text="With icon" />);

    const icon = document.querySelector("svg");
    expect(icon).toHaveClass("shrink-0");

    const textNode = screen.getByText("With icon");
    expect(textNode.tagName).toBe("P");
    expect(textNode).toHaveClass("line-clamp-1");
  });

  it("merges className onto the Button", () => {
    render(<CellExternalLink href="#" text="Foo" className="custom-class" />);

    const link = screen.getByRole("link", { name: "Foo" });
    expect(link).toHaveClass("custom-class");
  });

  it("renders the icon alone for an icon-only link, named by its aria-label", () => {
    render(<CellExternalLink href="https://example.com/test/7" iconOnly icon={Box} aria-label="Open the test" />);

    const link = screen.getByRole("link", { name: "Open the test" });
    expect(link).toHaveAttribute("href", "https://example.com/test/7");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.querySelector("svg")).toHaveClass("shrink-0");
    expect(link.textContent).toBe("");
    expect(link).not.toHaveAttribute("iconOnly");
  });

  it("requires an aria-label for an icon-only link (type-only; never rendered)", () => {
    // @ts-expect-error An icon-only link has no text to name it: it needs an aria-label.
    const element = <CellExternalLink href="#" iconOnly icon={Box} />;
    expect(element).toBeDefined();
  });

  it("locks `params` to the route's own keys (type-only; never rendered)", () => {
    // @ts-expect-error PATH_NODE_DETAIL's params are `clusterName` and `name`, not `wrongName`.
    const element = <CellLink to={PATH_NODE_DETAIL} params={{ clusterName: "c1", wrongName: "widget" }} text="x" />;
    expect(element).toBeDefined();
  });
});
