import { useState, useEffect } from "react";
import * as React from "react";
import { useOutletContext } from "react-router";
import type { Route } from "./+types/dashboard.profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Alert, AlertDescription } from "~/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { User, Shield, Smartphone, History, AlertCircle, Settings } from "lucide-react";
import { authClient } from "~/lib/auth.client";
import type { User as UserType } from "~/types";
import { ResetSetupButton } from "~/components/setup/ResetSetupButton";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Profile - User Management System" },
    { name: "description", content: "Manage your profile and security settings" },
  ];
}

interface DashboardContext {
  user: UserType;
}

export default function ProfilePage() {
  const { user } = useOutletContext<DashboardContext>();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onSubmit: (password: string) => void;
  }>({
    open: false,
    title: "",
    description: "",
    onSubmit: () => {},
  });
  const [passwordInput, setPasswordInput] = useState("");

  // Check 2FA status on mount
  useEffect(() => {
    // Check if user has 2FA by checking localStorage or making an API call
    const check2FA = async () => {
      try {
        // Try to list 2FA methods - if it succeeds, 2FA is enabled
        const result = await authClient.listSessions();
        // For now, check localStorage as a fallback
        const stored2FA = localStorage.getItem(`2fa_enabled_${user.id}`);
        setTwoFactorEnabled(stored2FA === 'true');
      } catch (error) {
        console.error("Failed to check 2FA status:", error);
      }
    };
    check2FA();
  }, [user.id]);

  // Profile update
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { data, error } = await authClient.updateUser({
        name: profileData.name,
      });

      if (error) {
        throw new Error(error.message || "Failed to update profile");
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await authClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        revokeOtherSessions: true,
      });

      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to change password" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = () => {
    setPasswordDialog({
      open: true,
      title: "Enable Two-Factor Authentication",
      description: "Enter your password to enable 2FA for your account.",
      onSubmit: async (password) => {
        setIsLoading(true);
        setMessage(null);

        try {
          const result = await authClient.twoFactor.enable({
            password,
          });

          if (result.data) {
            setQrCode(result.data.totpURI);
            setBackupCodes(result.data.backupCodes || []);
            setTwoFactorEnabled(true);
            // Store in localStorage for persistence
            localStorage.setItem(`2fa_enabled_${user.id}`, 'true');
            setMessage({ type: "success", text: "2FA enabled! Scan the QR code with your authenticator app." });
          }
        } catch (error) {
          setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to enable 2FA" });
        } finally {
          setIsLoading(false);
          setPasswordDialog({ ...passwordDialog, open: false });
          setPasswordInput("");
        }
      },
    });
  };

  const handleDisable2FA = () => {
    setConfirmDialog({
      open: true,
      title: "Disable Two-Factor Authentication",
      description: "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        setPasswordDialog({
          open: true,
          title: "Confirm Password",
          description: "Enter your password to disable 2FA.",
          onSubmit: async (password) => {
            setIsLoading(true);
            setMessage(null);

            try {
              await authClient.twoFactor.disable({
                password,
              });

              setQrCode(null);
              setBackupCodes([]);
              setTwoFactorEnabled(false);
              // Remove from localStorage
              localStorage.removeItem(`2fa_enabled_${user.id}`);
              setMessage({ type: "success", text: "2FA disabled successfully" });
            } catch (error) {
              setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to disable 2FA" });
            } finally {
              setIsLoading(false);
              setPasswordDialog({ ...passwordDialog, open: false });
              setPasswordInput("");
            }
          },
        });
      },
    });
  };

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.admin.listUserSessions({
        userId: user.id,
      });
      
      if (result.data) {
        setSessions(result.data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      setMessage({ type: "error", text: "Failed to load sessions" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    setConfirmDialog({
      open: true,
      title: "Revoke Session",
      description: "Are you sure you want to revoke this session? You will be logged out from that device.",
      onConfirm: async () => {
        try {
          // Use the admin API to revoke session
          await authClient.admin.revokeUserSession({ sessionToken: sessionId });
          setMessage({ type: "success", text: "Session revoked successfully" });
          loadSessions();
        } catch (error) {
          setMessage({ type: "error", text: "Failed to revoke session" });
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleRevokeAllOtherSessions = () => {
    setConfirmDialog({
      open: true,
      title: "Revoke All Other Sessions",
      description: "Are you sure you want to revoke all other sessions? You will be logged out from all other devices.",
      onConfirm: async () => {
        try {
          // Revoke all sessions except current
          const currentSessionId = sessions.find(s => s.id === user.id)?.id;
          for (const session of sessions) {
            if (session.id !== currentSessionId) {
              await authClient.admin.revokeUserSession({ sessionToken: session.id });
            }
          }
          setMessage({ type: "success", text: "All other sessions revoked successfully" });
          loadSessions();
        } catch (error) {
          setMessage({ type: "error", text: "Failed to revoke sessions" });
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and security</p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="2fa">
            <Smartphone className="h-4 w-4 mr-2" />
            Two-Factor Auth
          </TabsTrigger>
          <TabsTrigger value="sessions" onClick={loadSessions}>
            <History className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
          {user.role === "admin" && (
            <TabsTrigger value="system">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user.role} disabled />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2fa">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <Button
                  onClick={twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
                  variant={twoFactorEnabled ? "destructive" : "default"}
                  disabled={isLoading}
                >
                  {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                </Button>
              </div>

              {qrCode && (
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Scan this QR code with your authenticator app:</p>
                    <img src={qrCode} alt="2FA QR Code" className="border rounded-lg" />
                  </div>

                  {backupCodes.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Backup Codes (save these securely):</p>
                      <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                        {backupCodes.map((code, i) => (
                          <code key={i} className="text-sm">{code}</code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions across devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active sessions found</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{session.userAgent || "Unknown Device"}</p>
                          <p className="text-sm text-muted-foreground">
                            Last active: {new Date(session.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>

                  {sessions.length > 1 && (
                    <Button
                      variant="destructive"
                      onClick={handleRevokeAllOtherSessions}
                    >
                      Revoke All Other Sessions
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "admin" && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Manage system-wide configuration and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="pt-4 border-t border-destructive/20">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                    </div>
                    
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warning:</strong> The actions in this section are irreversible and will permanently delete all data.
                      </AlertDescription>
                    </Alert>

                    <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">Reset Setup Configuration</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Permanently delete all users, sessions, configuration, and database data. This will reset the system to initial setup state.
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                            <li>• All user accounts will be deleted</li>
                            <li>• All sessions will be terminated</li>
                            <li>• All activity logs will be cleared</li>
                            <li>• Configuration will be reset</li>
                            <li>• You must restart the server after reset</li>
                          </ul>
                        </div>
                      </div>
                      <ResetSetupButton />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-2">Alternative Method</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      You can also reset the setup using the command line:
                    </p>
                    <code className="block bg-muted px-4 py-2 rounded-md text-sm">
                      npm run reset-setup
                    </code>
                    <p className="text-sm text-muted-foreground mt-2">
                      Remember to restart your development server after running the reset command.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={passwordDialog.open} onOpenChange={(open) => {
        setPasswordDialog({ ...passwordDialog, open });
        if (!open) setPasswordInput("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{passwordDialog.title}</DialogTitle>
            <DialogDescription>{passwordDialog.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password-input">Password</Label>
              <Input
                id="password-input"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && passwordInput) {
                    passwordDialog.onSubmit(passwordInput);
                  }
                }}
                placeholder="Enter your password"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialog({ ...passwordDialog, open: false });
                setPasswordInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => passwordDialog.onSubmit(passwordInput)}
              disabled={!passwordInput || isLoading}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
