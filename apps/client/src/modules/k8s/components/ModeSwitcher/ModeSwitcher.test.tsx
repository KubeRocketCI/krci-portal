import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModeSwitcher } from "./index";

describe("ModeSwitcher", () => {
  it("shows two segments labeled KRCI and Kubernetes", () => {
    render(<ModeSwitcher mode="krci" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /KRCI/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Kubernetes/i })).toBeInTheDocument();
  });

  it("calls onSelect with 'k8s' when Kubernetes is clicked", async () => {
    const onSelect = vi.fn();
    render(<ModeSwitcher mode="krci" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Kubernetes/i }));
    expect(onSelect).toHaveBeenCalledWith("k8s");
  });

  it("marks the active segment with aria-pressed=true", () => {
    render(<ModeSwitcher mode="k8s" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /Kubernetes/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /KRCI/i })).toHaveAttribute("aria-pressed", "false");
  });
});
