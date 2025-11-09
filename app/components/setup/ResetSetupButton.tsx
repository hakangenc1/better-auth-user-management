import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ResetSetupButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleReset = async () => {
    if (confirmText !== "DELETE") {
      return;
    }

    setIsResetting(true);
    
    try {
      const response = await fetch("/api/setup/reset", {
        method: "POST",
      });

      if (response.ok) {
        // Show success message before redirect
        toast.success("Reset successful! Redirecting to setup wizard...", {
          description: "Please restart your development server for changes to take effect.",
          duration: 3000,
        });
        
        // Wait a moment for the toast to show, then redirect
        setTimeout(() => {
          window.location.href = "/setup";
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error("Failed to reset setup", {
          description: data.error || "Please try the command line script: npm run reset-setup",
        });
      }
    } catch (error) {
      toast.error("Failed to reset setup", {
        description: "Network error. Please try the command line script: npm run reset-setup",
      });
    } finally {
      setIsResetting(false);
      setConfirmText("");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setConfirmText("");
    }
  };

  const isConfirmValid = confirmText === "DELETE";

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Reset Setup
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Reset Setup Configuration?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-2">
              <p className="font-semibold text-foreground">This will permanently delete:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• All user accounts and sessions</li>
                <li>• All activity logs and history</li>
                <li>• All 2FA and verification data</li>
                <li>• All configuration settings</li>
                <li>• All database data</li>
              </ul>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3">
              <p className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Important: Restart Required
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You must restart your development server after reset for changes to take effect.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-text" className="text-foreground">
                Type <code className="bg-muted px-1.5 py-0.5 rounded text-destructive font-semibold">DELETE</code> to confirm:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
                autoComplete="off"
                disabled={isResetting}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Alternative: Run <code className="bg-muted px-1 py-0.5 rounded">npm run reset-setup</code> from command line
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={!isConfirmValid || isResetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isResetting ? "Resetting..." : "Reset Setup"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
