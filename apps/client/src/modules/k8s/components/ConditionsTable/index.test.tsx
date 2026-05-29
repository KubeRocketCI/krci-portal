import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConditionsTable } from "./index";

const conds = [
  {
    type: "Established",
    status: "True",
    lastTransitionTime: "2026-05-15T10:00:00Z",
    reason: "InitialNamesAccepted",
    message: "the initial names have been accepted",
  },
  {
    type: "NamesAccepted",
    status: "False",
    lastTransitionTime: "2026-05-15T11:00:00Z",
    reason: "Conflict",
    message: "name conflict with another CRD",
  },
];

describe("ConditionsTable", () => {
  it("renders an empty-state message when conditions array is empty", () => {
    render(<ConditionsTable conditions={[]} />);
    expect(screen.getByText(/no conditions reported/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders all 5 column headers and each condition row", () => {
    render(<ConditionsTable conditions={conds} />);
    for (const h of ["Type", "Status", "Last Transition", "Reason", "Message"]) {
      const header = screen.getByRole("columnheader", { name: h });
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute("scope", "col");
    }
    expect(screen.getByText("Established")).toBeInTheDocument();
    expect(screen.getByText("NamesAccepted")).toBeInTheDocument();
  });

  it("color-codes positive Type badges (Established/True) as success", () => {
    render(<ConditionsTable conditions={conds} />);
    const established = screen.getByText("Established").closest("[data-variant]");
    expect(established?.getAttribute("data-variant")).toBe("success");
  });

  it("color-codes False status of a positive Type as destructive", () => {
    render(<ConditionsTable conditions={conds} />);
    const namesAccepted = screen.getByText("NamesAccepted").closest("[data-variant]");
    expect(namesAccepted?.getAttribute("data-variant")).toBe("destructive");
  });

  it("returns secondary variant for Unknown status regardless of Type", () => {
    const unknown = [
      {
        type: "Established",
        status: "Unknown",
        lastTransitionTime: "2026-05-15T10:00:00Z",
        reason: "",
        message: "",
      },
      {
        type: "SomethingCustom",
        status: "Unknown",
        lastTransitionTime: "2026-05-15T10:00:00Z",
        reason: "",
        message: "",
      },
    ];
    render(<ConditionsTable conditions={unknown} />);
    const established = screen.getByText("Established").closest("[data-variant]");
    const custom = screen.getByText("SomethingCustom").closest("[data-variant]");
    expect(established?.getAttribute("data-variant")).toBe("secondary");
    expect(custom?.getAttribute("data-variant")).toBe("secondary");
  });
});
