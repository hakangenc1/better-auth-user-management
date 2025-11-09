import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
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
import { ChevronDown, Ban, CheckCircle, Shield, Trash2, Mail } from "lucide-react";
import type { User } from "~/types";

interface BulkActionsProps {
  selectedUsers: User[];
  onBulkBan: (userIds: string[]) => Promise<void>;
  onBulkUnban: (userIds: string[]) => Promise<void>;
  onBulkRoleChange: (userIds: string[], role: string) => Promise<void>;
  onBulkDelete: (userIds: string[]) => Promise<void>;
  onBulkEmail: (userIds: string[]) => void;
}

export function BulkActions({
  selectedUsers,
  onBulkBan,
  onBulkUnban,
  onBulkRoleChange,
  onBulkDelete,
  onBulkEmail,
}: BulkActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirmAction) return;

    setIsLoading(true);
    try {
      await confirmAction.action();
      setShowConfirm(false);
      setConfirmAction(null);
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirm = (title: string, description: string, action: () => Promise<void>) => {
    setConfirmAction({ title, description, action });
    setShowConfirm(true);
  };

  const userIds = selectedUsers.map((u) => u.id);

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedUsers.length} selected
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Bulk Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() =>
                openConfirm(
                  "Ban Users",
                  `Are you sure you want to ban ${selectedUsers.length} user(s)?`,
                  () => onBulkBan(userIds)
                )
              }
            >
              <Ban className="mr-2 h-4 w-4" />
              Ban Selected
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                openConfirm(
                  "Unban Users",
                  `Are you sure you want to unban ${selectedUsers.length} user(s)?`,
                  () => onBulkUnban(userIds)
                )
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Unban Selected
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() =>
                openConfirm(
                  "Change Role to Admin",
                  `Change ${selectedUsers.length} user(s) to Admin role?`,
                  () => onBulkRoleChange(userIds, "admin")
                )
              }
            >
              <Shield className="mr-2 h-4 w-4" />
              Make Admin
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                openConfirm(
                  "Change Role to Moderator",
                  `Change ${selectedUsers.length} user(s) to Moderator role?`,
                  () => onBulkRoleChange(userIds, "moderator")
                )
              }
            >
              <Shield className="mr-2 h-4 w-4" />
              Make Moderator
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                openConfirm(
                  "Change Role to User",
                  `Change ${selectedUsers.length} user(s) to User role?`,
                  () => onBulkRoleChange(userIds, "user")
                )
              }
            >
              <Shield className="mr-2 h-4 w-4" />
              Make User
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => onBulkEmail(userIds)}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() =>
                openConfirm(
                  "Delete Users",
                  `Are you sure you want to permanently delete ${selectedUsers.length} user(s)? This action cannot be undone.`,
                  () => onBulkDelete(userIds)
                )
              }
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
