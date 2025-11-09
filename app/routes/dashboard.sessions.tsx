import { useState, useEffect } from "react";
import type { Route } from "./+types/dashboard.sessions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
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
import { ScrollArea } from "~/components/ui/scroll-area";
import { Smartphone, Monitor, Tablet, X, Search, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { authClient } from "~/lib/auth.client";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Session Management - User Management System" },
    { name: "description", content: "Manage user sessions across the platform" },
  ];
}

interface UserSession {
  id: string;
  token: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAgent: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

const ITEMS_PER_PAGE = 10;

export default function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<UserSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => { },
  });

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = sessions.filter(
        (session) =>
          session.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.userAgent.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSessions(filtered);
    } else {
      setFilteredSessions(sessions);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery, sessions]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // Get all users first
      const usersResult = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      });

      if (usersResult.error) {
        // Check if it's a permission error
        if (usersResult.error.status === 403) {
          setMessage({
            type: "error",
            text: "Access denied. You need admin privileges to view sessions. Please log in as an admin user or contact an administrator."
          });
          setIsLoading(false);
          return;
        }
        throw new Error(usersResult.error.message || "Failed to load users");
      }

      // Get sessions for each user
      const allSessions: UserSession[] = [];
      const users = usersResult.data?.users || [];

      for (const user of users) {
        try {
          const sessionsResult = await authClient.admin.listUserSessions({
            userId: user.id,
          });

          if (sessionsResult.data?.sessions) {
            const userSessions = sessionsResult.data.sessions.map((session: any) => ({
              id: session.id,
              token: session.token || session.id, // Use token if available, fallback to id
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              userAgent: session.userAgent || "Unknown Device",
              ipAddress: session.ipAddress,
              createdAt: new Date(session.createdAt),
              updatedAt: new Date(session.updatedAt),
              expiresAt: new Date(session.expiresAt),
            }));
            allSessions.push(...userSessions);
          }
        } catch (error) {
          console.error(`Failed to load sessions for user ${user.id}:`, error);
        }
      }

      // Sort sessions by updatedAt descending (most recent first)
      allSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      setSessions(allSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load sessions. Please check your permissions."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = (sessionToken: string, userName: string) => {
    setConfirmDialog({
      open: true,
      title: "Revoke Session",
      description: `Are you sure you want to revoke the session for ${userName}? This will log them out from that device.`,
      onConfirm: async () => {
        try {
          const result = await authClient.admin.revokeUserSession({
            sessionToken: sessionToken,
          });

          if (result.error) {
            throw new Error(result.error.message || "Failed to revoke session");
          }

          setMessage({ type: "success", text: "Session revoked successfully" });
          loadSessions();
        } catch (error) {
          console.error("Revoke session error:", error);
          setMessage({
            type: "error",
            text: error instanceof Error ? error.message : "Failed to revoke session"
          });
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleRevokeAllUserSessions = (userId: string, userName: string) => {
    setConfirmDialog({
      open: true,
      title: "Revoke All Sessions",
      description: `Are you sure you want to revoke all sessions for ${userName}? This will log them out of all devices.`,
      onConfirm: async () => {
        try {
          // Use the revokeUserSessions API to revoke all sessions at once
          const result = await authClient.admin.revokeUserSessions({
            userId: userId,
          });

          if (result.error) {
            throw new Error(result.error.message || "Failed to revoke sessions");
          }

          setMessage({ type: "success", text: `All sessions for ${userName} revoked` });
          loadSessions();
        } catch (error) {
          console.error("Revoke all sessions error:", error);
          setMessage({
            type: "error",
            text: error instanceof Error ? error.message : "Failed to revoke sessions"
          });
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceInfo = (userAgent: string) => {
    // Simple parser - in production, use a proper UA parser library
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown Browser";
  };

  const isExpiringSoon = (expiresAt: Date) => {
    const hoursUntilExpiry = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold">Session Management</h1>
          <p className="text-muted-foreground">Monitor and manage active user sessions</p>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Card className="flex-shrink-0">
          <CardHeader>
            <CardTitle>Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Mobile Devices</p>
                <p className="text-2xl font-bold">
                  {sessions.filter((s) => s.userAgent.toLowerCase().includes("mobile")).length}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Desktop Devices</p>
                <p className="text-2xl font-bold">
                  {sessions.filter((s) => !s.userAgent.toLowerCase().includes("mobile")).length}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">
                  {sessions.filter((s) => isExpiringSoon(s.expiresAt)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              {filteredSessions.length} active session{filteredSessions.length !== 1 ? "s" : ""} across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4 min-h-0">
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name, email, or device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="flex-1 pr-4" type="auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No sessions match your search" : "No active sessions found"}
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {paginatedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-muted-foreground">
                          {getDeviceIcon(session.userAgent)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{session.userName}</p>
                            <Badge variant="outline" className="text-xs">
                              {session.userEmail}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{getDeviceInfo(session.userAgent)}</span>
                            {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                            <span>Last active: {new Date(session.updatedAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {isExpiringSoon(session.expiresAt) && (
                            <Badge variant="destructive" className="mb-1">
                              Expiring Soon
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(session.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeSession(session.token, session.userName)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeAllUserSessions(session.userId, session.userName)}
                        >
                          Revoke All
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {filteredSessions.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredSessions.length)} of {filteredSessions.length} sessions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
    </>
  );
}
