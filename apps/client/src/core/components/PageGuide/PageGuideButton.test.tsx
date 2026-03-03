import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageGuideButton } from "./PageGuideButton";

const mockStartTour = vi.fn();
const mockIsTourCompleted = vi.fn(() => false);

vi.mock("@/modules/tours", () => ({
  useTours: () => ({
    startTour: mockStartTour,
    isTourCompleted: mockIsTourCompleted,
    isRunning: false,
    isTourNavigating: false,
    currentTourTab: null,
    skipTour: vi.fn(),
    setOnTourEnd: vi.fn(),
    setStepCallback: vi.fn(),
  }),
  useAutoTour: vi.fn(),
  TOURS_CONFIG: {
    testTour: {
      id: "test_tour",
      title: "Test Tour",
      description: "A test tour",
      showOnce: false,
      trigger: "manual" as const,
      steps: [{ target: "body", content: "step 1" }],
    },
    pageGuideIntro: {
      id: "page_guide_intro",
      title: "Page Guide",
      description: "Intro",
      showOnce: true,
      trigger: "feature" as const,
      featureId: "page-guide",
      steps: [{ target: "body", content: "intro" }],
    },
  },
  buildActivationContext: vi.fn(() => ({
    path: "/test",
    params: {},
    search: {},
  })),
}));

vi.mock("@/modules/tours/utils", () => ({
  isTourEligible: vi.fn(() => true),
}));

vi.mock("@tanstack/react-router", () => ({
  useParams: vi.fn(() => ({})),
}));

describe("PageGuideButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTourCompleted.mockReturnValue(false);
  });

  it("should render nothing for non-existent tour ID", () => {
    const { container } = render(<PageGuideButton tourId="nonExistentTour" />);
    expect(container.innerHTML).toBe("");
  });

  it("should render button for valid tour ID", () => {
    render(<PageGuideButton tourId="testTour" />);
    expect(screen.getByRole("button", { name: /start page tour/i })).toBeInTheDocument();
    expect(screen.getByText("Page Guide")).toBeInTheDocument();
  });

  it("should show pulse indicator when tour is not completed", () => {
    mockIsTourCompleted.mockReturnValue(false);
    render(<PageGuideButton tourId="testTour" />);

    const button = screen.getByRole("button", { name: /start page tour/i });
    const pulse = button.querySelector(".animate-pulse");
    expect(pulse).toBeInTheDocument();
  });

  it("should hide pulse indicator when tour is completed", () => {
    mockIsTourCompleted.mockReturnValue(true);
    render(<PageGuideButton tourId="testTour" />);

    const button = screen.getByRole("button", { name: /start page tour/i });
    const pulse = button.querySelector(".animate-pulse");
    expect(pulse).not.toBeInTheDocument();
  });

  it("should call startTour with correct arguments on click", async () => {
    const user = userEvent.setup();
    render(<PageGuideButton tourId="testTour" />);

    await user.click(screen.getByRole("button", { name: /start page tour/i }));

    expect(mockStartTour).toHaveBeenCalledWith("test_tour", expect.objectContaining({ id: "test_tour" }), {
      type: "manual",
    });
  });
});
