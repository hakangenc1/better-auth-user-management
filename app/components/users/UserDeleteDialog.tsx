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

interface UserDeleteDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserDeleteDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    setError(null);
    try {
      // Delete user via server action
      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("userId", user.id);

      await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      setError(errorMessage);
      console.error("Failed to delete user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(newOpen);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user
            account and remove their data from the system.
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
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
