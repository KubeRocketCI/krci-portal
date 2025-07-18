import { useQueryClient } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "..";

export default function AppRouter() {
  const queryClient = useQueryClient();

  return <RouterProvider router={router} context={{ queryClient }} />;
}
