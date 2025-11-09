import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { authClient } from "~/lib/auth.client";
import { Loader2Icon } from "lucide-react";
import type { User } from "~/types";

interface UserBanDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserBanDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserBanDialogProps) {
  const [isBanning, setIsBanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBan = async () => {
    if (!user) return;

    setIsBanning(true);
    setError(null);
    try {
      // Ban user via server action
      const formData = new FormData();
      formData.append("intent", "ban");
      formData.append("userId", user.id);

      await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to ban user";
      setError(errorMessage);
      console.error("Failed to ban user:", error);
    } finally {
      setIsBanning(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isBanning) {
      onOpenChange(newOpen);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban User?</AlertDialogTitle>
          <AlertDialogDescription>
            This will prevent the user from logging in. They will see a message
            that their account has been banned. You can unban them later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {user && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">Email:</span>
              <span className="text-foreground">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">Name:</span>
              <span className="text-foreground">{user.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">Role:</span>
              <span className="text-foreground capitalize">{user.role}</span>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBanning}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBan}
            disabled={isBanning}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            {isBanning && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Ban User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
