import type { Meta, StoryObj } from "@storybook/react-vite";
import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY, type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { expect, screen, userEvent, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import type { RequestError } from "@/core/types/global";
import { ErrorContent } from "./index";

interface FakeErrorInit {
  httpStatus: number;
  code: TRPC_ERROR_CODE_KEY;
  message: string;
  requestId?: string;
}

function createRequestError({ httpStatus, code, message, requestId }: FakeErrorInit): RequestError {
  return TRPCClientError.from({
    error: { code: TRPC_ERROR_CODES_BY_KEY[code], message, data: { code, httpStatus, requestId } },
  });
}

const meta = {
  title: "Core/Components/ErrorContent",
  component: ErrorContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [withAppProviders()],
} satisfies Meta<typeof ErrorContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InternalServerErrorWithRequestId: Story = {
  args: {
    error: createRequestError({
      httpStatus: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "GitFusion request failed: 500 Internal Server Error",
      requestId: "gf-pod/abc123-000042",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Something went wrong. Contact your administrator.")).toBeVisible();
    await expect(canvas.getByText("Request ID: gf-pod/abc123-000042")).toBeVisible();
  },
};

export const BadGatewayWithRequestId: Story = {
  args: {
    error: createRequestError({
      httpStatus: 502,
      code: "BAD_GATEWAY",
      message: "GitFusion request failed: 502 Bad Gateway",
      requestId: "gf-pod/def456-000007",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Something went wrong. Contact your administrator.")).toBeVisible();
    await expect(canvas.getByText("Request ID: gf-pod/def456-000007")).toBeVisible();
  },
};

export const ServiceUnavailableWithoutRequestId: Story = {
  args: {
    error: createRequestError({
      httpStatus: 503,
      code: "SERVICE_UNAVAILABLE",
      message: "GitFusion request failed: 503 Service Unavailable",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("The service is temporarily unavailable. Please try again later.")).toBeVisible();
    await expect(canvas.queryByText(/Request ID:/)).not.toBeInTheDocument();
  },
};

export const Forbidden: Story = {
  args: {
    error: createRequestError({
      httpStatus: 403,
      code: "FORBIDDEN",
      message: "GitFusion request failed: 401 Unauthorized",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Sorry. You don't have permissions to access this data.")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "More details" }));
    await expect(await screen.findByText("GitFusion request failed: 401 Unauthorized")).toBeVisible();
  },
};

export const NotFound: Story = {
  args: {
    error: createRequestError({
      httpStatus: 404,
      code: "NOT_FOUND",
      message: "GitFusion request failed: 404 Not Found",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Sorry. The requested resource was not found.")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "More details" }));
    await expect(await screen.findByText("GitFusion request failed: 404 Not Found")).toBeVisible();
  },
};

export const NotFoundWithRequestId: Story = {
  args: {
    error: createRequestError({
      httpStatus: 404,
      code: "NOT_FOUND",
      message: "GitFusion request failed: 404 Not Found",
      requestId: "gf-pod/ghi789-000013",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Sorry. The requested resource was not found.")).toBeVisible();
    await expect(canvas.getByText("Request ID: gf-pod/ghi789-000013")).toHaveClass("text-center");
  },
};
