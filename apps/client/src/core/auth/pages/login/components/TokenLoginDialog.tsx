import { useState } from "react";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Textarea } from "@/core/components/ui/textarea";
import { Label } from "@/core/components/ui/label";
import { Alert } from "@/core/components/ui/alert";

interface TokenLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenSubmit: (token: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function TokenLoginDialog({
  open,
  onOpenChange,
  onTokenSubmit,
  isLoading = false,
  error = null,
}: TokenLoginDialogProps) {
  const [token, setToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onTokenSubmit(token.trim());
    }
  };

  const handleClose = () => {
    setToken("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In with Token</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="token">Access Token or ID Token</Label>
                <Textarea
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your token here..."
                  rows={6}
                  className="font-mono text-sm"
                  disabled={isLoading}
                />
                <p className="text-muted-foreground text-sm">
                  Enter your Keycloak access token or ID token to sign in.
                </p>
              </div>
              {error && (
                <Alert variant="destructive" title="Error">
                  {error}
                </Alert>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isLoading || !token.trim()}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
