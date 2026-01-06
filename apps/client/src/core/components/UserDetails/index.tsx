import { DialogProps } from "@/core/providers/Dialog/types";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { useAuth } from "@/core/auth/provider/hooks";
import { InfoColumns } from "@/core/components/InfoColumns";
import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";

type UserDetailsDialogProps = DialogProps<object>;

export default function UserDetailsDialog({ state }: UserDetailsDialogProps) {
  const { open, closeDialog } = state;
  const trpc = useTRPCClient();
  const { user } = useAuth();

  const userInfo = useQuery({
    queryKey: ["auth.me"],
    queryFn: () => trpc.auth.me.query(),
    enabled: open,
    refetchOnMount: true, // Always refetch when dialog opens to get fresh data with issuerUrl
  });

  // Prioritize userInfo.data as it has issuerUrl, fallback to user if needed
  const userData = userInfo.data || user;
  const issuerUrl = userInfo.data?.issuerUrl || (userData as { issuerUrl?: string })?.issuerUrl;

  const infoRows = userData
    ? [
        [
          {
            label: "Name",
            text: userData.name || "N/A",
            columnXs: 6,
          },
          {
            label: "Email",
            text: userData.email || "N/A",
            columnXs: 6,
          },
        ],
        [
          {
            label: "Subject",
            text: userData.sub || "N/A",
            columnXs: 6,
          },
          {
            label: "Issuer URL",
            text: issuerUrl || "N/A",
            columnXs: 6,
          },
        ],
        [
          {
            label: "Groups",
            text:
              userData.groups && userData.groups.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {userData.groups.map((group: string, idx: number) => (
                    <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                      {group}
                    </span>
                  ))}
                </div>
              ) : (
                "N/A"
              ),
            columnXs: 12,
          },
        ],
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {userInfo.isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading user details...</div>
          ) : userData ? (
            <InfoColumns infoRows={infoRows} />
          ) : (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No user information available
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={closeDialog}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
