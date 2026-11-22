import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModeSwitcher } from "./index";

describe("ModeSwitcher", () => {
  it("shows a segment for each mode", () => {
    render(<ModeSwitcher mode="krci" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /KRCI/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Kubernetes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agent/i })).toBeInTheDocument();
  });

  it("calls onSelect with 'agent' when Agent is clicked", async () => {
    const onSelect = vi.fn();
    render(<ModeSwitcher mode="krci" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Agent/i }));
    expect(onSelect).toHaveBeenCalledWith("agent");
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

  it("shows the label of the active mode only", () => {
    render(<ModeSwitcher mode="agent" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /Agent/i })).toHaveTextContent("Agent");
    expect(screen.getByRole("button", { name: "KRCI Mode" })).toHaveTextContent("");
    expect(screen.getByRole("button", { name: "Kubernetes Mode" })).toHaveTextContent("");
  });

  describe("when minimized", () => {
    const renderMinimized = (mode: "krci" | "k8s", onSelect = () => {}) =>
      render(<ModeSwitcher mode={mode} onSelect={onSelect} isMinimized />);

    it("still exposes every mode as an accessible icon button", () => {
      renderMinimized("krci");
      expect(screen.getByRole("button", { name: /KRCI/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Kubernetes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Agent/i })).toBeInTheDocument();
    });

    it("keeps the active mode marked with aria-pressed=true", () => {
      renderMinimized("k8s");
      expect(screen.getByRole("button", { name: /Kubernetes/i })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: /KRCI/i })).toHaveAttribute("aria-pressed", "false");
    });

    it("calls onSelect when an icon button is clicked", async () => {
      const onSelect = vi.fn();
      renderMinimized("krci", onSelect);
      await userEvent.click(screen.getByRole("button", { name: /Kubernetes/i }));
      expect(onSelect).toHaveBeenCalledWith("k8s");
    });
  });
});
